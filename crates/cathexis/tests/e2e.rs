//! End-to-end scenario tests for the CATHEXIS trust-handle pipeline.
//!
//! These tests exercise the **complete flow** from raw evidence to per-agent
//! handle queries, verifying semantic correctness at each step:
//!
//! ```text
//! raw evidence (r, s, K)
//!   → EQBSL Opinion (b, d, u, a)
//!   → feature extraction (embedding + scalars + graph stats)
//!   → MLP categorization (probability vector + hard assignment)
//!   → category summaries (mean, covariance, member lists)
//!   → label generation (HeuristicLabelProvider)
//!   → per-agent handle queries
//! ```
//!
//! Unlike the unit and integration tests, e2e tests assert **semantic
//! correctness**: agents with strong positive evidence must end up in a
//! different category from agents with strong negative evidence, and their
//! generated labels must reflect that difference.
//!
//! # Test network
//!
//! Five agents arranged in a partial mesh:
//!
//! ```text
//!   alice ── bob ── dave ── eve
//!     \     /  \
//!      carol    (dave also connects carol)
//! ```
//!
//! Trust tiers (Evidence K=2, base_rate=0.5):
//!
//! | Agent | r  | s  | E\[trust\] | Tier     |
//! |-------|----|----|------------|----------|
//! | alice | 20 |  1 | ≈ 0.913    | Trusted  |
//! | bob   | 10 |  4 | ≈ 0.688    | Trusted  |
//! | carol |  5 |  5 | = 0.500    | Trusted  |
//! | dave  |  2 | 10 | ≈ 0.214    | High-Risk|
//! | eve   |  1 | 20 | ≈ 0.087    | High-Risk|
//!
//! # MLP design
//!
//! Feature vector (6 dims for 2-D embedding with `with_graph_stats()`):
//! ```text
//! [emb[0], emb[1], E[trust], u, degree, clustering]
//!   idx 0    idx 1   idx 2   idx 3  idx 4    idx 5
//! ```
//!
//! The MLP (6 → 4 hidden → 2 output) is designed so that:
//! - **Hidden neuron 0** (H0) activates on *high* E\[trust\]: `relu(5·E[trust])`
//! - **Hidden neuron 1** (H1) activates on *low*  E\[trust\]: `relu(-5·E[trust] + 2.5)`,
//!   which is positive only when `E[trust] < 0.5`.
//! - **Category 0** (Trusted)   wins when `3·H0 - 3·H1 > -3·H0 + 3·H1`, i.e. E\[trust\] > 0.25.
//! - **Category 1** (High-Risk) wins when E\[trust\] < 0.25.
//!
//! This is analytically verified for every agent above.

use cathexis::{
    BatchInput, CathexisEngine, Evidence, EqbslState, FeatureContext, FeatureExtractor,
    GraphSnapshot, HeuristicLabelProvider, InMemoryLabelStore, LabelStore, MlpCategorizer,
    NodeState, QueryInput, StaticFeatureExtractor,
};

// ── Shared scenario builders ──────────────────────────────────────────────────

/// The 5-agent trust graph used in every scenario.
///
/// ```text
///   alice ── bob ── dave ── eve
///     \     /  \
///      carol    carol (carol also connects dave)
/// ```
fn scenario_graph() -> GraphSnapshot {
    GraphSnapshot::from_nodes_and_edges(
        ["alice", "bob", "carol", "dave", "eve"],
        [
            ("alice", "bob"),
            ("alice", "carol"),
            ("bob", "carol"),
            ("bob", "dave"),
            ("carol", "dave"),
            ("dave", "eve"),
        ],
    )
}

/// Epoch 1 EQBSL state — clear trust gradient across two tiers.
///
/// E[trust] = (r + 1) / (r + s + 2)  (with K=2, a=0.5)
///
/// - alice: r=20, s= 1 → E = 21/23 ≈ 0.913
/// - bob:   r=10, s= 4 → E = 11/16 = 0.688
/// - carol: r= 5, s= 5 → E =  6/12 = 0.500
/// - dave:  r= 2, s=10 → E =  3/14 ≈ 0.214  (< 0.25 threshold)
/// - eve:   r= 1, s=20 → E =  2/23 ≈ 0.087  (< 0.25 threshold)
fn epoch1_eqbsl() -> EqbslState {
    EqbslState::new([
        NodeState::from_evidence("alice", vec![0.9, 0.05],  20.0,  1.0, 0.5).unwrap(),
        NodeState::from_evidence("bob",   vec![0.7, 0.15],  10.0,  4.0, 0.5).unwrap(),
        NodeState::from_evidence("carol", vec![0.45, 0.45],  5.0,  5.0, 0.5).unwrap(),
        NodeState::from_evidence("dave",  vec![0.2, 0.6],    2.0, 10.0, 0.5).unwrap(),
        NodeState::from_evidence("eve",   vec![0.05, 0.85],  1.0, 20.0, 0.5).unwrap(),
    ])
}

/// MLP designed to split agents on E[trust] ≈ 0.25.
///
/// Input dim = 6 (2-D embedding + `with_graph_stats()`).
///
/// Weight derivation (let E = feature[2] = E[trust]):
///   H0 = relu(5·E + 0)        — "high-trust" neuron
///   H1 = relu(−5·E + 2.5)     — "low-trust"  neuron (b1[1] = 2.5)
///   H2 = relu(degree)
///   H3 = relu(clustering)
///
///   logit[Cat0] = 3·H0 − 3·H1
///   logit[Cat1] = −3·H0 + 3·H1
///
/// Boundary: logit[Cat0] = logit[Cat1]
///   ⟹ 30E − 7.5 = 7.5 − 30E  ⟹  E = 0.25
fn scenario_categorizer() -> MlpCategorizer {
    MlpCategorizer::new(
        6, // input_dim: 2-D embedding + E[trust] + u + degree + clustering
        4, // hidden_dim
        vec![
            // H0: activates on high E[trust] (feature index 2)
            0.0, 0.0, 5.0, 0.0, 0.0, 0.0,
            // H1: activates on low E[trust]  (b1[1] = 2.5 shifts threshold to E = 0.5)
            0.0, 0.0, -5.0, 0.0, 0.0, 0.0,
            // H2: degree signal
            0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            // H3: clustering signal
            0.0, 0.0, 0.0, 0.0, 0.0, 1.0,
        ],
        vec![0.0, 2.5, 0.0, 0.0], // b1: bias on H1 sets trust threshold at E = 0.25
        2,                         // 2 output categories
        vec![
            // Cat 0 (Trusted):   H0 beats H1
            3.0, -3.0, 0.0, 0.0,
            // Cat 1 (High-Risk): H1 beats H0
            -3.0, 3.0, 0.0, 0.0,
        ],
        vec![0.0, 0.0], // b2
    )
    .unwrap()
}

fn scenario_engine() -> CathexisEngine<StaticFeatureExtractor, MlpCategorizer, InMemoryLabelStore> {
    CathexisEngine::new(
        StaticFeatureExtractor::with_graph_stats(),
        scenario_categorizer(),
        InMemoryLabelStore::default(),
    )
}

// ── E2E Test 1: Evidence math consistency ─────────────────────────────────────

/// Verify that the E\[trust\] value stored in the feature vector exactly matches
/// the value derived from the EBSL evidence formula.
///
/// This test confirms the Evidence → Opinion → FeatureExtractor chain is
/// self-consistent before any categorization happens.
#[test]
fn e2e_evidence_math_round_trip() {
    let graph = scenario_graph();
    let eqbsl = epoch1_eqbsl();

    let extractor = StaticFeatureExtractor::with_graph_stats();
    let ctx = FeatureContext { graph: &graph, eqbsl: &eqbsl, snapshot_time: 1 };

    // alice: r=20, s=1, K=2 → E[trust] = (r+1)/(r+s+K) where 1 = a·K with a=0.5, K=2
    //   b = 20/23, u = 2/23 → E = b + 0.5·u = 20/23 + 1/23 = 21/23
    let alice_e = Evidence::binary(20.0, 1.0).unwrap().to_opinion(0.5).expected_probability();
    let alice_f = extractor.compute_features("alice", &ctx).unwrap();
    assert!(
        (alice_f.vector[2] - alice_e).abs() < 1e-10,
        "alice feature[2]={:.10} ≠ manual E[trust]={:.10}",
        alice_f.vector[2],
        alice_e
    );

    // eve: r=1, s=20, K=2 → E[trust] = 2/23
    let eve_e = Evidence::binary(1.0, 20.0).unwrap().to_opinion(0.5).expected_probability();
    let eve_f = extractor.compute_features("eve", &ctx).unwrap();
    assert!(
        (eve_f.vector[2] - eve_e).abs() < 1e-10,
        "eve feature[2]={:.10} ≠ manual E[trust]={:.10}",
        eve_f.vector[2],
        eve_e
    );

    // dave: r=2, s=10, K=2 → E[trust] = 3/14
    let dave_e = Evidence::binary(2.0, 10.0).unwrap().to_opinion(0.5).expected_probability();
    let dave_f = extractor.compute_features("dave", &ctx).unwrap();
    assert!(
        (dave_f.vector[2] - dave_e).abs() < 1e-10,
        "dave feature[2]={:.10} ≠ manual E[trust]={:.10}",
        dave_f.vector[2],
        dave_e
    );

    // Ordering: alice > bob > carol > dave > eve
    let bob_f   = extractor.compute_features("bob",   &ctx).unwrap();
    let carol_f = extractor.compute_features("carol", &ctx).unwrap();

    assert!(alice_f.vector[2] > bob_f.vector[2],   "alice E[trust] > bob");
    assert!(bob_f.vector[2]   > carol_f.vector[2], "bob   E[trust] > carol");
    assert!(carol_f.vector[2] > dave_f.vector[2],  "carol E[trust] > dave");
    assert!(dave_f.vector[2]  > eve_f.vector[2],   "dave  E[trust] > eve");
}

// ── E2E Test 2: Trust-tier separation ────────────────────────────────────────

/// Verify the full pipeline places agents in the analytically-predicted categories.
///
/// - Alice / Bob / Carol → Category 0 (Trusted,    E[trust] > 0.25)
/// - Dave  / Eve         → Category 1 (High-Risk,  E[trust] < 0.25)
///
/// The MLP weights are analytically designed to guarantee this split at E = 0.25.
#[test]
fn e2e_trust_tier_separation() {
    let graph = scenario_graph();
    let eqbsl = epoch1_eqbsl();
    let mut engine = scenario_engine();

    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();

    let category_for = |id: &str| -> usize {
        batch
            .assignments
            .iter()
            .find(|a| a.agent_id == id)
            .unwrap_or_else(|| panic!("agent {id} not found in batch"))
            .category_id
    };

    // Tier A — all must be in Category 0
    assert_eq!(category_for("alice"), 0, "alice (E≈0.913) must be in Category 0 (Trusted)");
    assert_eq!(category_for("bob"),   0, "bob   (E≈0.688) must be in Category 0 (Trusted)");
    assert_eq!(category_for("carol"), 0, "carol (E=0.500) must be in Category 0 (Trusted)");

    // Tier B — all must be in Category 1
    assert_eq!(category_for("dave"), 1, "dave (E≈0.214) must be in Category 1 (High-Risk)");
    assert_eq!(category_for("eve"),  1, "eve  (E≈0.087) must be in Category 1 (High-Risk)");

    // Each agent's probability vector must sum to 1
    for a in &batch.assignments {
        let sum: f64 = a.probabilities.iter().sum();
        assert!((sum - 1.0).abs() < 1e-9, "{} prob sum = {}", a.agent_id, sum);
    }

    // Category 0 summary has 3 members, Category 1 has 2
    let cat0 = batch.summaries.by_category(0).expect("Category 0 summary missing");
    let cat1 = batch.summaries.by_category(1).expect("Category 1 summary missing");
    assert_eq!(cat0.members.len(), 3, "Category 0 should have 3 members");
    assert_eq!(cat1.members.len(), 2, "Category 1 should have 2 members");

    // Mean E[trust] of Category 0 must exceed mean E[trust] of Category 1
    // E[trust] lives at feature index 2
    assert!(
        cat0.mean[2] > cat1.mean[2],
        "Category 0 mean E[trust] ({:.4}) must exceed Category 1 ({:.4})",
        cat0.mean[2],
        cat1.mean[2]
    );
}

// ── E2E Test 3: Label semantic correctness ───────────────────────────────────

/// After running batch + label refresh, verify:
/// 1. Both categories receive non-empty labels.
/// 2. The two labels are distinct (different handle strings).
/// 3. Each label references its category ID.
#[test]
fn e2e_label_semantic_correctness() {
    let graph = scenario_graph();
    let eqbsl = epoch1_eqbsl();
    let mut engine = scenario_engine();

    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch, &mut provider);

    let record0 = engine.labels().get(0).expect("label for Category 0 missing");
    let record1 = engine.labels().get(1).expect("label for Category 1 missing");

    let handle0 = &record0.label.handle;
    let handle1 = &record1.label.handle;

    // Both must be non-empty
    assert!(!handle0.is_empty(), "Category 0 handle is empty");
    assert!(!handle1.is_empty(), "Category 1 handle is empty");

    // Must carry their category ID
    assert!(handle0.contains('0'), "Category 0 handle must reference '0': {handle0}");
    assert!(handle1.contains('1'), "Category 1 handle must reference '1': {handle1}");

    // Must be distinct — trust tiers should never share a label
    assert_ne!(
        handle0, handle1,
        "Trusted and High-Risk categories must have different labels"
    );

    // Descriptions must also be non-empty
    assert!(!record0.label.gloss.is_empty());
    assert!(!record1.label.gloss.is_empty());
}

// ── E2E Test 4: Per-agent handle queries ─────────────────────────────────────

/// Query every agent's handle after a batch + label refresh and verify:
/// 1. All 5 queries succeed.
/// 2. Probability vectors sum to 1.
/// 3. Alice and Eve receive *different* labels (different trust tiers).
/// 4. Alice's category ≠ Eve's category.
#[test]
fn e2e_per_agent_handle_queries() {
    let graph = scenario_graph();
    let eqbsl = epoch1_eqbsl();
    let mut engine = scenario_engine();

    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch, &mut provider);

    // All agents must be queryable
    for agent in &["alice", "bob", "carol", "dave", "eve"] {
        let resp = engine
            .query_agent_handle(QueryInput { now: 2, agent_id: agent, graph: &graph, eqbsl: &eqbsl })
            .unwrap_or_else(|e| panic!("query for {agent} failed: {e}"));

        let prob_sum: f64 = resp.probabilities.iter().sum();
        assert!((prob_sum - 1.0).abs() < 1e-9, "{agent} prob sum = {prob_sum}");
        assert!(!resp.label.is_empty(),       "{agent} label is empty");
        assert!(!resp.description.is_empty(), "{agent} description is empty");
        assert!(resp.category_id < 2,         "{agent} category_id out of range");
    }

    // Semantic check: alice (Trusted) and eve (High-Risk) must differ
    let alice_resp = engine
        .query_agent_handle(QueryInput { now: 2, agent_id: "alice", graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    let eve_resp = engine
        .query_agent_handle(QueryInput { now: 2, agent_id: "eve", graph: &graph, eqbsl: &eqbsl })
        .unwrap();

    assert_ne!(alice_resp.category_id, eve_resp.category_id,
        "alice and eve must be in different categories");
    assert_ne!(alice_resp.label, eve_resp.label,
        "alice and eve must have different handle labels");

    // alice's probability of being in Cat 0 must exceed eve's
    assert!(
        alice_resp.probabilities[0] > eve_resp.probabilities[0],
        "alice Cat0 probability ({:.4}) must exceed eve's ({:.4})",
        alice_resp.probabilities[0],
        eve_resp.probabilities[0]
    );
}

// ── E2E Test 5: Evidence drift and label refresh ─────────────────────────────

/// Multi-epoch scenario: Dave accumulates positive evidence and moves from
/// Category 1 (High-Risk) in Epoch 1 to Category 0 (Trusted) in Epoch 2.
///
/// Verifies:
/// 1. Dave is in Cat 1 in Epoch 1 (as in `e2e_trust_tier_separation`).
/// 2. Dave is in Cat 0 in Epoch 2 after improvement.
/// 3. Category 1 shrinks from 2 members to 1 member.
/// 4. Drift signal is detected for Category 1 (membership change).
/// 5. Labels refresh correctly after the drift.
#[test]
fn e2e_drift_and_label_refresh() {
    let graph = scenario_graph();

    // Epoch 1: Dave is High-Risk (r=2, s=10 → E ≈ 0.214 < 0.25)
    let eqbsl1 = epoch1_eqbsl();
    let mut engine = scenario_engine();

    let batch1 = engine
        .run_batch(BatchInput { snapshot_time: 10, graph: &graph, eqbsl: &eqbsl1 })
        .unwrap();
    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch1, &mut provider);

    let dave_cat1 = batch1
        .assignments
        .iter()
        .find(|a| a.agent_id == "dave")
        .unwrap()
        .category_id;
    assert_eq!(dave_cat1, 1, "Epoch 1: dave must start in Category 1 (High-Risk)");

    let cat1_members_epoch1 = batch1
        .summaries
        .by_category(1)
        .expect("Category 1 summary missing in epoch 1")
        .members
        .len();
    assert_eq!(cat1_members_epoch1, 2, "Epoch 1: Category 1 must have 2 members (dave, eve)");

    // Epoch 2: Dave dramatically improves (r=15, s=2 → E = 16/19 ≈ 0.842 > 0.25)
    let eqbsl2 = EqbslState::new([
        NodeState::from_evidence("alice", vec![0.9, 0.05],  20.0,  1.0, 0.5).unwrap(),
        NodeState::from_evidence("bob",   vec![0.7, 0.15],  10.0,  4.0, 0.5).unwrap(),
        NodeState::from_evidence("carol", vec![0.45, 0.45],  5.0,  5.0, 0.5).unwrap(),
        // Dave improved: 15 positive interactions vs 2 negative
        NodeState::from_evidence("dave",  vec![0.7, 0.15],  15.0,  2.0, 0.5).unwrap(),
        NodeState::from_evidence("eve",   vec![0.05, 0.85],  1.0, 20.0, 0.5).unwrap(),
    ]);

    let batch2 = engine
        .run_batch(BatchInput { snapshot_time: 20, graph: &graph, eqbsl: &eqbsl2 })
        .unwrap();
    engine.refresh_labels(&batch2, &mut provider);

    let dave_cat2 = batch2
        .assignments
        .iter()
        .find(|a| a.agent_id == "dave")
        .unwrap()
        .category_id;
    assert_eq!(dave_cat2, 0, "Epoch 2: dave must move to Category 0 (Trusted) after improvement");

    // Category 1 now has only 1 member (eve)
    let cat1_members_epoch2 = batch2
        .summaries
        .by_category(1)
        .expect("Category 1 summary missing in epoch 2")
        .members
        .len();
    assert_eq!(cat1_members_epoch2, 1, "Epoch 2: Category 1 must have only 1 member (eve)");

    // Category 0 has all four remaining agents
    let cat0_members_epoch2 = batch2
        .summaries
        .by_category(0)
        .expect("Category 0 summary missing in epoch 2")
        .members
        .len();
    assert_eq!(cat0_members_epoch2, 4, "Epoch 2: Category 0 must have 4 members");

    // Drift check: Category 1 changed membership (dave left)
    use cathexis::InMemoryLabelStore;
    let prev_summary = batch1.summaries.by_category(1).unwrap();
    let curr_summary = batch2.summaries.by_category(1).unwrap();
    let drift = InMemoryLabelStore::record_drift(prev_summary, curr_summary);

    // dave was in prev but not curr → membership_change_ratio = 1 removed / 2 union = 0.5
    assert!(
        drift.membership_change_ratio > 0.0,
        "drift.membership_change_ratio must be > 0 when a member leaves: {}",
        drift.membership_change_ratio
    );

    // Labels for epoch 2 must be present for both categories
    assert!(engine.labels().get(0).is_some(), "Category 0 label missing after epoch 2");
    assert!(engine.labels().get(1).is_some(), "Category 1 label missing after epoch 2");
}

// ── E2E Test 6: Full round-trip ───────────────────────────────────────────────

/// Smoke-test the complete pipeline end-to-end:
/// evidence → batch → labels → query all agents → validate all outputs.
///
/// No category-specific assertions — just that the system produces well-formed
/// output for every agent without panicking or returning an error.
#[test]
fn e2e_full_round_trip() {
    let graph = scenario_graph();
    let eqbsl = epoch1_eqbsl();
    let mut engine = scenario_engine();

    // Step 1: batch
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 42, graph: &graph, eqbsl: &eqbsl })
        .unwrap();

    assert_eq!(batch.assignments.len(), 5,       "all 5 agents must be assigned");
    assert_eq!(batch.features.len(),   5,         "all 5 feature vectors must be produced");
    assert_eq!(batch.snapshot_time,   42,         "snapshot_time must be preserved");
    assert!(!batch.summaries.summaries.is_empty(), "at least one category summary required");

    for a in &batch.assignments {
        let sum: f64 = a.probabilities.iter().sum();
        assert!((sum - 1.0).abs() < 1e-9, "{} probs sum = {}", a.agent_id, sum);
        assert!(a.category_id < 2, "{} category_id out of range", a.agent_id);
    }

    // Step 2: generate labels
    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch, &mut provider);

    for summary in &batch.summaries.summaries {
        let record = engine
            .labels()
            .get(summary.category_id)
            .unwrap_or_else(|| panic!("label missing for category {}", summary.category_id));
        assert!(!record.label.handle.is_empty());
        assert!(!record.label.gloss.is_empty());
    }

    // Step 3: query every agent
    let agents = ["alice", "bob", "carol", "dave", "eve"];
    let mut responses = Vec::new();
    for agent in agents {
        let resp = engine
            .query_agent_handle(QueryInput {
                now: 42,
                agent_id: agent,
                graph: &graph,
                eqbsl: &eqbsl,
            })
            .unwrap_or_else(|e| panic!("query for {agent} failed: {e}"));

        assert!(!resp.label.is_empty(),       "{agent}: label is empty");
        assert!(!resp.description.is_empty(), "{agent}: description is empty");
        let prob_sum: f64 = resp.probabilities.iter().sum();
        assert!((prob_sum - 1.0).abs() < 1e-9, "{agent}: prob sum = {prob_sum}");
        responses.push(resp);
    }

    // The MLP must use at least 2 distinct categories across 5 agents
    let unique_cats: std::collections::BTreeSet<_> =
        responses.iter().map(|r| r.category_id).collect();
    assert!(
        unique_cats.len() >= 2,
        "all 5 agents landed in the same category — MLP is not discriminating"
    );
}

// ── E2E Test 7: Hypergraph feature enrichment ─────────────────────────────────

/// Verify that adding a hyperedge enriches the feature vectors of its members
/// and the pipeline still runs to completion correctly.
///
/// Alice, Bob, and Carol form a trust triad (3-node hyperedge). Their
/// hyperedge-aware feature vectors must be larger than their graph-only
/// counterparts, and the pipeline must produce well-formed output.
#[test]
fn e2e_hypergraph_enrichment() {
    let mut graph = scenario_graph();
    // Alice, Bob, Carol form a trust triad
    graph.add_hyperedge(["alice", "bob", "carol"]);

    let eqbsl = epoch1_eqbsl();

    // Build an 8-dim MLP: 2-D embedding + E[trust] + u + degree + clustering +
    // hyperedge_count + mean_hyperedge_size
    let categorizer = MlpCategorizer::new(
        8,
        4,
        vec![
            // H0: high-trust signal (E[trust] at index 2)
            0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            // H1: low-trust signal
            0.0, 0.0, -5.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            // H2: degree
            0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0,
            // H3: hyperedge count (new feature)
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
        ],
        vec![0.0, 2.5, 0.0, 0.0],
        2,
        vec![
            3.0, -3.0, 0.0, 0.0,
            -3.0, 3.0, 0.0, 0.0,
        ],
        vec![0.0, 0.0],
    )
    .unwrap();

    let mut engine = CathexisEngine::new(
        StaticFeatureExtractor::with_graph_and_hypergraph_stats(),
        categorizer,
        InMemoryLabelStore::default(),
    );

    // Extract features individually and verify dimension
    {
        let extractor = StaticFeatureExtractor::with_graph_and_hypergraph_stats();
        let ctx = FeatureContext { graph: &graph, eqbsl: &eqbsl, snapshot_time: 1 };

        for agent in &["alice", "bob", "carol", "dave", "eve"] {
            let f = extractor.compute_features(agent, &ctx).unwrap();
            assert_eq!(
                f.vector.len(),
                8,
                "{agent} feature dim={} (expected 8 for hypergraph extractor)",
                f.vector.len()
            );
        }

        // Members of the hyperedge must have hyperedge_count = 1
        let alice_f = extractor.compute_features("alice", &ctx).unwrap();
        assert!(
            (alice_f.vector[6] - 1.0).abs() < 1e-12,
            "alice hyperedge_count feature = {} (expected 1.0)",
            alice_f.vector[6]
        );

        // Eve is NOT in the hyperedge → hyperedge_count = 0
        let eve_f = extractor.compute_features("eve", &ctx).unwrap();
        assert!(
            (eve_f.vector[6]).abs() < 1e-12,
            "eve hyperedge_count feature = {} (expected 0.0)",
            eve_f.vector[6]
        );
    }

    // Full pipeline must succeed with the enriched features
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    assert_eq!(batch.assignments.len(), 5);

    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch, &mut provider);

    for agent in &["alice", "bob", "carol", "dave", "eve"] {
        engine
            .query_agent_handle(QueryInput { now: 1, agent_id: agent, graph: &graph, eqbsl: &eqbsl })
            .unwrap_or_else(|e| panic!("query for {agent} failed: {e}"));
    }

    // Trust separation must still hold with enriched features
    let category_for = |id: &str| -> usize {
        batch.assignments.iter().find(|a| a.agent_id == id).unwrap().category_id
    };
    assert_eq!(category_for("alice"), 0);
    assert_eq!(category_for("bob"),   0);
    assert_eq!(category_for("carol"), 0);
    assert_eq!(category_for("dave"),  1);
    assert_eq!(category_for("eve"),   1);
}

// ── E2E Test 8: Covariance-aware category summaries ──────────────────────────

/// With CovarianceMode::Full, category summaries must include a non-None
/// covariance matrix that is symmetric and has the correct dimension.
///
/// This exercises the full summary-building code path including covariance.
#[test]
fn e2e_covariance_aware_summaries() {
    use cathexis::CovarianceMode;

    let graph = scenario_graph();
    let eqbsl = epoch1_eqbsl();

    let mut engine = CathexisEngine::new(
        StaticFeatureExtractor::with_graph_stats(),
        scenario_categorizer(),
        InMemoryLabelStore::default(),
    )
    .with_covariance_mode(CovarianceMode::Full);

    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();

    for summary in &batch.summaries.summaries {
        if summary.members.len() >= 2 {
            let cov = summary
                .covariance
                .as_ref()
                .unwrap_or_else(|| panic!("covariance missing for category {}", summary.category_id));

            // Must be a 6×6 matrix
            assert_eq!(cov.len(), 6, "covariance rows ≠ 6");
            for row in cov {
                assert_eq!(row.len(), 6, "covariance cols ≠ 6");
            }

            // Must be symmetric within floating-point tolerance
            for i in 0..6 {
                for j in 0..6 {
                    assert!(
                        (cov[i][j] - cov[j][i]).abs() < 1e-10,
                        "covariance not symmetric at [{i}][{j}]: {} vs {}",
                        cov[i][j],
                        cov[j][i]
                    );
                }
            }

            // Diagonal (variances) must be non-negative
            for i in 0..6 {
                assert!(
                    cov[i][i] >= -1e-10,
                    "negative variance at [{i}][{i}] = {}",
                    cov[i][i]
                );
            }
        }
    }
}

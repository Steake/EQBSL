//! Integration tests for the CATHEXIS pipeline: feature extraction, batch processing,
//! label refresh, drift detection, and online query.

use cathexis::{
    BatchInput, CathexisEngine, CategoryLabel, CathexisError, CovarianceMode,
    DriftSignal, EqbslState, GraphSnapshot, HeuristicLabelProvider, InMemoryLabelStore,
    LabelRecord, LabelStore, LabelUpdatePolicy, MlpCategorizer, NodeState,
    QueryInput, StaticFeatureExtractor,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Build a realistic 5-node trust graph.
fn test_graph() -> GraphSnapshot {
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

/// Build EQBSL state using real Evidence (K=2, base_rate=0.5).
fn test_eqbsl() -> EqbslState {
    EqbslState::new([
        NodeState::from_evidence("alice", vec![0.9, 0.05, 0.05], 20.0, 2.0, 0.5).unwrap(),
        NodeState::from_evidence("bob",   vec![0.6, 0.2,  0.2],  10.0, 4.0, 0.5).unwrap(),
        NodeState::from_evidence("carol", vec![0.4, 0.3,  0.3],   6.0, 6.0, 0.5).unwrap(),
        NodeState::from_evidence("dave",  vec![0.3, 0.4,  0.3],   4.0, 8.0, 0.5).unwrap(),
        NodeState::from_evidence("eve",   vec![0.1, 0.6,  0.3],   2.0, 12.0, 0.5).unwrap(),
    ])
}

/// 7-input, 3-hidden, 2-category MLP matching StaticFeatureExtractor::with_graph_stats().
fn test_categorizer() -> MlpCategorizer {
    // Feature vector layout (7 dims):
    //   [0..3) trust embedding (3-d), [3] E[trust], [4] uncertainty, [5] degree, [6] clustering
    MlpCategorizer::new(
        7,
        3,
        // w1: 3 × 7
        vec![
             0.5,  0.2, -0.1,  0.8, -0.3,  0.1,  0.0,
            -0.2,  0.6,  0.3, -0.4,  0.5, -0.1,  0.2,
             0.1, -0.3,  0.4,  0.2,  0.1,  0.7, -0.2,
        ],
        vec![0.0; 3],
        2,
        // w2: 2 × 3
        vec![
             0.7, -0.4,  0.2,
            -0.3,  0.6, -0.1,
        ],
        vec![0.0; 2],
    )
    .unwrap()
}

fn test_engine() -> CathexisEngine<StaticFeatureExtractor, MlpCategorizer, InMemoryLabelStore> {
    CathexisEngine::new(
        StaticFeatureExtractor::with_graph_stats(),
        test_categorizer(),
        InMemoryLabelStore::default(),
    )
}

// ── Feature extraction ────────────────────────────────────────────────────────

#[test]
fn feature_vector_has_correct_dimension() {
    use cathexis::{FeatureContext, FeatureExtractor, StaticFeatureExtractor};
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let ctx = FeatureContext {
        graph: &graph,
        eqbsl: &eqbsl,
        snapshot_time: 1,
    };
    let extractor = StaticFeatureExtractor::with_graph_stats();
    let f = extractor.compute_features("alice", &ctx).unwrap();
    // embedding(3) + E[trust](1) + uncertainty(1) + degree(1) + clustering(1) = 7
    assert_eq!(f.vector.len(), 7, "feature vector length={}", f.vector.len());
}

#[test]
fn feature_extractor_missing_node_returns_error() {
    use cathexis::{FeatureContext, FeatureExtractor, StaticFeatureExtractor};
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let ctx = FeatureContext {
        graph: &graph,
        eqbsl: &eqbsl,
        snapshot_time: 1,
    };
    let err = StaticFeatureExtractor::with_graph_stats()
        .compute_features("unknown_agent", &ctx)
        .unwrap_err();
    assert!(matches!(err, CathexisError::MissingNode(ref id) if id == "unknown_agent"));
}

#[test]
fn feature_expected_trust_reflects_opinion() {
    use cathexis::{Evidence, FeatureContext, FeatureExtractor, StaticFeatureExtractor};
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let ctx = FeatureContext {
        graph: &graph,
        eqbsl: &eqbsl,
        snapshot_time: 1,
    };
    let extractor = StaticFeatureExtractor::with_graph_stats();
    let f = extractor.compute_features("alice", &ctx).unwrap();

    // alice: r=20, s=2, K=2 → E[trust] = b + 0.5*u
    let ev = Evidence::binary(20.0, 2.0).unwrap();
    let op = ev.to_opinion(0.5);
    let expected_trust = op.expected_probability();
    // f.vector[3] is the E[trust] component
    assert!(
        (f.vector[3] - expected_trust).abs() < 1e-12,
        "expected_trust in feature={}, computed={}",
        f.vector[3],
        expected_trust
    );
}

// ── Batch processing ──────────────────────────────────────────────────────────

#[test]
fn batch_produces_one_assignment_per_node() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    assert_eq!(batch.assignments.len(), 5, "should assign all 5 agents");
    assert_eq!(batch.features.len(), 5, "should extract features for all 5 agents");
}

#[test]
fn batch_category_ids_are_in_range() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    for a in &batch.assignments {
        assert!(a.category_id < 2, "category_id={} out of range [0,2)", a.category_id);
    }
}

#[test]
fn batch_probabilities_sum_to_one() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    for a in &batch.assignments {
        let total: f64 = a.probabilities.iter().sum();
        assert!(
            (total - 1.0).abs() < 1e-9,
            "agent={} probs don't sum to 1: {total}",
            a.agent_id
        );
    }
}

#[test]
fn batch_summaries_cover_assigned_categories() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();

    let summary_categories: std::collections::BTreeSet<_> =
        batch.summaries.summaries.iter().map(|s| s.category_id).collect();
    for a in &batch.assignments {
        assert!(
            summary_categories.contains(&a.category_id),
            "category {} was assigned but has no summary",
            a.category_id
        );
    }
}

#[test]
fn batch_summary_members_match_assignments() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();

    for summary in &batch.summaries.summaries {
        let expected_members: std::collections::BTreeSet<_> = batch
            .assignments
            .iter()
            .filter(|a| a.category_id == summary.category_id)
            .map(|a| a.agent_id.as_str())
            .collect();
        let actual_members: std::collections::BTreeSet<_> =
            summary.members.iter().map(String::as_str).collect();
        assert_eq!(
            expected_members, actual_members,
            "summary members don't match assignments for category {}",
            summary.category_id
        );
    }
}

#[test]
fn batch_summary_mean_vector_has_correct_dimension() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    for summary in &batch.summaries.summaries {
        assert_eq!(
            summary.mean.len(),
            7,
            "summary mean has wrong dimension for category {}",
            summary.category_id
        );
    }
}

#[test]
fn batch_covariance_mode_none_gives_no_covariance() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    // Default is CovarianceMode::None
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    for summary in &batch.summaries.summaries {
        assert!(
            summary.covariance.is_none(),
            "expected no covariance for category {}",
            summary.category_id
        );
    }
}

#[test]
fn batch_covariance_mode_full_gives_covariance_matrix() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = CathexisEngine::new(
        StaticFeatureExtractor::with_graph_stats(),
        test_categorizer(),
        InMemoryLabelStore::default(),
    )
    .with_covariance_mode(CovarianceMode::Full);

    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();

    // Each category with ≥ 2 members should have a non-None covariance
    for summary in &batch.summaries.summaries {
        if summary.members.len() >= 2 {
            assert!(
                summary.covariance.is_some(),
                "expected covariance for category {} (members={})",
                summary.category_id,
                summary.members.len()
            );
            let cov = summary.covariance.as_ref().unwrap();
            assert_eq!(cov.len(), 7, "covariance matrix rows");
            for row in cov {
                assert_eq!(row.len(), 7, "covariance matrix cols");
            }
        }
    }
}

// ── Label refresh ─────────────────────────────────────────────────────────────

#[test]
fn label_refresh_populates_labels_for_all_categories() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch, &mut provider);

    for summary in &batch.summaries.summaries {
        let record = engine.labels().get(summary.category_id);
        assert!(
            record.is_some(),
            "no label for category {}",
            summary.category_id
        );
    }
}

#[test]
fn heuristic_label_handle_contains_trust_cluster() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch, &mut provider);

    for summary in &batch.summaries.summaries {
        let record = engine.labels().get(summary.category_id).unwrap();
        assert!(
            record.label.handle.contains("trust-cluster"),
            "handle doesn't mention 'trust-cluster': {}",
            record.label.handle
        );
    }
}

// ── Online query ──────────────────────────────────────────────────────────────

#[test]
fn query_after_batch_and_refresh_succeeds() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch, &mut provider);

    let resp = engine
        .query_agent_handle(QueryInput {
            now: 2,
            agent_id: "alice",
            graph: &graph,
            eqbsl: &eqbsl,
        })
        .unwrap();

    assert!(resp.category_id < 2);
    let prob_sum: f64 = resp.probabilities.iter().sum();
    assert!((prob_sum - 1.0).abs() < 1e-9);
    assert!(!resp.label.is_empty());
    assert!(!resp.description.is_empty());
}

#[test]
fn query_without_label_refresh_returns_missing_label_error() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    // Run batch but do NOT refresh labels
    engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();

    let err = engine
        .query_agent_handle(QueryInput {
            now: 2,
            agent_id: "alice",
            graph: &graph,
            eqbsl: &eqbsl,
        })
        .unwrap_err();
    assert!(
        matches!(err, CathexisError::MissingLabel(_)),
        "expected MissingLabel, got {err:?}"
    );
}

#[test]
fn query_unknown_agent_returns_missing_node_error() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch, &mut provider);

    let err = engine
        .query_agent_handle(QueryInput {
            now: 2,
            agent_id: "ghost",
            graph: &graph,
            eqbsl: &eqbsl,
        })
        .unwrap_err();
    assert!(
        matches!(err, CathexisError::MissingNode(ref id) if id == "ghost"),
        "unexpected error: {err:?}"
    );
}

// ── Drift detection ───────────────────────────────────────────────────────────

#[test]
fn drift_signal_no_change() {
    use cathexis::{CategorySummary, InMemoryLabelStore};
    let s1 = CategorySummary {
        category_id: 0,
        members: vec!["alice".into(), "bob".into()],
        mean: vec![0.5, 0.3, 0.2, 0.7, 0.1, 1.0, 0.2],
        covariance: None,
        top_feature_indices_by_abs_z: vec![],
        avg_degree: 2.0,
        avg_clustering: 0.3,
        provenance: vec![],
    };
    let drift = InMemoryLabelStore::record_drift(&s1, &s1);
    assert!((drift.mean_l2_drift).abs() < 1e-12, "no drift expected");
    assert!((drift.membership_change_ratio).abs() < 1e-12);
}

#[test]
fn drift_signal_full_membership_turnover() {
    use cathexis::{CategorySummary, InMemoryLabelStore};
    let s1 = CategorySummary {
        category_id: 0,
        members: vec!["alice".into(), "bob".into()],
        mean: vec![0.5; 7],
        covariance: None,
        top_feature_indices_by_abs_z: vec![],
        avg_degree: 2.0,
        avg_clustering: 0.3,
        provenance: vec![],
    };
    let s2 = CategorySummary {
        category_id: 0,
        members: vec!["carol".into(), "dave".into()],
        mean: vec![0.5; 7],  // same mean
        covariance: None,
        top_feature_indices_by_abs_z: vec![],
        avg_degree: 2.0,
        avg_clustering: 0.3,
        provenance: vec![],
    };
    let drift = InMemoryLabelStore::record_drift(&s1, &s2);
    assert!((drift.membership_change_ratio - 1.0).abs() < 1e-12, "full turnover");
    assert!((drift.mean_l2_drift).abs() < 1e-12, "same mean");
}

#[test]
fn drift_should_relabel_above_threshold() {
    let drift = DriftSignal {
        mean_l2_drift: 0.6,
        membership_change_ratio: 0.1,
    };
    let policy = LabelUpdatePolicy::default(); // threshold 0.5
    assert!(drift.should_relabel(policy));
}

#[test]
fn drift_should_not_relabel_below_threshold() {
    let drift = DriftSignal {
        mean_l2_drift: 0.1,
        membership_change_ratio: 0.05,
    };
    let policy = LabelUpdatePolicy::default();
    assert!(!drift.should_relabel(policy));
}

// ── Label update policy ───────────────────────────────────────────────────────

#[test]
fn label_refreshes_on_second_batch_when_no_drift() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();

    // First batch
    let batch1 = engine
        .run_batch(BatchInput { snapshot_time: 10, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch1, &mut provider);

    // Second batch at a later snapshot with same data
    let batch2 = engine
        .run_batch(BatchInput { snapshot_time: 20, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    engine.refresh_labels(&batch2, &mut provider);

    // Labels should still exist for all categories
    for summary in &batch2.summaries.summaries {
        assert!(engine.labels().get(summary.category_id).is_some());
    }
}

#[test]
fn manual_label_upsert_is_returned_by_query() {
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let mut engine = test_engine();
    let batch = engine
        .run_batch(BatchInput { snapshot_time: 1, graph: &graph, eqbsl: &eqbsl })
        .unwrap();
    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch, &mut provider);

    // Manually overwrite the label for alice's category
    let alice_assignment = batch
        .assignments
        .iter()
        .find(|a| a.agent_id == "alice")
        .unwrap();
    let cat_id = alice_assignment.category_id;

    engine.labels_mut().upsert(
        cat_id,
        LabelRecord {
            label: CategoryLabel {
                handle: "custom-label".into(),
                gloss: "Custom gloss".into(),
                guidance: Some("Handle with care".into()),
            },
            snapshot_time: 2,
        },
    );

    let resp = engine
        .query_agent_handle(QueryInput {
            now: 2,
            agent_id: "alice",
            graph: &graph,
            eqbsl: &eqbsl,
        })
        .unwrap();
    assert_eq!(resp.label, "custom-label");
    assert_eq!(resp.description, "Custom gloss");
    assert_eq!(resp.guidance.as_deref(), Some("Handle with care"));
}

// ── Graph structure features ──────────────────────────────────────────────────

#[test]
fn graph_degree_is_reflected_in_feature_vector() {
    use cathexis::{FeatureContext, FeatureExtractor, StaticFeatureExtractor};
    let graph = test_graph();
    let eqbsl = test_eqbsl();
    let ctx = FeatureContext { graph: &graph, eqbsl: &eqbsl, snapshot_time: 1 };
    let extractor = StaticFeatureExtractor::with_graph_stats();

    let f_alice = extractor.compute_features("alice", &ctx).unwrap();
    let f_eve   = extractor.compute_features("eve", &ctx).unwrap();

    // alice (degree 2) vs eve (degree 1)
    let alice_degree = f_alice.vector[5];
    let eve_degree   = f_eve.vector[5];
    assert!(
        alice_degree > eve_degree,
        "alice degree feature ({alice_degree}) should exceed eve's ({eve_degree})"
    );
}

#[test]
fn hypergraph_extractor_adds_two_extra_features() {
    use cathexis::{FeatureContext, FeatureExtractor, StaticFeatureExtractor};
    let mut graph = test_graph();
    graph.add_hyperedge(["alice", "bob", "carol"]);

    let eqbsl = test_eqbsl();
    let ctx = FeatureContext { graph: &graph, eqbsl: &eqbsl, snapshot_time: 1 };

    let base  = StaticFeatureExtractor::with_graph_stats()
        .compute_features("alice", &ctx)
        .unwrap();
    let hyper = StaticFeatureExtractor::with_graph_and_hypergraph_stats()
        .compute_features("alice", &ctx)
        .unwrap();

    assert_eq!(
        hyper.vector.len(),
        base.vector.len() + 2,
        "hypergraph extractor should add 2 extra features"
    );
    // alice is in the hyperedge, so hyperedge_count_for("alice") == 1
    assert!((hyper.vector[base.vector.len()] - 1.0).abs() < 1e-12);
}

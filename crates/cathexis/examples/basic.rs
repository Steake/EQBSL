use cathexis::{
    BatchInput, CathexisEngine, EqbslState, GraphSnapshot, HeuristicLabelProvider, InMemoryLabelStore,
    MlpCategorizer, NodeState, QueryInput, StaticFeatureExtractor,
};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let graph = GraphSnapshot::from_nodes_and_edges(
        ["alice", "bob", "carol", "dave"],
        [("alice", "bob"), ("bob", "carol"), ("carol", "dave")],
    );

    let eqbsl = EqbslState::new([
        NodeState::new("alice", vec![0.9, 0.05, 0.05], 0.93, 0.05),
        NodeState::new("bob", vec![0.7, 0.15, 0.15], 0.75, 0.15),
        NodeState::new("carol", vec![0.4, 0.2, 0.4], 0.48, 0.35),
        NodeState::new("dave", vec![0.2, 0.5, 0.3], 0.25, 0.50),
    ]);

    let extractor = StaticFeatureExtractor::with_graph_stats();
    let categorizer = MlpCategorizer::new(
        7,
        4,
        vec![
            0.2, 0.1, 0.0, 0.3, 0.1, 0.2, 0.0,
            -0.1, 0.4, 0.2, 0.1, 0.0, 0.3, -0.2,
            0.3, -0.2, 0.1, 0.2, 0.1, -0.1, 0.2,
            0.1, 0.2, 0.2, -0.1, 0.4, 0.0, 0.1,
        ],
        vec![0.0; 4],
        3,
        vec![
            0.5, -0.2, 0.1, 0.0,
            -0.3, 0.4, -0.1, 0.2,
            0.1, 0.1, 0.3, -0.2,
        ],
        vec![0.0; 3],
    )?;

    let mut engine = CathexisEngine::new(extractor, categorizer, InMemoryLabelStore::default());
    let batch = engine.run_batch(BatchInput {
        snapshot_time: 42,
        graph: &graph,
        eqbsl: &eqbsl,
    })?;

    let mut provider = HeuristicLabelProvider;
    engine.refresh_labels(&batch, &mut provider);

    let response = engine.query_agent_handle(QueryInput {
        now: 42,
        agent_id: "alice",
        graph: &graph,
        eqbsl: &eqbsl,
    })?;

    println!(
        "alice => category={} handle={} probs={:?}",
        response.category_id, response.label, response.probabilities
    );

    Ok(())
}


# cathexis

Rust crate implementing the CATHEXIS trust-handle layer described in the attached yellowpaper:

- feature-state construction (`x_i(t)`)
- category mixture inference (`p_i(t) in Delta^(K-1)`)
- hard assignment (`c_i(t)`)
- category summaries (`S_k`, `mu_k`, optional covariance)
- label metadata + drift/relabel checks
- batch and online query pipeline helpers

This crate is inference-focused and intentionally modular:

- bring your own EQBSL embeddings / graph backend
- plug in platform-specific feature extractors (`Phi_p`)
- use the provided MLP baseline categoriser or implement the `Categorizer` trait
- plug in an LLM-backed label provider later via traits

## Quick start

```rust
use cathexis::{
    BatchInput, CathexisEngine, EqbslState, GraphSnapshot, InMemoryLabelStore, MlpCategorizer,
    NodeState, StaticFeatureExtractor,
};

let graph = GraphSnapshot::from_nodes_and_edges(
    ["alice", "bob", "carol"],
    [("alice", "bob"), ("bob", "carol")],
);

let eqbsl = EqbslState::new([
    NodeState::new("alice", vec![0.8, 0.1, 0.1], 0.90, 0.10),
    NodeState::new("bob", vec![0.6, 0.2, 0.2], 0.70, 0.20),
    NodeState::new("carol", vec![0.2, 0.4, 0.4], 0.30, 0.50),
]);

let extractor = StaticFeatureExtractor::with_graph_stats();
let categorizer = MlpCategorizer::new(
    7, // feature dim in this example (3 embedding + reputation + uncertainty + degree + clustering)
    4, // hidden dim
    vec![
        0.4, 0.2, 0.1, 0.0, 0.3, 0.1, 0.2,
        -0.2, 0.1, 0.3, 0.2, -0.1, 0.4, 0.1,
        0.1, 0.2, -0.3, 0.3, 0.2, -0.2, 0.1,
        0.2, -0.1, 0.2, 0.1, 0.0, 0.3, -0.2,
    ],
    vec![0.0; 4],
    2, // K categories
    vec![
        0.5, -0.2, 0.3, 0.1,
        -0.3, 0.4, -0.1, 0.2,
    ],
    vec![0.0; 2],
).unwrap();

let mut engine = CathexisEngine::new(extractor, categorizer, InMemoryLabelStore::default());

let batch = engine.run_batch(BatchInput {
    snapshot_time: 1,
    graph: &graph,
    eqbsl: &eqbsl,
}).unwrap();

assert_eq!(batch.assignments.len(), 3);
```


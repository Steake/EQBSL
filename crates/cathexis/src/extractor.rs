use crate::{
    error::{CathexisError, Result},
    graph::GraphSnapshot,
    types::{AgentFeatureState, EqbslState},
};

pub struct FeatureContext<'a> {
    pub graph: &'a GraphSnapshot,
    pub eqbsl: &'a EqbslState,
    pub snapshot_time: u64,
}

pub trait FeatureExtractor {
    /// Platform-specific or composite implementation of `Phi(...)` from the paper.
    fn compute_features(&self, agent_id: &str, ctx: &FeatureContext<'_>) -> Result<AgentFeatureState>;
}

#[derive(Default)]
pub struct CompositeFeatureExtractor {
    parts: Vec<Box<dyn FeatureExtractor + Send + Sync>>,
}

impl CompositeFeatureExtractor {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn push<E>(&mut self, extractor: E)
    where
        E: FeatureExtractor + Send + Sync + 'static,
    {
        self.parts.push(Box::new(extractor));
    }
}

impl FeatureExtractor for CompositeFeatureExtractor {
    fn compute_features(&self, agent_id: &str, ctx: &FeatureContext<'_>) -> Result<AgentFeatureState> {
        if self.parts.is_empty() {
            return Err(CathexisError::EmptyInput("composite feature extractors"));
        }
        let mut v = Vec::new();
        for part in &self.parts {
            let f = part.compute_features(agent_id, ctx)?;
            v.extend(f.vector);
        }
        AgentFeatureState::new(agent_id.to_owned(), v)
    }
}

/// Default extractor that concatenates EQBSL trust embedding + selected scalar trust summaries
/// and optional graph-structural features.
#[derive(Debug, Clone)]
pub struct StaticFeatureExtractor {
    include_graph_stats: bool,
    include_hypergraph_stats: bool,
}

impl Default for StaticFeatureExtractor {
    fn default() -> Self {
        Self {
            include_graph_stats: false,
            include_hypergraph_stats: false,
        }
    }
}

impl StaticFeatureExtractor {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_graph_stats() -> Self {
        Self {
            include_graph_stats: true,
            include_hypergraph_stats: false,
        }
    }

    pub fn with_graph_and_hypergraph_stats() -> Self {
        Self {
            include_graph_stats: true,
            include_hypergraph_stats: true,
        }
    }
}

impl FeatureExtractor for StaticFeatureExtractor {
    fn compute_features(&self, agent_id: &str, ctx: &FeatureContext<'_>) -> Result<AgentFeatureState> {
        let node = ctx
            .eqbsl
            .get(agent_id)
            .ok_or_else(|| CathexisError::MissingNode(agent_id.to_owned()))?;

        let mut v = Vec::with_capacity(node.trust_embedding.len() + 6);
        v.extend_from_slice(&node.trust_embedding);
        v.push(node.global_reputation);
        v.push(node.uncertainty);

        if self.include_graph_stats {
            v.push(ctx.graph.degree(agent_id) as f64);
            v.push(ctx.graph.clustering_coefficient(agent_id));
        }
        if self.include_hypergraph_stats {
            v.push(ctx.graph.hyperedge_count_for(agent_id) as f64);
            v.push(ctx.graph.mean_hyperedge_size_for(agent_id));
        }

        AgentFeatureState::new(agent_id.to_owned(), v)
    }
}


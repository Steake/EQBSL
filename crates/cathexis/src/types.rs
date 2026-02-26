use std::collections::BTreeMap;

use crate::error::{CathexisError, Result};

pub type AgentId = String;
pub type CategoryId = usize;
pub type ProbabilityVector = Vec<f64>;

/// Minimal EQBSL node state exposed to CATHEXIS.
#[derive(Debug, Clone, PartialEq)]
pub struct NodeState {
    pub agent_id: AgentId,
    /// `u_i(t)` in the paper.
    pub trust_embedding: Vec<f64>,
    /// Optional scalar summary from the underlying trust engine.
    pub global_reputation: f64,
    /// Optional scalar uncertainty summary.
    pub uncertainty: f64,
}

impl NodeState {
    pub fn new(
        agent_id: impl Into<AgentId>,
        trust_embedding: Vec<f64>,
        global_reputation: f64,
        uncertainty: f64,
    ) -> Self {
        Self {
            agent_id: agent_id.into(),
            trust_embedding,
            global_reputation,
            uncertainty,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Default)]
pub struct EqbslState {
    nodes: BTreeMap<AgentId, NodeState>,
}

impl EqbslState {
    pub fn new<I>(nodes: I) -> Self
    where
        I: IntoIterator<Item = NodeState>,
    {
        let mut map = BTreeMap::new();
        for node in nodes {
            map.insert(node.agent_id.clone(), node);
        }
        Self { nodes: map }
    }

    pub fn get(&self, agent_id: &str) -> Option<&NodeState> {
        self.nodes.get(agent_id)
    }

    pub fn nodes(&self) -> impl Iterator<Item = &NodeState> {
        self.nodes.values()
    }
}

/// `x_i(t)` feature state assembled from trust, graph, and behavioural features.
#[derive(Debug, Clone, PartialEq)]
pub struct AgentFeatureState {
    pub agent_id: AgentId,
    pub vector: Vec<f64>,
}

impl AgentFeatureState {
    pub fn new(agent_id: impl Into<AgentId>, vector: Vec<f64>) -> Result<Self> {
        if vector.is_empty() {
            return Err(CathexisError::EmptyInput("feature vector"));
        }
        Ok(Self {
            agent_id: agent_id.into(),
            vector,
        })
    }
}

/// `c_i(t)` and `p_i(t)` together.
#[derive(Debug, Clone, PartialEq)]
pub struct AgentAssignment {
    pub agent_id: AgentId,
    pub category_id: CategoryId,
    pub probabilities: ProbabilityVector,
}


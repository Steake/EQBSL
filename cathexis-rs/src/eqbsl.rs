use serde::{Deserialize, Serialize};

/// Represents an EQBSL trust embedding for an agent i at time t.
/// u_i(t) ∈ R^d_u (Section 2.3, Equation 9).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustEmbedding {
    /// The raw embedding vector.
    pub vector: Vec<f64>,
    /// The dimension of the embedding (d_u).
    pub dim: usize,
}

impl TrustEmbedding {
    pub fn new(vector: Vec<f64>) -> Self {
        Self {
            dim: vector.len(),
            vector,
        }
    }
}

/// Represents an evidence tensor e_ij(t) ∈ R^m (Section 2.3, Equation 4).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvidenceTensor {
    pub components: Vec<f64>,
}

/// Interface for the underlying Trust Graph / EQBSL engine.
pub trait TrustGraph {
    /// Returns a list of all agent IDs in the graph.
    fn get_nodes(&self) -> Vec<String>;
    
    /// Returns the feature state for a given agent.
    /// In a real implementation, this would compute features from G_t and U_t.
    fn compute_features(&self, agent_id: &str) -> Result<crate::features::FeatureState, String>;
}

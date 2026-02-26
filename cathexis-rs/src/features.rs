use serde::{Deserialize, Serialize};
use crate::eqbsl::TrustEmbedding;

/// Assembled feature state x_i(t) for an agent i (Section 3, Equation 10).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureState {
    /// a) Trust features (embedding, global reputation, uncertainty, etc.)
    pub trust: TrustFeatures,
    /// b) Graph features (degree, centrality, clustering, hyperedge signatures)
    pub graph: GraphFeatures,
    /// c) Behavioural features (platform-specific metrics, temporal statistics)
    pub behavioural: BehaviouralFeatures,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustFeatures {
    /// The EQBSL embedding u_i(t)
    pub embedding: TrustEmbedding,
    /// Other global trust metrics (e.g. reputation score)
    pub reputation_score: f64,
    pub uncertainty: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphFeatures {
    pub degree: f64,
    pub centrality: f64,
    pub clustering_coefficient: f64,
    pub extra_metrics: Vec<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviouralFeatures {
    pub temporal_activity: f64,
    pub platform_metrics: Vec<f64>,
}

impl FeatureState {
    /// Flattens the feature state into a single vector x_i(t) ∈ R^d.
    pub fn to_vector(&self) -> Vec<f64> {
        let mut vec = Vec::new();
        // Trust
        vec.extend(&self.trust.embedding.vector);
        vec.push(self.trust.reputation_score);
        vec.push(self.trust.uncertainty);
        
        // Graph
        vec.push(self.graph.degree);
        vec.push(self.graph.centrality);
        vec.push(self.graph.clustering_coefficient);
        vec.extend(&self.graph.extra_metrics);
        
        // Behavioural
        vec.push(self.behavioural.temporal_activity);
        vec.extend(&self.behavioural.platform_metrics);
        
        vec
    }
}

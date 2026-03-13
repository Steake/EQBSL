use crate::categoriser::Categoriser;
use crate::eqbsl::TrustGraph;
use crate::labeling::{LabelingModel, LabelInfo, CategorySummary};
use crate::features::FeatureState;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AgentHandleResponse {
    pub category_id: usize,
    pub probabilities: Vec<f64>,
    pub label: String,
    pub description: String,
    pub guidance: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct CathexisPipeline<G, C, L>
where
    G: TrustGraph,
    C: Categoriser,
    L: LabelingModel,
{
    pub graph: G,
    pub categoriser: C,
    pub labeler: L,
    /// Maps category ID to its LabelInfo
    pub category_labels: HashMap<usize, LabelInfo>,
}

impl<G, C, L> CathexisPipeline<G, C, L>
where
    G: TrustGraph,
    C: Categoriser,
    L: LabelingModel,
{
    pub fn new(graph: G, categoriser: C, labeler: L) -> Self {
        Self {
            graph,
            categoriser,
            labeler,
            category_labels: HashMap::new(),
        }
    }

    /// Offline batch processing (Section 6).
    /// Computes features for all agents, assigns categories, and builds summaries/labels.
    pub fn batch_process(&mut self) -> Result<(), String> {
        let nodes = self.graph.get_nodes();
        let mut category_assignments: HashMap<String, usize> = HashMap::new();
        let mut category_features: HashMap<usize, Vec<FeatureState>> = HashMap::new();

        // 1. Compute features and assign categories
        for agent_id in &nodes {
            let features = self.graph.compute_features(agent_id)?;
            let category_id = self.categoriser.predict(&features)?;
            
            category_assignments.insert(agent_id.clone(), category_id);
            category_features.entry(category_id).or_default().push(features);
        }

        // 2. Build summaries and generate labels
        for (category_id, features_list) in category_features {
            // Build summary (simplified implementation)
            let summary = self.build_category_summary(category_id, &features_list);
            
            // Generate or refresh the current category label from the summary.
            let label_info = self.labeler.generate_label(&summary)?;
            self.category_labels.insert(category_id, label_info);
        }

        Ok(())
    }

    /// Online query (Section 6).
    pub fn query_agent_handle(&self, agent_id: &str) -> Result<AgentHandleResponse, String> {
        let features = self.graph.compute_features(agent_id)?;
        let probs_array = self.categoriser.forward(&features)?;
        let probs_vec: Vec<f64> = probs_array.to_vec();
        
        // Convert probs to hard category
        let category_id = self.categoriser.predict(&features)?;

        let label_info = self.category_labels.get(&category_id)
            .ok_or_else(|| format!("No label found for category {}", category_id))?;

        Ok(AgentHandleResponse {
            category_id,
            probabilities: probs_vec,
            label: label_info.handle.clone(),
            description: label_info.gloss.clone(),
            guidance: label_info.guidance.clone(),
        })
    }

    fn build_category_summary(&self, category_id: usize, feature_samples: &[FeatureState]) -> CategorySummary {
        let sample_count = feature_samples.len() as f64;

        // In a real implementation, this would compute means, deviations, etc.
        // It would also track drift in μ_k(t) and membership to decide when to split, merge, or re-label categories (Section 5).
        // For now, return a lightweight summary derived from the available samples.
        CategorySummary {
            category_id,
            top_features: vec!["trust_embedding".to_string(), "centrality".to_string()],
            deviations: Vec::new(),
            exemplar_stats: vec![sample_count], // placeholder until richer summary statistics are implemented
            platform_provenance: "EQBSL-Network".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::CathexisPipeline;
    use crate::categoriser::Categoriser;
    use crate::eqbsl::{TrustEmbedding, TrustGraph};
    use crate::features::{BehaviouralFeatures, FeatureState, GraphFeatures, TrustFeatures};
    use crate::labeling::{DummyLabeler, LabelingModel};
    use ndarray::Array1;

    struct MockGraph;

    impl TrustGraph for MockGraph {
        fn get_nodes(&self) -> Vec<String> {
            vec!["agent_1".to_string()]
        }

        fn compute_features(&self, _agent_id: &str) -> Result<FeatureState, String> {
            Ok(sample_features())
        }
    }

    struct FixedCategoriser;

    impl Categoriser for FixedCategoriser {
        fn forward(&self, _features: &FeatureState) -> Result<Array1<f64>, String> {
            Ok(Array1::from(vec![1.0]))
        }
    }

    fn sample_features() -> FeatureState {
        FeatureState {
            trust: TrustFeatures {
                embedding: TrustEmbedding::new(vec![0.1, 0.2, 0.3]),
                reputation_score: 0.8,
                uncertainty: 0.1,
            },
            graph: GraphFeatures {
                degree: 10.0,
                centrality: 0.5,
                clustering_coefficient: 0.2,
                extra_metrics: vec![],
            },
            behavioural: BehaviouralFeatures {
                temporal_activity: 0.9,
                platform_metrics: vec![1.0, 0.0],
            },
        }
    }

    #[test]
    fn build_category_summary_counts_samples() {
        let pipeline = CathexisPipeline::new(MockGraph, FixedCategoriser, DummyLabeler);
        let features = vec![sample_features(), sample_features()];

        let summary = pipeline.build_category_summary(3, &features);

        assert_eq!(summary.category_id, 3);
        assert_eq!(summary.exemplar_stats, vec![2.0]);
        assert_eq!(summary.platform_provenance, "EQBSL-Network");
        assert!(summary.deviations.is_empty());
        assert_eq!(summary.top_features, vec!["trust_embedding", "centrality"]);
    }

    #[test]
    fn dummy_labeler_remains_compatible_with_pipeline_summary() {
        let pipeline = CathexisPipeline::new(MockGraph, FixedCategoriser, DummyLabeler);
        let summary = pipeline.build_category_summary(1, &[sample_features()]);
        let label = DummyLabeler.generate_label(&summary).expect("dummy labeler should succeed");

        assert_eq!(label.handle, "Category-1");
    }
}

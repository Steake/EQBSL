use cathexis::categoriser::{MLPCategoriser, Categoriser};
use cathexis::eqbsl::{TrustGraph, TrustEmbedding};
use cathexis::features::{FeatureState, TrustFeatures, GraphFeatures, BehaviouralFeatures};
use cathexis::labeling::{LabelingModel, LabelInfo, CategorySummary};
use cathexis::pipeline::CathexisPipeline;
use ndarray::{Array1, Array2};
use serde::{Deserialize, Serialize}; // Needed for mocking if they are used in pipeline serialization

// Mock implementation of TrustGraph
#[derive(Serialize, Deserialize)]
struct MockGraph {
    nodes: Vec<String>,
}

impl TrustGraph for MockGraph {
    fn get_nodes(&self) -> Vec<String> {
        self.nodes.clone()
    }

    fn compute_features(&self, _agent_id: &str) -> Result<FeatureState, String> {
        Ok(FeatureState {
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
        })
    }
}

// Mock implementation of LabelingModel
#[derive(Serialize, Deserialize)]
struct MockLabeler;

impl LabelingModel for MockLabeler {
    fn generate_label(&self, summary: &CategorySummary) -> Result<LabelInfo, String> {
        Ok(LabelInfo {
            handle: format!("Category-{}", summary.category_id),
            gloss: "Auto-generated mock category".to_string(),
            guidance: Some("Use with caution".to_string()),
        })
    }
}

#[test]
fn test_pipeline_flow() {
    // 1. Setup Graph
    let graph = MockGraph {
        nodes: vec!["agent_1".to_string(), "agent_2".to_string()],
    };

    // 2. Setup Categoriser
    // Input dim: 3 (embedding) + 1 (rep) + 1 (unc) + 1 (deg) + 1 (cent) + 1 (clust) + 0 (extra) + 1 (temp) + 2 (plat) = 11
    // Output dim: 3 categories
    // Hidden dim: 5
    let input_dim = 11;
    let hidden_dim = 5;
    let output_dim = 3;

    let w1 = Array2::zeros((hidden_dim, input_dim));
    let b1 = Array1::zeros(hidden_dim);
    let w2 = Array2::zeros((output_dim, hidden_dim));
    let b2 = Array1::zeros(output_dim);

    let categoriser = MLPCategoriser::new(w1, b1, w2, b2);

    // 3. Setup Labeler
    let labeler = MockLabeler;

    // 4. Create Pipeline
    let mut pipeline = CathexisPipeline::new(graph, categoriser, labeler);

    // 5. Run Batch Process
    let result = pipeline.batch_process();
    assert!(result.is_ok());

    // 6. Query Agent
    let agent_id = "agent_1";
    let response = pipeline.query_agent_handle(agent_id);
    assert!(response.is_ok());

    let response = response.unwrap();
    assert!(response.label.starts_with("Category-"));
    assert_eq!(response.probabilities.len(), 3);
}

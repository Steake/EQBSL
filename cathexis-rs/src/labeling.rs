use serde::{Deserialize, Serialize};

/// Summary statistics for a category k (Section 5).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorySummary {
    pub category_id: usize,
    /// Top features contributing to this category
    pub top_features: Vec<String>,
    /// Signed deviations from global means for key features
    pub deviations: Vec<(String, f64)>,
    /// Exemplar statistics (e.g. centroid or representative member stats)
    pub exemplar_stats: Vec<f64>,
    /// Platform provenance (where this category appears)
    pub platform_provenance: String,
}

/// The output from the Labeling LLM (Section 5).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelInfo {
    /// A short handle (e.g. "high-risk flaky OTC counterparty")
    pub handle: String,
    /// A one-sentence gloss
    pub gloss: String,
    /// Optional risk / usage guidance
    pub guidance: Option<String>,
}

/// Interface for the Labeling LLM.
pub trait LabelingModel {
    /// Generates a label for a given category summary.
    fn generate_label(&self, summary: &CategorySummary) -> Result<LabelInfo, String>;
}

/// A dummy implementation for testing purposes.
pub struct DummyLabeler;

impl LabelingModel for DummyLabeler {
    fn generate_label(&self, summary: &CategorySummary) -> Result<LabelInfo, String> {
        Ok(LabelInfo {
            handle: format!("Category-{}", summary.category_id),
            gloss: "Auto-generated category".to_string(),
            guidance: None,
        })
    }
}

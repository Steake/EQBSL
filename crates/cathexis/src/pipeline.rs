use crate::{
    categorizer::Categorizer,
    error::{CathexisError, Result},
    extractor::{FeatureContext, FeatureExtractor},
    graph::GraphSnapshot,
    label::{CategoryLabel, InMemoryLabelStore, LabelRecord, LabelStore, LabelUpdatePolicy},
    summary::{CategorySummaryCollection, CovarianceMode},
    types::{AgentAssignment, AgentFeatureState, EqbslState},
};

pub struct BatchInput<'a> {
    pub snapshot_time: u64,
    pub graph: &'a GraphSnapshot,
    pub eqbsl: &'a EqbslState,
}

#[derive(Debug, Clone, PartialEq)]
pub struct BatchOutput {
    pub snapshot_time: u64,
    pub features: Vec<AgentFeatureState>,
    pub assignments: Vec<AgentAssignment>,
    pub summaries: CategorySummaryCollection,
}

pub struct QueryInput<'a> {
    pub now: u64,
    pub agent_id: &'a str,
    pub graph: &'a GraphSnapshot,
    pub eqbsl: &'a EqbslState,
}

#[derive(Debug, Clone, PartialEq)]
pub struct QueryAgentHandleResponse {
    pub category_id: usize,
    pub probabilities: Vec<f64>,
    pub label: String,
    pub description: String,
    pub guidance: Option<String>,
}

pub trait LabelProvider {
    fn label_for_summary(&mut self, category_id: usize, summary: &crate::CategorySummary) -> CategoryLabel;
}

/// Minimal fallback provider for bootstrapping without an external LLM.
#[derive(Default)]
pub struct HeuristicLabelProvider;

impl LabelProvider for HeuristicLabelProvider {
    fn label_for_summary(&mut self, category_id: usize, summary: &crate::CategorySummary) -> CategoryLabel {
        let density = if summary.avg_degree >= 3.0 { "connected" } else { "peripheral" };
        let cohesion = if summary.avg_clustering >= 0.3 { "clustered" } else { "diffuse" };
        CategoryLabel {
            handle: format!("{density}-{cohesion}-trust-cluster-{category_id}"),
            gloss: format!(
                "Category {category_id} with {} members and mean degree {:.2}.",
                summary.members.len(),
                summary.avg_degree
            ),
            guidance: Some("Human review recommended before operational use.".to_owned()),
        }
    }
}

/// Inference pipeline implementing the yellowpaper's batch + online query skeleton.
pub struct CathexisEngine<E, C, L = InMemoryLabelStore> {
    extractor: E,
    categorizer: C,
    labels: L,
    covariance_mode: CovarianceMode,
    label_update_policy: LabelUpdatePolicy,
    last_batch: Option<BatchOutput>,
}

impl<E, C, L> CathexisEngine<E, C, L>
where
    E: FeatureExtractor,
    C: Categorizer,
    L: LabelStore,
{
    pub fn new(extractor: E, categorizer: C, labels: L) -> Self {
        Self {
            extractor,
            categorizer,
            labels,
            covariance_mode: CovarianceMode::Full,
            label_update_policy: LabelUpdatePolicy::default(),
            last_batch: None,
        }
    }

    pub fn with_covariance_mode(mut self, mode: CovarianceMode) -> Self {
        self.covariance_mode = mode;
        self
    }

    pub fn with_label_update_policy(mut self, policy: LabelUpdatePolicy) -> Self {
        self.label_update_policy = policy;
        self
    }

    pub fn run_batch(&mut self, input: BatchInput<'_>) -> Result<BatchOutput> {
        let ctx = FeatureContext {
            graph: input.graph,
            eqbsl: input.eqbsl,
            snapshot_time: input.snapshot_time,
        };

        let mut features = Vec::new();
        let mut assignments = Vec::new();

        for agent_id in input.graph.nodes() {
            let f = self.extractor.compute_features(agent_id, &ctx)?;
            if f.vector.len() != self.categorizer.input_dim() {
                return Err(CathexisError::DimensionMismatch {
                    context: "categorizer input",
                    expected: self.categorizer.input_dim(),
                    got: f.vector.len(),
                });
            }
            let (category_id, probabilities) = self.categorizer.assign(&f.vector)?;
            assignments.push(AgentAssignment {
                agent_id: agent_id.clone(),
                category_id,
                probabilities,
            });
            features.push(f);
        }

        let summaries = CategorySummaryCollection::build(
            &assignments,
            &features,
            input.graph,
            self.covariance_mode,
        )?;
        let batch = BatchOutput {
            snapshot_time: input.snapshot_time,
            features,
            assignments,
            summaries,
        };
        Ok(batch)
    }

    pub fn refresh_labels<P: LabelProvider>(
        &mut self,
        batch: &BatchOutput,
        provider: &mut P,
    ) {
        for summary in &batch.summaries.summaries {
            let needs_update = match self.labels.get(summary.category_id) {
                None => true,
                Some(existing) => {
                    if let Some(prev_batch) = &self.last_batch {
                        if let Some(prev_summary) = prev_batch.summaries.by_category(summary.category_id) {
                            let drift = InMemoryLabelStore::record_drift(prev_summary, summary);
                            drift.should_relabel(self.label_update_policy)
                        } else {
                            true
                        }
                    } else {
                        existing.snapshot_time < batch.snapshot_time
                    }
                }
            };

            if needs_update {
                let label = provider.label_for_summary(summary.category_id, summary);
                self.labels.upsert(
                    summary.category_id,
                    LabelRecord {
                        label,
                        snapshot_time: batch.snapshot_time,
                    },
                );
            }
        }
        self.last_batch = Some(batch.clone());
    }

    pub fn query_agent_handle(&self, input: QueryInput<'_>) -> Result<QueryAgentHandleResponse> {
        let ctx = FeatureContext {
            graph: input.graph,
            eqbsl: input.eqbsl,
            snapshot_time: input.now,
        };
        let feature = self.extractor.compute_features(input.agent_id, &ctx)?;
        let (category_id, probabilities) = self.categorizer.assign(&feature.vector)?;
        let label = self
            .labels
            .get(category_id)
            .ok_or(CathexisError::MissingLabel(category_id))?;
        Ok(QueryAgentHandleResponse {
            category_id,
            probabilities,
            label: label.label.handle.clone(),
            description: label.label.gloss.clone(),
            guidance: label.label.guidance.clone(),
        })
    }

    pub fn labels(&self) -> &L {
        &self.labels
    }

    pub fn labels_mut(&mut self) -> &mut L {
        &mut self.labels
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{EqbslState, GraphSnapshot, InMemoryLabelStore, MlpCategorizer, NodeState, StaticFeatureExtractor};

    fn demo_engine() -> CathexisEngine<StaticFeatureExtractor, MlpCategorizer, InMemoryLabelStore> {
        let extractor = StaticFeatureExtractor::with_graph_stats();
        let mlp = MlpCategorizer::new(
            7,
            3,
            vec![
                0.2, 0.1, 0.0, 0.3, 0.1, 0.2, 0.1,
                -0.1, 0.4, 0.2, 0.1, 0.0, 0.3, -0.2,
                0.3, -0.2, 0.1, 0.2, 0.1, -0.1, 0.2,
            ],
            vec![0.0; 3],
            2,
            vec![
                0.4, -0.2, 0.1,
                -0.3, 0.5, -0.1,
            ],
            vec![0.0; 2],
        )
        .unwrap();
        CathexisEngine::new(extractor, mlp, InMemoryLabelStore::default())
    }

    fn demo_graph() -> GraphSnapshot {
        GraphSnapshot::from_nodes_and_edges(
            ["alice", "bob", "carol"],
            [("alice", "bob"), ("bob", "carol"), ("alice", "carol")],
        )
    }

    fn demo_eqbsl() -> EqbslState {
        EqbslState::new([
            NodeState::new("alice", vec![0.9, 0.05, 0.05], 0.95, 0.05),
            NodeState::new("bob", vec![0.5, 0.25, 0.25], 0.6, 0.2),
            NodeState::new("carol", vec![0.2, 0.4, 0.4], 0.3, 0.45),
        ])
    }

    #[test]
    fn batch_and_query_work() {
        let graph = demo_graph();
        let eqbsl = demo_eqbsl();
        let mut engine = demo_engine();

        let batch = engine
            .run_batch(BatchInput {
                snapshot_time: 10,
                graph: &graph,
                eqbsl: &eqbsl,
            })
            .unwrap();
        assert_eq!(batch.assignments.len(), 3);
        assert!(!batch.summaries.summaries.is_empty());

        let mut provider = HeuristicLabelProvider;
        engine.refresh_labels(&batch, &mut provider);

        let result = engine
            .query_agent_handle(QueryInput {
                now: 11,
                agent_id: "alice",
                graph: &graph,
                eqbsl: &eqbsl,
            })
            .unwrap();
        assert!(result.label.contains("trust-cluster"));
        let p_sum: f64 = result.probabilities.iter().sum();
        assert!((p_sum - 1.0).abs() < 1e-9);
    }
}

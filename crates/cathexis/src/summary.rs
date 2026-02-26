use std::collections::BTreeMap;

use crate::{
    error::{CathexisError, Result},
    graph::GraphSnapshot,
    types::{AgentAssignment, AgentFeatureState, CategoryId},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CovarianceMode {
    None,
    Full,
}

#[derive(Debug, Clone, PartialEq)]
pub struct CategorySummary {
    pub category_id: CategoryId,
    pub members: Vec<String>,
    /// `mu_k(t)` from Eq. (17).
    pub mean: Vec<f64>,
    /// Optional `Sigma_k(t)` from Eq. (18).
    pub covariance: Option<Vec<Vec<f64>>>,
    pub top_feature_indices_by_abs_z: Vec<usize>,
    pub avg_degree: f64,
    pub avg_clustering: f64,
    pub provenance: Vec<&'static str>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct CategorySummaryCollection {
    pub summaries: Vec<CategorySummary>,
    pub global_mean: Vec<f64>,
}

impl CategorySummaryCollection {
    pub fn by_category(&self, category_id: usize) -> Option<&CategorySummary> {
        self.summaries.iter().find(|s| s.category_id == category_id)
    }

    pub fn build(
        assignments: &[AgentAssignment],
        features: &[AgentFeatureState],
        graph: &GraphSnapshot,
        covariance_mode: CovarianceMode,
    ) -> Result<Self> {
        if assignments.is_empty() {
            return Err(CathexisError::EmptyInput("assignments"));
        }
        if features.is_empty() {
            return Err(CathexisError::EmptyInput("features"));
        }
        let dim = features[0].vector.len();
        if features.iter().any(|f| f.vector.len() != dim) {
            return Err(CathexisError::DimensionMismatch {
                context: "feature vectors",
                expected: dim,
                got: features
                    .iter()
                    .map(|f| f.vector.len())
                    .find(|&d| d != dim)
                    .unwrap_or(dim),
            });
        }

        let feature_by_agent: BTreeMap<&str, &AgentFeatureState> =
            features.iter().map(|f| (f.agent_id.as_str(), f)).collect();

        let mut global_mean = vec![0.0; dim];
        for f in features {
            for (dst, src) in global_mean.iter_mut().zip(f.vector.iter()) {
                *dst += src;
            }
        }
        for v in &mut global_mean {
            *v /= features.len() as f64;
        }

        let mut grouped: BTreeMap<CategoryId, Vec<&AgentFeatureState>> = BTreeMap::new();
        let mut members: BTreeMap<CategoryId, Vec<String>> = BTreeMap::new();
        for a in assignments {
            let f = feature_by_agent
                .get(a.agent_id.as_str())
                .ok_or_else(|| CathexisError::MissingNode(a.agent_id.clone()))?;
            grouped.entry(a.category_id).or_default().push(*f);
            members.entry(a.category_id).or_default().push(a.agent_id.clone());
        }

        let mut out = Vec::with_capacity(grouped.len());
        for (category_id, rows) in grouped {
            let n = rows.len();
            let mut mean = vec![0.0; dim];
            for row in &rows {
                for (dst, src) in mean.iter_mut().zip(row.vector.iter()) {
                    *dst += src;
                }
            }
            for v in &mut mean {
                *v /= n as f64;
            }

            let covariance = match covariance_mode {
                CovarianceMode::None => None,
                CovarianceMode::Full => Some(covariance_matrix(&rows, &mean)),
            };

            let mut z_like: Vec<(usize, f64)> = mean
                .iter()
                .zip(global_mean.iter())
                .enumerate()
                .map(|(i, (m, g))| (i, (m - g).abs()))
                .collect();
            z_like.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(core::cmp::Ordering::Equal));
            let top_feature_indices_by_abs_z =
                z_like.into_iter().take(8).map(|(idx, _)| idx).collect();

            let member_ids = members.remove(&category_id).unwrap_or_default();
            let avg_degree = avg(member_ids.iter().map(|id| graph.degree(id) as f64));
            let avg_clustering = avg(member_ids.iter().map(|id| graph.clustering_coefficient(id)));

            out.push(CategorySummary {
                category_id,
                members: member_ids,
                mean,
                covariance,
                top_feature_indices_by_abs_z,
                avg_degree,
                avg_clustering,
                provenance: vec!["eqbsl", "graph", "behavioural"],
            });
        }

        Ok(Self {
            summaries: out,
            global_mean,
        })
    }
}

fn avg<I>(iter: I) -> f64
where
    I: Iterator<Item = f64>,
{
    let mut sum = 0.0;
    let mut n = 0usize;
    for x in iter {
        sum += x;
        n += 1;
    }
    if n == 0 { 0.0 } else { sum / n as f64 }
}

fn covariance_matrix(rows: &[&AgentFeatureState], mean: &[f64]) -> Vec<Vec<f64>> {
    let d = mean.len();
    let n = rows.len();
    let mut out = vec![vec![0.0; d]; d];
    if n <= 1 {
        return out;
    }
    for row in rows {
        for i in 0..d {
            let di = row.vector[i] - mean[i];
            for j in 0..d {
                let dj = row.vector[j] - mean[j];
                out[i][j] += di * dj;
            }
        }
    }
    let denom = (n - 1) as f64;
    for i in 0..d {
        for j in 0..d {
            out[i][j] /= denom;
        }
    }
    out
}


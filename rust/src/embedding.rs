//! Node-level Trust Embeddings.

use std::collections::HashMap;
use crate::opinion::Opinion;
use crate::model::{NodeId, EdgeKey};

/// Deterministic baseline embedding for a node.
/// 
/// The embedding vector contains:
/// [in_expect_mean, in_u_mean, out_expect_mean, out_u_mean, in_count, out_count]
#[derive(Debug, Clone, PartialEq)]
pub struct BasicEmbedding {
    pub in_expect_mean: f64,
    pub in_u_mean: f64,
    pub out_expect_mean: f64,
    pub out_u_mean: f64,
    pub in_count: f64,
    pub out_count: f64,
}

impl BasicEmbedding {
    pub fn to_vec(&self) -> Vec<f64> {
        vec![
            self.in_expect_mean,
            self.in_u_mean,
            self.out_expect_mean,
            self.out_u_mean,
            self.in_count,
            self.out_count,
        ]
    }
}

pub fn embed_nodes_basic(
    nodes: &[NodeId],
    opinions: &HashMap<EdgeKey, Opinion>
) -> HashMap<NodeId, BasicEmbedding> {
    let mut out = HashMap::new();
    
    for i in nodes {
        let mut in_exps = Vec::new();
        let mut in_us = Vec::new();
        let mut out_exps = Vec::new();
        let mut out_us = Vec::new();
        let mut in_count = 0.0;
        let mut out_count = 0.0;

        for (key, op) in opinions {
            if &key.1 == i {
                in_count += 1.0;
                in_exps.push(op.expectation());
                in_us.push(op.u);
            }
            if &key.0 == i {
                out_count += 1.0;
                out_exps.push(op.expectation());
                out_us.push(op.u);
            }
        }

        fn mean(x: &[f64]) -> f64 {
            if x.is_empty() { 0.0 } else { x.iter().sum::<f64>() / x.len() as f64 }
        }

        out.insert(i.clone(), BasicEmbedding {
            in_expect_mean: mean(&in_exps),
            in_u_mean: mean(&in_us),
            out_expect_mean: mean(&out_exps),
            out_u_mean: mean(&out_us),
            in_count,
            out_count,
        });
    }
    
    out
}

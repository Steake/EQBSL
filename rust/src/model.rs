//! EQBSL State Model and Pipeline Operators.
//! 
//! This module implements the core EQBSL pipeline: 
//! Ingest -> Decay -> Hyperedge Attribution -> Propagation -> Opinion Lift.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use ndarray::Array1;
use crate::opinion::Opinion;
use crate::ebsl::calculate_opinion;

/// Unique identifier for a node/agent.
pub type NodeId = String;
/// Key for a directed edge between two nodes.
pub type EdgeKey = (NodeId, NodeId);
/// Unique identifier for a hyperedge.
pub type HyperId = String;

/// Global parameters for the EQBSL system.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Params {
    /// EBSL normalization constant K.
    pub k: f64,
    /// Weights for positive evidence aggregation (length m).
    pub w_pos: Array1<f64>,
    /// Weights for negative evidence aggregation (length m).
    pub w_neg: Array1<f64>,
    /// Temporal decay factors per channel (length m, values in (0, 1]).
    pub decay_beta: Array1<f64>,
    /// Damping constant for transitive propagation (values in (0, 1]).
    pub damping_lambda: f64,
    /// Maximum number of witnesses to consider for propagation.
    pub witness_top_k: usize,
}

impl Params {
    /// Validates that parameters are within expected ranges.
    pub fn validate(&self) -> Result<(), String> {
        if self.k <= 0.0 {
            return Err("k must be > 0".to_string());
        }
        let m = self.w_pos.len();
        if m == 0 || self.w_neg.len() != m || self.decay_beta.len() != m {
            return Err("w_pos, w_neg, decay_beta must have same nonzero length".to_string());
        }
        if self.w_pos.iter().any(|&x| x < 0.0) || self.w_neg.iter().any(|&x| x < 0.0) {
            return Err("w_pos and w_neg must be nonnegative".to_string());
        }
        if self.decay_beta.iter().any(|&x| x <= 0.0 || x > 1.0) {
            return Err("decay_beta must be in (0,1]".to_string());
        }
        if !(0.0 < self.damping_lambda && self.damping_lambda <= 1.0) {
            return Err("damping_lambda must be in (0,1]".to_string());
        }
        Ok(())
    }
}

/// Represents a multi-party interaction involving multiple nodes with specific roles.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hyperedge {
    pub hid: HyperId,
    pub nodes: Vec<NodeId>,
    pub roles: HashMap<NodeId, String>,
    /// m-dimensional evidence tensor.
    pub e: Array1<f64>,
}

/// The global state of the EQBSL system at time t.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct State {
    /// Current timestamp or step.
    pub t: u64,
    /// Pairwise evidence tensors.
    pub edges: HashMap<EdgeKey, Array1<f64>>,
    /// Hyperedge evidence tensors.
    pub hypers: HashMap<HyperId, Hyperedge>,
}

impl State {
    /// Creates a new empty state.
    pub fn new(t: u64) -> Self {
        Self {
            t,
            edges: HashMap::new(),
            hypers: HashMap::new(),
        }
    }
}

/// Projects an m-dimensional evidence vector into scalar (r, s) space.
pub fn rs_from_vec(e: &Array1<f64>, w_pos: &Array1<f64>, w_neg: &Array1<f64>) -> (f64, f64) {
    let r = e.dot(w_pos);
    let s = e.dot(w_neg);
    (r.max(0.0), s.max(0.0))
}

/// Applies temporal decay to all evidence in the state.
pub fn decay_state(state: &mut State, params: &Params, dt_steps: u32) {
    if dt_steps == 0 {
        return;
    }
    
    let beta_dt = params.decay_beta.mapv(|x| x.powi(dt_steps as i32));
    
    for e in state.edges.values_mut() {
        *e *= &beta_dt;
    }
    
    for h in state.hypers.values_mut() {
        h.e *= &beta_dt;
    }
}

/// Allocates hyperedge evidence into pairwise evidence tensors.
/// 
/// This baseline implementation distributes evidence equally across all ordered pairs in the hyperedge.
pub fn attribute_hyperedges_to_pairs(state: &mut State) {
    let mut additions: HashMap<EdgeKey, Array1<f64>> = HashMap::new();
    
    for h in state.hypers.values() {
        let n = h.nodes.len();
        if n < 2 { continue; }
        
        let alpha = 1.0 / (n * (n - 1)) as f64;
        
        for i in &h.nodes {
            for j in &h.nodes {
                if i == j { continue; }
                let key = (i.clone(), j.clone());
                let scaled = h.e.clone() * alpha;
                
                additions.entry(key)
                    .and_modify(|e| *e += &scaled)
                    .or_insert(scaled);
            }
        }
    }
    
    for (key, val) in additions {
        state.edges.entry(key)
            .and_modify(|e| *e += &val)
            .or_insert(val);
    }
}

/// Lifts evidence tensors into Subjective Logic opinions.
pub fn compute_opinions(state: &State, params: &Params, base_rate: f64) -> HashMap<EdgeKey, Opinion> {
    let mut out = HashMap::new();
    for (key, e) in &state.edges {
        let (r, s) = rs_from_vec(e, &params.w_pos, &params.w_neg);
        out.insert(key.clone(), calculate_opinion(r, s, params.k, base_rate));
    }
    out
}

/// Performs depth-1 transitive propagation of trust in (r, s) space.
/// 
/// r_ij_total = r_ij_direct + Σ_k λ * δ_ik * r_kj
/// s_ij_total = s_ij_direct + Σ_k λ * δ_ik * s_kj
pub fn depth1_propagation_rs(
    nodes: &[NodeId],
    opinions: &HashMap<EdgeKey, Opinion>,
    direct_edges: &HashMap<EdgeKey, Array1<f64>>,
    params: &Params
) -> HashMap<EdgeKey, (f64, f64)> {
    let mut result = HashMap::new();
    
    // Precompute direct (r, s)
    let mut direct_rs = HashMap::new();
    for (key, e) in direct_edges {
        direct_rs.insert(key.clone(), rs_from_vec(e, &params.w_pos, &params.w_neg));
    }

    // Precompute witness lists per i by expectation (descending)
    let mut witness_by_i: HashMap<NodeId, Vec<(f64, NodeId)>> = HashMap::new();
    for i in nodes {
        let mut lst = Vec::new();
        for k in nodes {
            if i == k { continue; }
            if let Some(ok) = opinions.get(&(i.clone(), k.clone())) {
                lst.push((ok.expectation(), k.clone()));
            }
        }
        lst.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
        if lst.len() > params.witness_top_k {
            lst.truncate(params.witness_top_k);
        }
        witness_by_i.insert(i.clone(), lst);
    }

    for i in nodes {
        for j in nodes {
            if i == j { continue; }
            let (r0, s0) = direct_rs.get(&(i.clone(), j.clone())).cloned().unwrap_or((0.0, 0.0));
            let mut rind = 0.0;
            let mut sind = 0.0;
            
            if let Some(witnesses) = witness_by_i.get(i) {
                for (delta_ik, k) in witnesses {
                    if let Some(&(rk, sk)) = direct_rs.get(&(k.clone(), j.clone())) {
                        if rk == 0.0 && sk == 0.0 { continue; }
                        let w = params.damping_lambda * delta_ik;
                        rind += w * rk;
                        sind += w * sk;
                    }
                }
            }
            result.insert((i.clone(), j.clone()), (r0 + rind, s0 + sind));
        }
    }
    
    result
}

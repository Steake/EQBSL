use std::collections::BTreeMap;

use crate::error::{CathexisError, Result};

pub use crate::error::CategoryId;
pub type AgentId = String;
pub type ProbabilityVector = Vec<f64>;

// ---------------------------------------------------------------------------
// Core EQBSL / Subjective-Logic types
// ---------------------------------------------------------------------------

/// Subjective Logic opinion `ω = (b, d, u, a)` with the constraint `b + d + u = 1`.
///
/// - `b` – belief mass
/// - `d` – disbelief mass
/// - `u` – uncertainty mass
/// - `a` – base rate (prior probability)
///
/// Reference: EQBSL-Primer §2.1, CATHEXIS paper §2.1.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Opinion {
    pub b: f64,
    pub d: f64,
    pub u: f64,
    pub a: f64,
}

impl Opinion {
    /// Construct and validate. Returns an error if `|b+d+u−1| > 1e-9`.
    pub fn new(b: f64, d: f64, u: f64, a: f64) -> Result<Self> {
        if (b + d + u - 1.0).abs() > 1e-9 {
            return Err(CathexisError::InvalidOpinion { b, d, u, a });
        }
        if !(0.0..=1.0).contains(&b)
            || !(0.0..=1.0).contains(&d)
            || !(0.0..=1.0).contains(&u)
            || !(0.0..=1.0).contains(&a)
        {
            return Err(CathexisError::InvalidOpinion { b, d, u, a });
        }
        Ok(Self { b, d, u, a })
    }

    /// Vacuous opinion: complete uncertainty, no evidence. `a` is clamped to [0, 1].
    pub fn vacuous(a: f64) -> Self {
        Self { b: 0.0, d: 0.0, u: 1.0, a: a.clamp(0.0, 1.0) }
    }

    /// Expected probability `E[X] = b + a·u`.
    pub fn expected_probability(&self) -> f64 {
        self.b + self.a * self.u
    }

    /// Fuse two independent opinions using Josang's cumulative belief fusion (CBF).
    /// CBF is defined when at least one opinion is not vacuous.
    pub fn fuse_cumulative(&self, other: &Opinion) -> Opinion {
        let gamma_a = other.u;
        let gamma_b = self.u;
        let denom = self.u + other.u - self.u * other.u;
        if denom.abs() < f64::EPSILON {
            // Both are dogmatic; average the dogmatic beliefs
            let b = (self.b + other.b) / 2.0;
            let d = (self.d + other.d) / 2.0;
            let u = 0.0;
            let a = (self.a + other.a) / 2.0;
            return Opinion { b, d, u, a };
        }
        let b = (self.b * gamma_a + other.b * gamma_b) / denom;
        let d = (self.d * gamma_a + other.d * gamma_b) / denom;
        let u = (self.u * other.u) / denom;
        // Base rate denominator; falls back to simple average when zero.
        let a_denom = gamma_a + gamma_b - self.u * other.u * (self.a + other.a);
        let a = if a_denom.abs() < f64::EPSILON {
            (self.a + other.a) / 2.0
        } else {
            (self.a * gamma_a + other.a * gamma_b) / a_denom
        };
        // Clamp to [0,1] to absorb floating-point drift, then re-normalize b/d/u
        // so that b+d+u=1 is preserved exactly.
        let b = b.clamp(0.0, 1.0);
        let d = d.clamp(0.0, 1.0);
        let u = u.clamp(0.0, 1.0);
        let total = b + d + u;
        let (b, d, u) = if total > f64::EPSILON {
            (b / total, d / total, u / total)
        } else {
            // Degenerate: all components clamped to zero — fall back to maximum-entropy
            // (uniform) opinion. This should not occur for well-formed input opinions.
            (1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0)
        };
        Opinion { b, d, u, a: a.clamp(0.0, 1.0) }
    }
}

/// Evidence tuple `(r, s, K)` for Evidence-Based Subjective Logic (EBSL).
///
/// - `r` – positive evidence count
/// - `s` – negative evidence count
/// - `k` – normalisation constant (K = 2 for binary, W for weighted)
///
/// Reference: EQBSL-Primer §2.2, Eq. 3.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Evidence {
    pub r: f64,
    pub s: f64,
    pub k: f64,
}

impl Evidence {
    pub fn new(r: f64, s: f64, k: f64) -> Result<Self> {
        if r < 0.0 || s < 0.0 || k <= 0.0 {
            return Err(CathexisError::InvalidEvidence { r, s, k });
        }
        Ok(Self { r, s, k })
    }

    /// Standard EQBSL evidence with K = 2.
    pub fn binary(r: f64, s: f64) -> Result<Self> {
        Self::new(r, s, 2.0)
    }

    /// Convert to a Subjective Logic opinion (EQBSL-Primer §2.2, Eq. 3).
    ///
    /// Formula: `b = r/(r+s+K)`, `d = s/(r+s+K)`, `u = K/(r+s+K)`.
    pub fn to_opinion(&self, base_rate: f64) -> Opinion {
        let sum = self.r + self.s + self.k;
        Opinion {
            b: self.r / sum,
            d: self.s / sum,
            u: self.k / sum,
            a: base_rate.clamp(0.0, 1.0),
        }
    }

    /// Additive combination: `(r, s) + (r', s') = (r+r', s+s')`.
    ///
    /// Returns an error if `self.k != other.k`, as combining evidence with
    /// different normalisation constants produces a mathematically inconsistent result.
    pub fn combine(&self, other: &Evidence) -> Result<Evidence> {
        if (self.k - other.k).abs() > f64::EPSILON {
            return Err(CathexisError::IncompatibleEvidence {
                k_self: self.k,
                k_other: other.k,
            });
        }
        Ok(Evidence {
            r: self.r + other.r,
            s: self.s + other.s,
            k: self.k,
        })
    }
}

/// Minimal EQBSL node state exposed to CATHEXIS.
#[derive(Debug, Clone, PartialEq)]
pub struct NodeState {
    pub agent_id: AgentId,
    /// `u_i(t)` – trust embedding vector from the EQBSL engine.
    pub trust_embedding: Vec<f64>,
    /// The EBSL opinion summary for this node (derived from accumulated evidence).
    pub opinion: Opinion,
}

impl NodeState {
    /// Construct from an explicit opinion.
    pub fn new(
        agent_id: impl Into<AgentId>,
        trust_embedding: Vec<f64>,
        opinion: Opinion,
    ) -> Self {
        Self {
            agent_id: agent_id.into(),
            trust_embedding,
            opinion,
        }
    }

    /// Convenience constructor from raw evidence counts (K = 2).
    pub fn from_evidence(
        agent_id: impl Into<AgentId>,
        trust_embedding: Vec<f64>,
        r: f64,
        s: f64,
        base_rate: f64,
    ) -> Result<Self> {
        let ev = Evidence::binary(r, s)?;
        Ok(Self {
            agent_id: agent_id.into(),
            trust_embedding,
            opinion: ev.to_opinion(base_rate),
        })
    }

    /// Scalar summary: expected probability of the underlying proposition being true.
    pub fn expected_trust(&self) -> f64 {
        self.opinion.expected_probability()
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


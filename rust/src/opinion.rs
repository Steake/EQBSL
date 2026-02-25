use serde::{Deserialize, Serialize};

/// Represents a Subjective Logic opinion (b, d, u, a).
/// 
/// b: Belief - Evidence supporting the proposition
/// d: Disbelief - Evidence against the proposition
/// u: Uncertainty - Lack of evidence
/// a: Base rate - Prior expectation in the absence of evidence
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Opinion {
    pub b: f64,
    pub d: f64,
    pub u: f64,
    pub a: f64,
}

impl Opinion {
    /// Creates a new Opinion and ensures normalization (b + d + u = 1).
    pub fn new(b: f64, d: f64, u: f64, a: f64) -> Self {
        let total = b + d + u;
        if total == 0.0 {
            // Default to full uncertainty if no evidence and no prior
            return Self { b: 0.0, d: 0.0, u: 1.0, a };
        }
        if (total - 1.0).abs() > 1e-9 {
            Self {
                b: b / total,
                d: d / total,
                u: u / total,
                a,
            }
        } else {
            Self { b, d, u, a }
        }
    }

    /// Calculates the expected probability: E(ω) = b + a * u
    pub fn expectation(&self) -> f64 {
        self.b + self.a * self.u
    }

    /// Fusion Operator (Consensus)
    /// 
    /// Combines two independent opinions about the same proposition.
    /// ω₁ ⊕ ω₂ = ((b₁u₂ + b₂u₁)/k, (d₁u₂ + d₂u₁)/k, (u₁u₂)/k, a)
    /// where k = u₁ + u₂ − u₁u₂
    pub fn fuse(&self, other: &Self) -> Self {
        let k = self.u + other.u - self.u * other.u;
        if k == 0.0 {
            // Both have zero uncertainty, return average as a simple conflict resolution
            return Self::new(
                (self.b + other.b) / 2.0,
                (self.d + other.d) / 2.0,
                0.0,
                self.a
            );
        }
        Self::new(
            (self.b * other.u + other.b * self.u) / k,
            (self.d * other.u + other.d * self.u) / k,
            (self.u * other.u) / k,
            self.a,
        )
    }

    /// Discounting Operator (Transitivity)
    /// 
    /// Propagates trust through a transitive relationship.
    /// If A has opinion ω_ij about B, and B has opinion ω_jk about C,
    /// then A's discounted opinion about C is ω_ik = ω_ij ⊗ ω_jk.
    pub fn discount(&self, other: &Self) -> Self {
        let b = self.b * other.b;
        let d = self.b * other.d;
        let u = self.d + self.u + self.b * other.u;
        Self::new(b, d, u, other.a)
    }
}

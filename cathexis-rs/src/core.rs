use eqbsl::{calculate_opinion, Opinion as EqbslOpinion};
use serde::{Deserialize, Serialize};

/// Represents an opinion in Subjective Logic (Section 2.1).
/// $\omega_X^A = (b, d, u, a)$ where $b + d + u = 1$.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Opinion {
    /// Belief mass
    pub b: f64,
    /// Disbelief mass
    pub d: f64,
    /// Uncertainty mass
    pub u: f64,
    /// Base rate (prior probability)
    pub a: f64,
}

impl Opinion {
    /// Creates a new opinion, ensuring the constraint b + d + u = 1 (approx).
    pub fn new(b: f64, d: f64, u: f64, a: f64) -> Result<Self, String> {
        if (b + d + u - 1.0).abs() > 1e-6 {
            return Err(format!("Invalid opinion: b+d+u must be 1, got {}", b + d + u));
        }
        Ok(Self { b, d, u, a })
    }

    /// Vacuous opinion (complete uncertainty).
    pub fn vacuous(a: f64) -> Self {
        Self {
            b: 0.0,
            d: 0.0,
            u: 1.0,
            a,
        }
    }
    
    /// Expected probability E = b + a * u
    pub fn expected_probability(&self) -> f64 {
        EqbslOpinion::from(*self).expectation()
    }
}

impl From<EqbslOpinion> for Opinion {
    fn from(opinion: EqbslOpinion) -> Self {
        Self {
            b: opinion.b,
            d: opinion.d,
            u: opinion.u,
            a: opinion.a,
        }
    }
}

impl From<Opinion> for EqbslOpinion {
    fn from(opinion: Opinion) -> Self {
        EqbslOpinion::new(opinion.b, opinion.d, opinion.u, opinion.a)
    }
}

/// Represents evidence counts for Evidence-Based Subjective Logic (EBSL) (Section 2.2).
/// r = positive evidence, s = negative evidence.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Evidence {
    /// Positive evidence count
    pub r: f64,
    /// Negative evidence count
    pub s: f64,
    /// Normalisation constant K > 0 (usually 2.0 for binary, or W for weighted)
    pub k: f64,
}

impl Evidence {
    /// Creates new evidence, validating that inputs are non-negative and k > 0.
    pub fn new(r: f64, s: f64, k: f64) -> Result<Self, String> {
        if r < 0.0 || s < 0.0 {
            return Err(format!("Evidence counts must be non-negative: r={}, s={}", r, s));
        }
        if k <= 0.0 {
            return Err(format!("Normalization constant K must be positive: k={}", k));
        }
        Ok(Self { r, s, k })
    }

    /// Maps evidence to a Subjective Logic opinion (Equation 3).
    /// b = r / (r + s + K)
    /// d = s / (r + s + K)
    /// u = K / (r + s + K)
    pub fn to_opinion(&self, base_rate: f64) -> Opinion {
        calculate_opinion(self.r, self.s, self.k, base_rate).into()
    }
    
    /// Combine with another evidence (additive property).
    /// Takes self's K value. Both inputs must already be valid Evidence.
    pub fn combine(&self, other: &Evidence) -> Evidence {
        // In EBSL, evidence is additive: (r, s) + (r', s') = (r+r', s+s')
        // We use self's K. If the caller needs matching K values, they should ensure this beforehand.
        Evidence {
            r: self.r + other.r,
            s: self.s + other.s,
            k: self.k,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use approx::assert_relative_eq;

    #[test]
    fn test_evidence_to_opinion() {
        let e = Evidence::new(8.0, 2.0, 2.0).expect("valid evidence"); // r=8, s=2, K=2 (total=12)
        let op = e.to_opinion(0.5);
        
        // b = 8/12 = 2/3 = 0.666...
        // d = 2/12 = 1/6 = 0.166...
        // u = 2/12 = 1/6 = 0.166...
        
        assert_relative_eq!(op.b, 2.0/3.0);
        assert_relative_eq!(op.d, 1.0/6.0);
        assert_relative_eq!(op.u, 1.0/6.0);
        assert_relative_eq!(op.b + op.d + op.u, 1.0);
    }

    #[test]
    fn test_evidence_rejects_negative_r() {
        let result = Evidence::new(-1.0, 2.0, 2.0);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("non-negative"));
    }

    #[test]
    fn test_evidence_rejects_negative_s() {
        let result = Evidence::new(1.0, -2.0, 2.0);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("non-negative"));
    }

    #[test]
    fn test_evidence_rejects_zero_k() {
        let result = Evidence::new(1.0, 2.0, 0.0);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("positive"));
    }

    #[test]
    fn test_evidence_rejects_negative_k() {
        let result = Evidence::new(1.0, 2.0, -1.0);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("positive"));
    }
}

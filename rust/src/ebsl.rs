//! Evidence-Based Subjective Logic (EBSL) mapping.

use crate::opinion::Opinion;

/// Default protocol parameter K (prior weight / pseudocount mass).
pub const DEFAULT_K: f64 = 2.0;

/// Maps evidence (r, s) to a Subjective Logic opinion.
/// 
/// r: Positive evidence
/// s: Negative evidence
/// k: Normalization constant (prior weight)
/// a: Base rate
/// 
/// Formulas:
/// b = r / (r + s + k)
/// d = s / (r + s + k)
/// u = k / (r + s + k)
pub fn calculate_opinion(r: f64, s: f64, k: f64, a: f64) -> Opinion {
    let denominator = r + s + k;
    Opinion::new(
        r / denominator,
        s / denominator,
        k / denominator,
        a
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_opinion() {
        let op = calculate_opinion(2.0, 0.0, 2.0, 0.5);
        assert_eq!(op.b, 0.5);
        assert_eq!(op.d, 0.0);
        assert_eq!(op.u, 0.5);
        assert_eq!(op.expectation(), 0.75);
    }
}

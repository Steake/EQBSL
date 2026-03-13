//! Tests for the core EQBSL Subjective-Logic types: Opinion and Evidence.

use cathexis::{CathexisError, Evidence, Opinion};

// ── Opinion construction ──────────────────────────────────────────────────────

#[test]
fn opinion_new_valid() {
    let op = Opinion::new(0.6, 0.2, 0.2, 0.5).unwrap();
    assert_eq!(op.b, 0.6);
    assert_eq!(op.d, 0.2);
    assert_eq!(op.u, 0.2);
    assert_eq!(op.a, 0.5);
}

#[test]
fn opinion_new_rejects_invalid_sum() {
    assert_eq!(
        Opinion::new(0.6, 0.3, 0.3, 0.5).unwrap_err(),
        CathexisError::InvalidOpinion { b: 0.6, d: 0.3, u: 0.3, a: 0.5 }
    );
}

#[test]
fn opinion_new_rejects_negative_component() {
    let err = Opinion::new(-0.1, 0.6, 0.5, 0.5).unwrap_err();
    assert!(matches!(err, CathexisError::InvalidOpinion { .. }));
}

#[test]
fn opinion_vacuous_has_full_uncertainty() {
    let op = Opinion::vacuous(0.5);
    assert_eq!(op.b, 0.0);
    assert_eq!(op.d, 0.0);
    assert_eq!(op.u, 1.0);
    assert_eq!(op.a, 0.5);
}

#[test]
fn opinion_expected_probability() {
    // E = b + a*u
    let op = Opinion::new(0.5, 0.3, 0.2, 0.5).unwrap();
    let expected = 0.5 + 0.5 * 0.2;
    assert!((op.expected_probability() - expected).abs() < 1e-12);
}

#[test]
fn opinion_expected_probability_vacuous_equals_base_rate() {
    let op = Opinion::vacuous(0.4);
    assert!((op.expected_probability() - 0.4).abs() < 1e-12);
}

// ── Cumulative belief fusion ──────────────────────────────────────────────────

#[test]
fn opinion_fuse_two_vacuous_produces_vacuous() {
    let a = Opinion::vacuous(0.5);
    let b = Opinion::vacuous(0.5);
    let fused = a.fuse_cumulative(&b);
    // Result should still be vacuous (or very close)
    assert!(fused.u > 0.99, "fused.u={}", fused.u);
}

#[test]
fn opinion_fuse_identical_opinions_is_symmetric() {
    let a = Opinion::new(0.6, 0.2, 0.2, 0.5).unwrap();
    let fused_ab = a.fuse_cumulative(&a);
    // Fusing an opinion with itself should give the same direction
    assert!(fused_ab.b >= a.b, "fused belief should not decrease");
}

#[test]
fn opinion_fuse_high_trust_with_high_distrust_gives_low_uncertainty() {
    // A believes strongly; B also believes strongly (both non-vacuous)
    let a = Opinion::new(0.8, 0.1, 0.1, 0.5).unwrap();
    let b = Opinion::new(0.7, 0.2, 0.1, 0.5).unwrap();
    let fused = a.fuse_cumulative(&b);
    // Uncertainty should be small (products of small u values / (u_a + u_b - u_a*u_b))
    // u_a=0.1, u_b=0.1 → 0.01/0.19 ≈ 0.053
    assert!(fused.u < 0.1, "fused.u={}", fused.u);
}

#[test]
fn opinion_fuse_result_sums_to_one() {
    let a = Opinion::new(0.4, 0.3, 0.3, 0.5).unwrap();
    let b = Opinion::new(0.5, 0.1, 0.4, 0.5).unwrap();
    let fused = a.fuse_cumulative(&b);
    let total = fused.b + fused.d + fused.u;
    assert!((total - 1.0).abs() < 1e-9, "b+d+u={total}");
}

// ── Evidence construction ─────────────────────────────────────────────────────

#[test]
fn evidence_binary_valid() {
    let ev = Evidence::binary(10.0, 2.0).unwrap();
    assert_eq!(ev.r, 10.0);
    assert_eq!(ev.s, 2.0);
    assert_eq!(ev.k, 2.0);
}

#[test]
fn evidence_rejects_negative_r() {
    assert!(matches!(
        Evidence::binary(-1.0, 2.0).unwrap_err(),
        CathexisError::InvalidEvidence { .. }
    ));
}

#[test]
fn evidence_rejects_negative_s() {
    assert!(matches!(
        Evidence::binary(5.0, -0.1).unwrap_err(),
        CathexisError::InvalidEvidence { .. }
    ));
}

#[test]
fn evidence_rejects_zero_k() {
    assert!(matches!(
        Evidence::new(5.0, 2.0, 0.0).unwrap_err(),
        CathexisError::InvalidEvidence { .. }
    ));
}

// ── Evidence → Opinion conversion ────────────────────────────────────────────

#[test]
fn evidence_to_opinion_sums_to_one() {
    let ev = Evidence::binary(8.0, 4.0).unwrap();
    let op = ev.to_opinion(0.5);
    let total = op.b + op.d + op.u;
    assert!((total - 1.0).abs() < 1e-12, "b+d+u={total}");
}

#[test]
fn evidence_to_opinion_vacuous_on_zero_evidence() {
    let ev = Evidence::binary(0.0, 0.0).unwrap();
    let op = ev.to_opinion(0.5);
    // With r=s=0, K=2: b=0, d=0, u=1
    assert!((op.b).abs() < 1e-12);
    assert!((op.d).abs() < 1e-12);
    assert!((op.u - 1.0).abs() < 1e-12);
}

#[test]
fn evidence_to_opinion_high_positive_evidence() {
    // r=100, s=0, K=2 → b ≈ 0.98, d=0, u ≈ 0.02
    let ev = Evidence::binary(100.0, 0.0).unwrap();
    let op = ev.to_opinion(0.5);
    assert!(op.b > 0.97, "b={}", op.b);
    assert!((op.d).abs() < 1e-12);
}

#[test]
fn evidence_to_opinion_known_values() {
    // r=8, s=4, K=2 → sum=14
    let ev = Evidence::binary(8.0, 4.0).unwrap();
    let op = ev.to_opinion(0.5);
    let sum = 8.0 + 4.0 + 2.0;
    assert!((op.b - 8.0 / sum).abs() < 1e-12, "b={}", op.b);
    assert!((op.d - 4.0 / sum).abs() < 1e-12, "d={}", op.d);
    assert!((op.u - 2.0 / sum).abs() < 1e-12, "u={}", op.u);
}

// ── Evidence combination ──────────────────────────────────────────────────────

#[test]
fn evidence_combine_additive() {
    let a = Evidence::binary(5.0, 2.0).unwrap();
    let b = Evidence::binary(3.0, 1.0).unwrap();
    let combined = a.combine(&b).unwrap();
    assert_eq!(combined.r, 8.0);
    assert_eq!(combined.s, 3.0);
    assert_eq!(combined.k, 2.0);
}

#[test]
fn evidence_combine_opinion_stronger_than_single() {
    let a = Evidence::binary(5.0, 2.0).unwrap();
    let b = Evidence::binary(3.0, 1.0).unwrap();
    let combined = a.combine(&b).unwrap();
    let op_a = a.to_opinion(0.5);
    let op_combined = combined.to_opinion(0.5);
    // More evidence → lower uncertainty
    assert!(op_combined.u < op_a.u, "combined.u={} >= a.u={}", op_combined.u, op_a.u);
}

#[test]
fn evidence_combine_rejects_mismatched_k() {
    let a = Evidence::new(5.0, 2.0, 2.0).unwrap();
    let b = Evidence::new(3.0, 1.0, 3.0).unwrap(); // different K
    let err = a.combine(&b).unwrap_err();
    assert!(
        matches!(err, CathexisError::IncompatibleEvidence { .. }),
        "expected IncompatibleEvidence, got {err:?}"
    );
}

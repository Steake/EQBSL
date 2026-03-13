//! Tests for MlpCategorizer: construction, dimension validation, forward pass.

use cathexis::{CathexisError, Categorizer, MlpCategorizer};

fn make_2in_2out_categorizer() -> MlpCategorizer {
    // 2 inputs → hidden 3 → 2 outputs
    // w1: (3×2), b1: 3, w2: (2×3), b2: 2
    MlpCategorizer::new(
        2,
        3,
        vec![
            1.0, 0.0,  // row 0
            0.0, 1.0,  // row 1
            1.0, 1.0,  // row 2
        ],
        vec![0.0, 0.0, 0.0],
        2,
        vec![
            1.0, 0.0, 0.5,  // row 0 → category 0
            0.0, 1.0, 0.5,  // row 1 → category 1
        ],
        vec![0.0, 0.0],
    )
    .unwrap()
}

#[test]
fn categorizer_construction_succeeds() {
    let cat = make_2in_2out_categorizer();
    assert_eq!(cat.input_dim(), 2);
    assert_eq!(cat.category_count(), 2);
}

#[test]
fn categorizer_rejects_wrong_w1_size() {
    let err = MlpCategorizer::new(
        2, 3,
        vec![1.0; 5],  // wrong: should be 3*2=6
        vec![0.0; 3],
        2,
        vec![1.0; 6],
        vec![0.0; 2],
    )
    .unwrap_err();
    assert!(matches!(
        err,
        CathexisError::DimensionMismatch { context: "w1", .. }
    ));
}

#[test]
fn categorizer_rejects_zero_categories() {
    let err = MlpCategorizer::new(
        2, 3,
        vec![1.0; 6],
        vec![0.0; 3],
        0,             // zero categories
        vec![],
        vec![],
    )
    .unwrap_err();
    assert_eq!(err, CathexisError::InvalidCategoryCount);
}

#[test]
fn categorizer_predict_probabilities_sum_to_one() {
    let cat = make_2in_2out_categorizer();
    let probs = cat.predict(&[0.5, 0.5]).unwrap();
    let total: f64 = probs.iter().sum();
    assert!(
        (total - 1.0).abs() < 1e-12,
        "probabilities don't sum to 1: {total}"
    );
}

#[test]
fn categorizer_predict_all_probabilities_non_negative() {
    let cat = make_2in_2out_categorizer();
    let probs = cat.predict(&[1.0, 0.0]).unwrap();
    for &p in &probs {
        assert!(p >= 0.0, "negative probability: {p}");
    }
}

#[test]
fn categorizer_predict_wrong_dim_returns_error() {
    let cat = make_2in_2out_categorizer();
    let err = cat.predict(&[1.0, 2.0, 3.0]).unwrap_err(); // 3 inputs instead of 2
    assert!(matches!(
        err,
        CathexisError::DimensionMismatch { context: "feature vector", .. }
    ));
}

#[test]
fn categorizer_assign_returns_argmax_category() {
    let cat = make_2in_2out_categorizer();
    // Input [1, 0]: after w1 → [1, 0, 1], relu → [1, 0, 1]
    // w2 * h = row0: 1*1 + 0*0 + 0.5*1 = 1.5; row1: 0*1 + 1*0 + 0.5*1 = 0.5
    // → softmax → category 0 wins
    let (category, probs) = cat.assign(&[1.0, 0.0]).unwrap();
    assert_eq!(category, 0, "expected category 0, got {category}");
    assert!(probs[0] > probs[1]);
}

#[test]
fn categorizer_assign_second_category() {
    let cat = make_2in_2out_categorizer();
    // Input [0, 1]: after w1 → [0, 1, 1], relu → [0, 1, 1]
    // w2 * h = row0: 0 + 0 + 0.5 = 0.5; row1: 0 + 1 + 0.5 = 1.5
    // → softmax → category 1 wins
    let (category, probs) = cat.assign(&[0.0, 1.0]).unwrap();
    assert_eq!(category, 1, "expected category 1, got {category}");
    assert!(probs[1] > probs[0]);
}

#[test]
fn categorizer_uniform_input_gives_valid_output() {
    // With all-zero weights, output logits are all equal → uniform distribution
    let cat = MlpCategorizer::new(
        4, 3,
        vec![0.0; 12],
        vec![0.0; 3],
        3,
        vec![0.0; 9],
        vec![0.0; 3],
    )
    .unwrap();
    let (category, probs) = cat.assign(&[0.5, 0.5, 0.5, 0.5]).unwrap();
    let total: f64 = probs.iter().sum();
    assert!((total - 1.0).abs() < 1e-9);
    let all_equal = probs.iter().all(|&p| (p - probs[0]).abs() < 1e-9);
    assert!(all_equal, "with zero weights all probs should be equal: {probs:?}");
    // With equal probabilities the specific category returned is implementation-defined
    assert!(category < 3, "category {category} out of range");
}

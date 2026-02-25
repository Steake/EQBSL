use eqbsl::*;

#[test]
fn test_opinion_fusion_scenario() {
    // Given two independent observers A and B have opinions about C
    let r_ac = 10.0;
    let s_ac = 0.0;
    let op_ac = calculate_opinion(r_ac, s_ac, DEFAULT_K, 0.5);

    let r_bc = 5.0;
    let s_bc = 0.0;
    let op_bc = calculate_opinion(r_bc, s_bc, DEFAULT_K, 0.5);

    // When the opinions are fused
    let fused = op_ac.fuse(&op_bc);

    // Then the resulting uncertainty should be lower than individual uncertainties
    assert!(fused.u < op_ac.u);
    assert!(fused.u < op_bc.u);
    
    // And the belief should be higher
    assert!(fused.b > op_ac.b);
    
    println!("Fused belief: {}", fused.b);
}

#[test]
fn test_transitive_trust_decay_scenario() {
    // Given A trusts B with high certainty
    let op_ab = calculate_opinion(20.0, 0.0, DEFAULT_K, 0.5);
    
    // And B trusts C with high certainty
    let op_bc = calculate_opinion(20.0, 0.0, DEFAULT_K, 0.5);

    // When A derives an opinion about C via B (discounting)
    let op_ac = op_ab.discount(&op_bc);

    // Then A's trust in C should be lower than B's trust in C (discounting effect)
    assert!(op_ac.b < op_bc.b);
    
    // And A's uncertainty about C should be higher than B's uncertainty about C
    assert!(op_ac.u > op_bc.u);
}

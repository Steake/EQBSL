use eqbsl::*;
use std::collections::HashMap;

#[test]
fn test_full_pipeline() {
    let params = Params {
        k: 2.0,
        w_pos: array![1.0],
        w_neg: array![0.0],
        decay_beta: array![0.5],
        damping_lambda: 1.0,
        witness_top_k: 10,
    };
    
    let mut state = State::new(0);
    
    // A -> B direct evidence
    state.edges.insert(("A".to_string(), "B".to_string()), array![2.0]);
    
    // B -> C direct evidence
    state.edges.insert(("B".to_string(), "C".to_string()), array![2.0]);
    
    // Compute direct opinions
    let opinions = compute_opinions(&state, &params, 0.5);
    let op_ab = opinions.get(&("A".to_string(), "B".to_string())).unwrap();
    let op_bc = opinions.get(&("B".to_string(), "C".to_string())).unwrap();
    
    assert_eq!(op_ab.b, 0.5); // 2/(2+2)
    assert_eq!(op_bc.b, 0.5);
    
    // Test propagation
    let nodes = vec!["A".to_string(), "B".to_string(), "C".to_string()];
    let prop_rs = depth1_propagation_rs(&nodes, &opinions, &state.edges, &params);
    
    // A -> C should have indirect evidence from B
    // delta_ab = E(op_ab) = 0.5 + 0.5*0.5 = 0.75
    // r_ac_indirect = lambda * delta_ab * r_bc = 1.0 * 0.75 * 2.0 = 1.5
    // r_ac_total = 0.0 + 1.5 = 1.5
    let (r_ac, s_ac) = prop_rs.get(&("A".to_string(), "C".to_string())).unwrap();
    assert_eq!(*r_ac, 1.5);
    assert_eq!(*s_ac, 0.0);
    
    // Test decay
    decay_state(&mut state, &params, 1);
    assert_eq!(state.edges.get(&("A".to_string(), "B".to_string())).unwrap()[0], 1.0); // 2.0 * 0.5
}

#[test]
fn test_hyperedge_attribution() {
    let mut state = State::new(0);
    let mut roles = HashMap::new();
    roles.insert("A".to_string(), "worker".to_string());
    roles.insert("B".to_string(), "worker".to_string());
    roles.insert("C".to_string(), "manager".to_string());
    
    let h = Hyperedge {
        hid: "H1".to_string(),
        nodes: vec!["A".to_string(), "B".to_string(), "C".to_string()],
        roles,
        e: array![6.0],
    };
    
    state.hypers.insert("H1".to_string(), h);
    
    attribute_hyperedges_to_pairs(&mut state);
    
    // Pairs: (A,B), (A,C), (B,A), (B,C), (C,A), (C,B) -> 6 pairs
    // alpha = 1 / (3*2) = 1/6
    // Each pair should get 6.0 * 1/6 = 1.0 evidence
    assert_eq!(state.edges.get(&("A".to_string(), "B".to_string())).unwrap()[0], 1.0);
    assert_eq!(state.edges.get(&("C".to_string(), "A".to_string())).unwrap()[0], 1.0);
}

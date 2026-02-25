use eqbsl::*;

fn main() {
    // 1. Define Parameters
    let params = Params {
        k: 2.0,
        w_pos: array![1.0, 0.5], // weights for 2-dimensional evidence
        w_neg: array![0.0, 0.5],
        decay_beta: array![0.9, 0.9],
        damping_lambda: 0.5,
        witness_top_k: 10,
    };
    params.validate().expect("Invalid params");

    // 2. Initialize State
    let mut state = State::new(0);
    
    // Node A interacts with Node B
    // Evidence: [1.0, 0.0] (1 positive unit in first channel)
    state.edges.insert(("A".to_string(), "B".to_string()), array![1.0, 0.0]);

    // 3. Compute Opinions
    let opinions = compute_opinions(&state, &params, 0.5);
    
    if let Some(op_ab) = opinions.get(&("A".to_string(), "B".to_string())) {
        println!("Opinion A -> B: {:?}", op_ab);
        println!("Expectation A -> B: {}", op_ab.expectation());
    }

    // 4. Test Fusion
    let op1 = calculate_opinion(10.0, 2.0, 2.0, 0.5);
    let op2 = calculate_opinion(5.0, 1.0, 2.0, 0.5);
    let fused = op1.fuse(&op2);
    println!("Fused Opinion: {:?}", fused);

    // 5. Test Discounting
    let op_ab = calculate_opinion(10.0, 0.0, 2.0, 0.5); // A trusts B
    let op_bc = calculate_opinion(10.0, 0.0, 2.0, 0.5); // B trusts C
    let op_ac = op_ab.discount(&op_bc); // A trusts C via B
    println!("Discounted Opinion A -> C: {:?}", op_ac);
    println!("Expectation A -> C: {}", op_ac.expectation());
}

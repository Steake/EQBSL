# EQBSL (Rust Crate)

A Rust implementation of the Evidence-Based Quantum-resistant Belief State Logic (EQBSL) framework.

EQBSL is a mathematical framework for reasoning about trust, reputation, and epistemic uncertainty in distributed systems. It extends Subjective Logic by explicitly modeling trust as a function of observed evidence and providing structured operators for state evolution, temporal decay, and transitive propagation.

## Features

- **Subjective Logic Core**: Full implementation of the Opinion tuple (b, d, u, a) with Consensus and Discounting operators.
- **Evidence-Based Mapping**: Direct mapping from evidence counts (r, s) to probabilistic opinions.
- **Vectorized Evidence (Tensors)**: Support for m-dimensional evidence vectors per relationship.
- **EQBSL Pipeline**:
  - **Temporal Decay**: Exponential decay of evidence over time.
  - **Hyperedge Attribution**: Allocation of group interaction evidence to pairwise relationships.
  - **Transitive Propagation**: Indirect evidence aggregation across trust networks.
- **Trust Embeddings**: Deterministic node-level embeddings for downstream ML tasks.

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
eqbsl = { path = "path/to/eqbsl" }
ndarray = "0.15"
```

## Quick Start

```rust
use eqbsl::*;

fn main() {
    // 1. Create an opinion from evidence
    // 10 positive observations, 0 negative, K=2, base rate=0.5
    let op_ab = calculate_opinion(10.0, 0.0, 2.0, 0.5);
    println!("Opinion A -> B: {:?}", op_ab);

    // 2. Transitive Trust (Discounting)
    let op_bc = calculate_opinion(5.0, 0.0, 2.0, 0.5);
    let op_ac = op_ab.discount(&op_bc);
    println!("Opinion A -> C: {:?}", op_ac);

    // 3. Opinion Fusion (Consensus)
    let op_witness = calculate_opinion(8.0, 1.0, 2.0, 0.5);
    let op_fused = op_ac.fuse(&op_witness);
    println!("Fused Opinion: {:?}", op_fused);
}
```

## Running Tests

```bash
cargo test
```

## Examples

Check the `examples/` directory for more detailed usage patterns, including the full EQBSL pipeline with evidence tensors and decay.

```bash
cargo run --example basic_usage
```

## License

MIT

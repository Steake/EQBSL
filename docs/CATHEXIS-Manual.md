# CATHEXIS: Trust-Handle Layer for EQBSL Networks

This document details **CATHEXIS**, a system for mapping high-dimensional EQBSL trust embeddings into human-readable "handles" and glosses.

The reference implementation is provided as a Rust crate in `EQBSL/cathexis-rs`.

## 1. System Architecture

CATHEXIS bridges the gap between raw mathematical trust signals (tensors) and human cognition (labels).

```mermaid
graph LR
    A[Trust Graph] -->|u_i(t)| B(Feature Extractor)
    B -->|x_i(t)| C(Categoriser NN)
    C -->|probs| D(Labeling LLM)
    D -->|handle| E[Human User]
```

### The Pipeline

1.  **Feature Extraction**: Aggregates:
    *   **Trust Features**: The EQBSL embedding $u_i(t)$, reputation scores, uncertainty.
    *   **Graph Features**: Degree, centrality, clustering coefficients.
    *   **Behavioural Features**: Platform-specific metrics (e.g., trade volume, governance participation).
2.  **Categorisation**: A neural network (MLP) maps the feature vector $x_i(t)$ to a probability distribution over latent categories $C = \{1, \dots, K\}$.
3.  **Labeling**: An LLM (or oracle) generates semantic labels (handles) and glosses for each category based on the statistical properties of its members.

## 2. Rust Implementation (`cathexis-rs`)

The crate provides a modular, type-safe implementation of the CATHEXIS pipeline.

### Location
`/workspace/EQBSL/cathexis-rs`

### Core Modules
*   `core`: Subjective Logic primitives (`Opinion`, `Evidence`).
*   `eqbsl`: EQBSL structures (`TrustEmbedding`).
*   `features`: `FeatureState` struct for assembling multi-modal signals.
*   `categoriser`: `Categoriser` trait and `MLPCategoriser` implementation.
*   `labeling`: `LabelingModel` trait for LLM integration.
*   `pipeline`: Orchestrates the batch processing and online query flow.

### Usage

**Prerequisites**: Rust and Cargo installed.

```bash
cd EQBSL/cathexis-rs
cargo build
cargo test
```

**Running the Demo:**

```bash
cargo run --example basic
```

**Example Code:**

```rust
use cathexis::pipeline::CathexisPipeline;
// ... setup graph, categoriser, labeler ...

let mut pipeline = CathexisPipeline::new(graph, categoriser, labeler);

// 1. Offline: Build categories and labels
pipeline.batch_process()?;

// 2. Online: Query a specific agent
let handle = pipeline.query_agent_handle("agent_1")?;
println!("Trust Handle: {}", handle.label);
```

## 3. Web Demo Integration

The EQBSL Explorer includes a visual demonstration of the CATHEXIS layer. While the web demo runs in the browser (TypeScript), it simulates the logic defined in the Rust crate.

### Key Concepts Demoed
*   **Vectorization**: Seeing how simple actions (trades, failures) become high-dimensional vectors.
*   **Categorization**: Watching the system classify an agent based on the vector.
*   **Label Generation**: The final semantic output.

---
*For more details on the underlying mathematics, see the [EQBSL Primer](EQBSL-Primer.md).*

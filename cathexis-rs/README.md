# CATHEXIS: A Trust-Handle Layer for EQBSL Networks

This crate implements the CATHEXIS system as described in the paper "CATHEXIS: A Trust-Handle Layer for EQBSL Networks".

## Overview

CATHEXIS provides a bridge from EQBSL trust embeddings to human-usable trust handles. It consists of:

1.  **Categoriser Network**: Ingests trust signals, graph features, and behavioural features to map agents to latent categories.
2.  **Labeling LLM**: Generates human-readable labels and descriptions for these categories.

## Modules

-   `core`: Basic Subjective Logic types (Opinion, Evidence).
-   `eqbsl`: EQBSL structures (TrustEmbedding, EvidenceTensor) and TrustGraph interface.
-   `features`: Feature extraction and representation.
-   `categoriser`: Neural network for categorization (MLP baseline).
-   `labeling`: Interface for the Labeling LLM.
-   `pipeline`: Offline batch processing and online query handling.

## Usage

```rust
use cathexis::pipeline::CathexisPipeline;
use cathexis::categoriser::MLPCategoriser;
use cathexis::labeling::DummyLabeler;
// Implement TrustGraph for your data source
// ...
// let pipeline = CathexisPipeline::new(graph, categoriser, labeler);
// pipeline.batch_process()?;
// let handle = pipeline.query_agent_handle("agent_1")?;
```

## Dependencies

-   `ndarray` for matrix operations.
-   `serde` for serialization.
-   `uuid`, `chrono` for utilities.

## Status

Implements the core logic and data structures.
Requires a concrete implementation of `TrustGraph` to connect to your specific EQBSL data source.
Requires a concrete implementation of `LabelingModel` to connect to an actual LLM (e.g. via API).

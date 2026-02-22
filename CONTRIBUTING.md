# Contributing to EQBSL

## What this project is

EQBSL extends Evidence-Based Subjective Logic (EBSL) to typed tensor evidence,
hypergraphs, and embeddings. The core idea: trust is a ledgered state updated by
a declared operator (ingest → decay → attribution → propagation → opinion lift →
embed), not a hand-tuned score.

See [docs/EQBSL-Primer.md](docs/EQBSL-Primer.md) for the theory and operator
semantics before contributing.

Upstream paper: <https://arxiv.org/abs/1402.3319>

## Where contributions are welcome

- **Simulation tooling** – scenarios, benchmarks, stress tests for the update pipeline
- **Fusion and discounting operators** – alternatives to the depth-1 propagation
  reference implementation
- **ONNX / EZKL integration** – exporting the operator pipeline for verifiable
  inference
- **Documentation improvements** – corrections, examples, worked derivations

## How to contribute

1. Fork the repository.
2. Create a branch for your change.
3. Make your changes with tests where applicable.
4. Open a pull request against `main` with a clear description of what changes
   and why.

Please keep PRs focused. One logical change per PR.

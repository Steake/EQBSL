# Contributing to EQBSL

## Project scope

EQBSL extends Evidence-Based Subjective Logic (EBSL) to typed tensor
evidence, hypergraph trust structures, and embedding-based identity
representations. The upstream theory is described in the EBSL paper:
<https://arxiv.org/abs/1402.3319>

For a primer on the concepts used in this project, see
[`docs/EQBSL-Primer.md`](docs/EQBSL-Primer.md).

## Areas where contributions are welcome

- **Simulation tooling** – scripts or notebooks that exercise the
  trust-computation pipeline end-to-end
- **Fusion and discounting operators** – additional or alternative
  combination rules beyond the current cumulative/averaging fusion
- **ONNX / EZKL integration** – exporting models or proofs to
  standard inference and zero-knowledge formats
- **Documentation improvements** – corrections, examples, or
  expanded explanations in `docs/`

## How to contribute

1. Fork the repository on GitHub.
2. Create a branch: `git checkout -b my-feature`.
3. Make your changes and commit with a clear message.
4. Open a pull request against `main` describing what was changed
   and why.

Please keep pull requests focused on a single concern. If you are
uncertain whether a change is in scope, open an issue first to
discuss it.

## Code style

Follow the existing TypeScript and Angular conventions already present
in `src/`. Run `npm run build` to verify the project compiles before
submitting.

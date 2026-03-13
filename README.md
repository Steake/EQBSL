# EQBSL Explorer

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21.0-DD0031?logo=angular)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)

## Documentation

- [EQBSL Primer — core objects, state model, operator semantics, and embedding interface](docs/EQBSL-Primer.md)
- [Applied showcase: ZK-gated reputation airdrops using EQBSL](https://github.com/Steake/Reputation-Gated-Airdrop)

---

**EQBSL Explorer** is an interactive web application for experimenting with mathematically-grounded trust systems and verifiable epistemic reasoning. This project provides hands-on tools to explore:

https://eqbsl-demo.netlify.app/

- **Evidence-Based Subjective Logic (EBSL)** – Map evidence counts `(r, s)` into opinion tuples `(b, d, u, a)` with explicit uncertainty
- **Proof-carrying trust / ZK demos** – Explore how EQBSL state updates could be constrained or attested with zero-knowledge proofs
- **EQBSL (Evidence-Qualified Subjective Logic)** – Extend EBSL with vectorized evidence, operator-defined state evolution, hypergraph support, and embedding-oriented outputs
- **Cathexis** – Emotional/motivational trust dynamics

Built with Angular 21 and TypeScript, this tool turns the papers' trust operators and research ideas into interactive visual experiences. The web app is primarily an exploration/demo environment; the Rust crate in [rust/](rust/) is the concrete library implementation of the EQBSL pipeline.

> **Repository:** [`Steake/EQBSL`](https://github.com/Steake/EQBSL)  
> **App metadata:** [`metadata.json`](./metadata.json)

---

## 🎬 Video Explainer

Watch this comprehensive introduction to understand how EQBSL revolutionizes trust and reputation systems through mathematically-grounded, privacy-preserving approaches:

<video src="./Verifiable_Epistemic_Trust.mp4" controls width="100%"></video>

This video covers:
- The fundamental limitations of traditional trust scores
- How Evidence-Based Subjective Logic (EBSL) models uncertainty
- How proof-carrying / zero-knowledge trust updates fit into the research direction
- Real-world applications in decentralized identity and reputation systems

---

## 📖 What is EQBSL?

**EQBSL (Evidence-Qualified Subjective Logic)** is a mathematical framework for reasoning about trust, reputation, and epistemic uncertainty in distributed systems. In the terminology used by the papers and primer, EQBSL is **EBSL lifted into vector/tensor evidence, explicit operator-defined state evolution over time, hypergraph-native interactions, and embedding-first outputs, with optional proof-carrying updates**. Unlike traditional trust scores (e.g., "85% trusted"), EQBSL models the full epistemic state:

- **Belief (b)** – Evidence supporting a proposition
- **Disbelief (d)** – Evidence against a proposition  
- **Uncertainty (u)** – Absence of evidence (where `b + d + u = 1`)
- **Base rate (a)** – Prior probability when evidence is absent

### Why EQBSL Matters

Traditional reputation systems collapse complex trust relationships into a single number, losing critical information about:
- **How much evidence** supports the rating (2 reviews vs. 2000 reviews)
- **Uncertainty** when data is sparse or conflicting
- **Typed evidence** across different channels or contexts
- **Time and structure** when trust evolves over graphs, hypergraphs, and repeated interactions
- **Privacy** when systems want to attest to trust updates without revealing raw evidence

### Key Innovations

1. **Evidence-Based Reasoning (EBSL)**  
   Trust opinions are computed from evidence counts `(r, s)` representing positive and negative observations, then lifted into opinions `ω = (b, d, u, a)`. This enables mathematically rigorous:
   - Trust transitivity (A trusts B, B trusts C → A's opinion of C)
   - Opinion fusion from multiple sources
   - Uncertainty quantification

2. **EQBSL State & Operators**  
   EQBSL extends basic EBSL by making the update pipeline explicit:
   - Vectorized / tensor evidence per relationship
   - Temporal decay and deterministic state evolution
   - Hyperedge attribution for multi-party interactions
   - Embedding-oriented outputs for downstream ML or policy systems

3. **Proof-Carrying Trust (optional)**  
   The papers describe how EQBSL updates can be accompanied by zero-knowledge proofs or commitments so a system can attest that it followed the declared operator without revealing the underlying evidence.

   Example: "I can prove this published trust update respects the EQBSL transition rules without revealing the private interaction log behind it."

4. **Cathexis Integration**  
   Models emotional/motivational dimensions of trust:
   - Approach/avoidance dynamics
   - Trust decay over time
   - Context-dependent trust relationships

### Real-World Applications

- **Decentralized Identity**: Web-of-trust without centralized authorities
- **Reputation Systems**: Marketplaces, social networks, peer review
- **Secure Voting / Governance**: Reputation-weighted participation and validator selection
- **Supply Chain**: Track product authenticity with uncertainty modeling
- **AI Safety**: Quantify trust in AI agent behaviors and preserve evidence lineage for downstream verification

---

## 🎯 What Can You Do?

- **EBSL Logic Calculator** – Experiment with belief/disbelief/uncertainty operations
- **EQBSL Graph Visualizer** – Model trust networks with AI-assisted node identity generation
- **Proof-Carrying Trust Demo** – Explore how private trust updates can be attested
- **Cathexis Simulator** – Understand emotional dynamics in trust relationships
- **Reputation-Gated Airdrop Example** – See how reputation scores drive eligibility and payout curves in an applied token distribution flow

---

## 🔬 Research Papers

This implementation is grounded in ongoing academic/research work. The `Papers/` directory contains:

- **EBSL in ZK Reputation Systems** – EBSL integrated into privacy-preserving identity / reputation settings
- **EQBSL+ZK** – The systems-oriented EQBSL extension: vectorized evidence, explicit operators, embeddings, and the bridge to proof-carrying updates
- **Proof-Carrying-Trust** – Zero-knowledge constraints for EQBSL state transitions and verifiable trust computation

For formal definitions, proofs, and protocol specifications, explore these papers and the broader [`EQBSL`](https://github.com/Steake/EQBSL) repository.

---

## 🦀 Rust Crate

A native Rust implementation of the EQBSL library is available in the [rust/](rust/) directory. It provides the EQBSL computational pipeline — from raw evidence to trust embeddings — as a standalone crate suitable for backend services, CLI tools, or embedding in other Rust projects. The current crate focuses on the trust/evidence calculus itself; proof-carrying updates are described in the papers rather than implemented as a proving system here.

### Features

- **Opinion Tuple** `(b, d, u, a)` with Consensus `⊕` and Discounting `⊗` operators
- **Evidence-to-Opinion mapping** via `calculate_opinion(r, s, k, a)`
- **m-dimensional evidence tensors** per relationship
- **Temporal decay** (`β^Δt` per channel), **hyperedge attribution**, and **transitive propagation**
- **Node trust embeddings** for downstream ML tasks
- **Full `serde` support** for JSON serialization

### Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
eqbsl = { path = "rust" }
ndarray = "0.15"
```

### Quick Start

```rust
use eqbsl::*;

// Map evidence to an opinion (10 positive, 0 negative, K=2, base rate=0.5)
let op = calculate_opinion(10.0, 0.0, DEFAULT_K, 0.5);
println!("b={:.3}, u={:.3}, E={:.3}", op.b, op.u, op.expectation());
// → b=0.833, u=0.167, E=0.917

// Transitive trust: A trusts C via B
let op_ab = calculate_opinion(10.0, 0.0, DEFAULT_K, 0.5);
let op_bc = calculate_opinion(5.0, 0.0, DEFAULT_K, 0.5);
let op_ac = op_ab.discount(&op_bc);

// Fuse two independent witnesses
let op_w = calculate_opinion(8.0, 1.0, DEFAULT_K, 0.5);
let fused = op_ac.fuse(&op_w);
println!("Fused E={:.3}", fused.expectation());
```

For complete documentation, architecture diagrams, and real-world examples (supply chain provenance, DAO voting, AI agent swarm trust, P2P lending), see [`rust/README.md`](./rust/README.md).

---

## 🛠️ Technology Stack

- **Angular 21** – Modern reactive framework with zoneless change detection
- **TypeScript 5.8** – Type-safe development
- **RxJS** – Reactive data flows and state management
- **Tailwind CSS** – Utility-first styling for the UI
- **Google Generative AI** – AI-assisted trust model exploration
- **Angular CLI** – Build tooling and development server

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended) – [Download here](https://nodejs.org/)
- **npm** (bundled with Node.js)
- **(Optional)** Google Generative AI API key – For AI-assisted features

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/Steake/EQBSL.git
cd EQBSL
```

2. **Install dependencies:**

```bash
npm install
```

### Configuration (Optional)

For AI-assisted network identity generation, configure your Google Generative AI API key:

1. Get an API key from [Google AI Studio](https://aistudio.google.com/)
2. Set the environment variable before running the app:

```bash
export API_KEY="your-api-key-here"
npm run dev
```

Or on Windows:

```cmd
set API_KEY=your-api-key-here
npm run dev
```

> **Note:** The app works without an API key, but AI features in the EQBSL Graph component will be disabled.

### Development Server

Start the local development server with live reload:

```bash
npm run dev
```

The app will be available at `http://localhost:4200` (or the next available port). Open this URL in your browser to start exploring!

### Production Build

Create an optimized production build:

```bash
npm run build
```

This compiles the app with optimizations enabled. Output is placed in `./dist/` as configured in [`angular.json`](./angular.json).

### Production Preview

Test the production build locally:

```bash
npm run preview
```

This serves the app using production configuration (equivalent to `ng serve --configuration=production`).

---

## 📁 Project Structure

```
EQBSL/
├── rust/                      # Rust crate — native EQBSL library
│   ├── src/                   # Library source (opinion, ebsl, model, embedding)
│   ├── examples/              # Runnable examples
│   ├── tests/                 # Integration & BDD tests
│   ├── Cargo.toml
│   └── README.md              # Full Rust crate documentation
├── Papers/                    # Research papers (PDFs)
├── src/
│   ├── app.component.ts       # Main Angular app component
│   ├── components/            # Feature components
│   │   ├── intro.component.ts
│   │   ├── ebsl-playground.component.ts
│   │   ├── eqbsl-graph.component.ts
│   │   ├── zk-demo.component.ts
│   │   └── cathexis.component.ts
│   └── services/              # Shared services
├── index.html                 # HTML entry point
├── index.tsx                  # TypeScript bootstrap file
├── angular.json               # Angular CLI configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── metadata.json              # App metadata
```

---

## 📜 Available Scripts

The following npm scripts are defined in `package.json`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with live reload |
| `npm run build` | Create optimized production build |
| `npm run preview` | Serve app with production configuration |

---

## 🔧 Troubleshooting

### Port Already in Use

If port 4200 is already in use, Angular will automatically try the next available port. Check your terminal output for the exact URL.

### API Key Issues

If AI features aren't working:

1. Verify your API key is set correctly: `echo $API_KEY` (Unix) or `echo %API_KEY%` (Windows)
2. Ensure you have credits available in your Google AI Studio account
3. Check the browser console for error messages

### Build Errors

If you encounter build errors after updating dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

The project uses TypeScript 5.8. Ensure your IDE is using the workspace TypeScript version:

- **VS Code**: `Ctrl/Cmd + Shift + P` → "TypeScript: Select TypeScript Version" → "Use Workspace Version"

---

## 🧪 Interactive Components

### EBSL Logic

Experiment with subjective logic operations:
- **Belief (b)**, **Disbelief (d)**, **Uncertainty (u)** triplets
- Evidence-based reasoning with positive (r) and negative (s) observations
- Logical operators: conjunction, disjunction, discount, consensus

### EQBSL Graph

Visualize trust networks:
- Create nodes with roles and reliability metrics
- Establish trust relationships between entities
- AI-generated identity profiles for realistic scenarios
- Real-time trust propagation calculations

### Proof-Carrying Trust Demo

Explore the proof-carrying trust idea at a conceptual level:
- Privacy-preserving trust verification workflows
- Commitment / proof flow for EQBSL-style state updates
- Simulated proof generation and verification in the UI

### Cathexis

Model emotional trust dynamics:
- Approach/avoidance motivations
- Trust decay and reinforcement
- Emotional state transitions

---

## 🤝 Contributing

Contributions are welcome! This is an active research project. If you'd like to contribute:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style (TypeScript + Angular conventions)
- Use Angular signals for state management
- Keep components standalone when possible
- Write clear commit messages

---

## 📚 Learn More

### Documentation

- [Angular Documentation](https://angular.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [RxJS Guide](https://rxjs.dev/guide/overview)

### Research

- Browse the `Papers/` directory for academic foundations
- Visit the main [EQBSL repository](https://github.com/Steake/EQBSL) for protocol specifications

---

## 🌐 Related Projects & Ecosystem

EQBSL is part of a growing ecosystem of Subjective Logic implementations:

| Project | Language | Description |
|---------|----------|-------------|
| **[rust/ (this repo)](./rust/)** | **Rust** | **Native EQBSL crate — opinions, decay, propagation, embeddings** |
| [liamzebedee/retrust](https://github.com/liamzebedee/retrust) | JS/Python | Subjective consensus algorithm with EBSL and sybil control |
| [waleedqk/subjective-logic](https://github.com/waleedqk/subjective-logic) | Python | Pure subjective logic library with binomial opinions and fusion |
| [atenearesearchgroup/uncertainty-datatypes-python](https://github.com/atenearesearchgroup/uncertainty-datatypes-python) | Python | Academic SL implementation from University of Málaga |
| [nharan/TrustSystem](https://github.com/nharan/TrustSystem) | Rust/JS | Trust/reputation system on Bluesky using subjective logic |
| [jemsbhai/jsonld-ex](https://github.com/jemsbhai/jsonld-ex) | TypeScript | JSON-LD extensions with subjective logic confidence algebra |
| [BraveNewCapital/ebsl-go](https://pkg.go.dev/github.com/BraveNewCapital/ebsl-go) | Go | EBSL implementation in Go |

See also: [Subjective Logic on GitHub](https://github.com/topics/subjective-logic) · [Trust Computation on GitHub](https://github.com/topics/trust-computation) · [Sybil Resistance on GitHub](https://github.com/topics/sybil-resistance)

---

## 📄 License

MIT. See [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

- Based on research in subjective logic, evidence-based trust, and zero-knowledge / proof-carrying verification
- Built with modern web technologies for accessible epistemic reasoning
- Special thanks to the Angular, TypeScript, and open-source communities

---

## 📧 Contact & Support

For questions, suggestions, or collaboration opportunities:

- **GitHub Issues**: [github.com/Steake/EQBSL/issues](https://github.com/Steake/EQBSL/issues)
- **Repository**: [github.com/Steake/EQBSL](https://github.com/Steake/EQBSL)

---

<p align="center">
  <strong>Made with ❤️ for the future of verifiable trust</strong>
</p>

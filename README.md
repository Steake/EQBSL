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

- **Evidence-Based Subjective Logic (EBSL)** – Move beyond binary trust scores to model uncertainty using evidence tuples (r, s, u)
- **Zero-Knowledge EBSL (ZK-EBSL)** – Privacy-preserving trust computations using zero-knowledge proofs
- **EQBSL** – Quantum-resistant extensions for distributed identity and reputation systems
- **Cathexis** – Emotional/motivational trust dynamics

Built with Angular 21 and TypeScript, this tool transforms complex cryptographic and epistemic concepts into intuitive, visual experiences.

> **Repository:** [`Steake/EQBSL`](https://github.com/Steake/EQBSL)  
> **App metadata:** [`metadata.json`](./metadata.json)

---

## 🎬 Video Explainer

Watch this comprehensive introduction to understand how EQBSL revolutionizes trust and reputation systems through mathematically-grounded, privacy-preserving approaches:

<video src="./Verifiable_Epistemic_Trust.mp4" controls width="100%"></video>

This video covers:
- The fundamental limitations of traditional trust scores
- How Evidence-Based Subjective Logic (EBSL) models uncertainty
- Zero-knowledge proofs for privacy-preserving trust verification
- Quantum-resistant extensions for future-proof security
- Real-world applications in decentralized identity and reputation systems

---

## 📖 What is EQBSL?

**EQBSL (Evidence-based Quantum-resistant Belief State Logic)** is a mathematical framework for reasoning about trust, reputation, and epistemic uncertainty in distributed systems. Unlike traditional trust scores (e.g., "85% trusted"), EQBSL models the full epistemic state:

- **Belief (b)** – Evidence supporting a proposition
- **Disbelief (d)** – Evidence against a proposition  
- **Uncertainty (u)** – Absence of evidence (where b + d + u = 1)

### Why EQBSL Matters

Traditional reputation systems collapse complex trust relationships into a single number, losing critical information about:
- **How much evidence** supports the rating (2 reviews vs. 2000 reviews)
- **Uncertainty** when data is sparse or conflicting
- **Privacy** when revealing trust judgments
- **Quantum resistance** for future-proof cryptographic security

### Key Innovations

1. **Evidence-Based Reasoning (EBSL)**  
   Trust opinions are computed from evidence tuples (r, s) representing positive and negative observations. This enables mathematically rigorous:
   - Trust transitivity (A trusts B, B trusts C → A's opinion of C)
   - Opinion fusion from multiple sources
   - Uncertainty quantification

2. **Zero-Knowledge Proofs (ZK-EBSL)**  
   Prove trust properties without revealing:
   - The exact trust values
   - The evidence supporting them
   - The identities involved  
   
   Example: "I can prove this vendor has >80% trust from 50+ verified buyers, without revealing who those buyers are."

3. **Quantum Resistance (EQBSL)**  
   Built on post-quantum cryptographic primitives to ensure trust systems remain secure against quantum computers, protecting:
   - Long-term reputation data
   - Privacy-preserving proofs
   - Identity attestations

4. **Cathexis Integration**  
   Models emotional/motivational dimensions of trust:
   - Approach/avoidance dynamics
   - Trust decay over time
   - Context-dependent trust relationships

### Real-World Applications

- **Decentralized Identity**: Web-of-trust without centralized authorities
- **Reputation Systems**: Marketplaces, social networks, peer review
- **Secure Voting**: Verifiable ballot privacy with trust in validators
- **Supply Chain**: Track product authenticity with uncertainty modeling
- **AI Safety**: Quantify and verify trust in AI agent behaviors

---

## 🎯 What Can You Do?

- **EBSL Logic Calculator** – Experiment with belief/disbelief/uncertainty operations
- **EQBSL Graph Visualizer** – Model trust networks with AI-assisted node identity generation
- **Zero-Knowledge Demos** – Explore privacy-preserving trust proofs
- **Cathexis Simulator** – Understand emotional dynamics in trust relationships

---

## 🔬 Research Papers

This implementation is grounded in rigorous academic research. The `Papers/` directory contains:

- **EBSL in ZK Reputation Systems** – Foundations of zero-knowledge trust proofs
- **EQBSL+ZK** – Quantum-resistant extensions to EBSL
- **Proof-Carrying-Trust** – Verifiable trust computations

For formal definitions, proofs, and protocol specifications, explore these papers and the broader [`EQBSL`](https://github.com/Steake/EQBSL) repository.

---

## 🛠️ Technology Stack

- **Angular 21** – Modern reactive framework with zoneless change detection
- **TypeScript 5.8** – Type-safe development
- **RxJS** – Reactive data flows and state management
- **Tailwind CSS** – Utility-first styling for responsive UI
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

### ZK Demo

Explore zero-knowledge proofs:
- Privacy-preserving trust verification
- Commitment schemes for EBSL opinions
- Proof generation and verification

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
| [liamzebedee/retrust](https://github.com/liamzebedee/retrust) | JS/Python | Subjective consensus algorithm with EBSL and sybil control |
| [waleedqk/subjective-logic](https://github.com/waleedqk/subjective-logic) | Python | Pure subjective logic library with binomial opinions and fusion |
| [atenearesearchgroup/uncertainty-datatypes-python](https://github.com/atenearesearchgroup/uncertainty-datatypes-python) | Python | Academic SL implementation from University of Málaga |
| [nharan/TrustSystem](https://github.com/nharan/TrustSystem) | Rust/JS | Trust/reputation system on Bluesky using subjective logic |
| [jemsbhai/jsonld-ex](https://github.com/jemsbhai/jsonld-ex) | TypeScript | JSON-LD extensions with subjective logic confidence algebra |
| [BraveNewCapital/ebsl-go](https://pkg.go.dev/github.com/BraveNewCapital/ebsl-go) | Go | EBSL implementation in Go |

See also: [Subjective Logic on GitHub](https://github.com/topics/subjective-logic) · [Trust Computation on GitHub](https://github.com/topics/trust-computation) · [Sybil Resistance on GitHub](https://github.com/topics/sybil-resistance)

---

## 📄 License

This project is part of ongoing research by O. C. Hirst [Steake] & Shadowgraph Labs (2025). See the repository for license details.

---

## 🙏 Acknowledgments

- Based on research in subjective logic, zero-knowledge proofs, and quantum-resistant cryptography
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

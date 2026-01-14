import { Component, input, output, computed, ChangeDetectionStrategy, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PaperContent {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  sections: Section[];
  downloadUrl: string;
}

interface Section {
  title: string;
  content: string;
  subsections?: Section[];
}

@Component({
  selector: 'app-paper-detail',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Back Button -->
      <button
        (click)="back.emit()"
        class="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-200 rounded-lg transition-colors duration-200 font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Back to Papers
      </button>

      @if (paper(); as paperData) {
        <!-- Paper Header -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 mb-8">
          <h1 class="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {{ paperData.title }}
          </h1>
          <p class="text-slate-400 mb-4">{{ paperData.authors }}</p>
          
          <div class="flex gap-3">
            <a 
              [href]="paperData.downloadUrl"
              download
              class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Download PDF
            </a>
          </div>
        </div>

        <!-- Abstract -->
        <div class="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 mb-8">
          <h2 class="text-2xl font-bold mb-3 text-indigo-400">Abstract</h2>
          <p class="text-slate-300 leading-relaxed">{{ paperData.abstract }}</p>
        </div>

        <!-- Paper Content -->
        <div class="prose prose-invert prose-slate max-w-none" #contentContainer>
          @for (section of paperData.sections; track section.title) {
            <section class="mb-8">
              <h2 class="text-2xl font-bold mb-4 text-indigo-400 border-b border-slate-700 pb-2">
                {{ section.title }}
              </h2>
              <div [innerHTML]="section.content" class="text-slate-300 leading-relaxed space-y-4"></div>
              
              @if (section.subsections) {
                @for (subsection of section.subsections; track subsection.title) {
                  <div class="mt-6 ml-4">
                    <h3 class="text-xl font-semibold mb-3 text-purple-400">
                      {{ subsection.title }}
                    </h3>
                    <div [innerHTML]="subsection.content" class="text-slate-300 leading-relaxed space-y-4"></div>
                  </div>
                }
              }
            </section>
          }
        </div>
      } @else {
        <div class="text-center py-12">
          <p class="text-slate-400 text-lg">Paper not found</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Typography styles */
    .prose p {
      margin-bottom: 1rem;
    }

    .prose ul, .prose ol {
      margin: 1rem 0;
      padding-left: 2rem;
    }

    .prose li {
      margin: 0.5rem 0;
    }

    .prose strong {
      color: #e2e8f0;
      font-weight: 600;
    }

    .prose em {
      color: #cbd5e1;
    }

    .prose code {
      background-color: rgba(99, 102, 241, 0.1);
      color: #a5b4fc;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.875em;
      font-family: 'JetBrains Mono', monospace;
    }

    .prose pre {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      padding: 1rem;
      overflow-x: auto;
      margin: 1.5rem 0;
    }

    .prose pre code {
      background-color: transparent;
      padding: 0;
      color: #e2e8f0;
    }

    /* Math rendering styles */
    .prose :deep(.katex) {
      font-size: 1.1em;
    }

    .prose :deep(.katex-display) {
      margin: 1.5rem 0;
      overflow-x: auto;
      overflow-y: hidden;
    }

    /* Inline math */
    .prose :deep(.math-inline) {
      display: inline;
    }

    /* Display math */
    .prose :deep(.math-display) {
      display: block;
      margin: 1.5rem 0;
      overflow-x: auto;
      text-align: center;
    }
  `]
})
export class PaperDetailComponent {
  paperId = input.required<string>();
  back = output<void>();
  contentContainer = viewChild<ElementRef>('contentContainer');
  
  private paperDatabase: Record<string, PaperContent> = {
    'ebsl-zk': {
      id: 'ebsl-zk',
      title: 'Evidence-Based Subjective Logic in ZKML Identity Systems',
      authors: 'Oliver C. Hirst [Steake], Shadowgraph Labs (October 2025)',
      abstract: 'This paper formalizes the integration of Evidence-Based Subjective Logic (EBSL) into Zero-Knowledge Machine Learning (ZKML) frameworks for decentralised identity. EBSL extends classical subjective logic by introducing direct mappings between observed evidence, belief entropy, and proof verifiability, enabling self-sovereign identities to express uncertainty as a first-class cryptographic primitive. When embedded into ZKML systems, EBSL provides the mathematical substrate for privacy-preserving, evidential reasoning — allowing trust computations to be both explainable and verifiable without revealing underlying data.',
      downloadUrl: 'https://raw.githubusercontent.com/Steake/EQBSL/main/Papers/EBSL%20in%20ZK%20Reputation%20Systems.pdf',
      sections: [
        {
          title: '1. Introduction',
          content: `
            <p>The question of how to mathematically model trust lies at the heart of all decentralised identity systems. Traditional models reduce trust to binary verification: a credential is valid or invalid. However, in social, financial or epistemic systems, belief is not binary — it exists as a gradient of certainty informed by limited evidence.</p>
            
            <p>Evidence-Based Subjective Logic (EBSL) bridges this gap. It allows systems to reason over uncertain, incomplete, and conflicting data using probabilistic opinions rather than fixed truth values.</p>

            <p>This becomes particularly powerful in the context of Zero-Knowledge Machine Learning (ZKML) — systems that can compute over encrypted data and prove the correctness of inference without revealing inputs or model parameters. By combining EBSL and ZKML, we arrive at a new class of identity architecture: <strong>verifiable epistemic trust systems</strong> — networks capable of reasoning about belief, evidence, and doubt in a mathematically grounded and cryptographically secure manner.</p>
          `
        },
        {
          title: '2. Conceptual Framework',
          content: `
            <p>Subjective Logic generalizes classical probability by decomposing knowledge about a proposition into three components:</p>
            
            <ul>
              <li><strong>b = belief</strong>: Evidence supporting the proposition</li>
              <li><strong>d = disbelief</strong>: Evidence against the proposition</li>
              <li><strong>u = uncertainty</strong>: Lack of evidence in either direction</li>
            </ul>

            <p>These components satisfy the constraint:</p>
            <div class="math-display">b + d + u = 1, &nbsp;&nbsp; b, d, u ∈ [0, 1]</div>
            
            <p>The expected probability of a proposition X given an opinion ω is:</p>
            <div class="math-display">E(ω) = b + a · u</div>
            <p>where <em>a</em> is the base rate — a prior expectation in the absence of evidence.</p>

            <p><strong>Evidence Incorporation:</strong> EBSL extends this model by linking belief components directly to observed evidence counts:</p>
            <div class="math-display">b = r/(r+s+2), &nbsp;&nbsp; d = s/(r+s+2), &nbsp;&nbsp; u = 2/(r+s+2)</div>
            <p>where <em>r</em> and <em>s</em> denote positive and negative evidence supporting a claim. This allows a seamless Bayesian update mechanism as new data arrive.</p>
          `
        },
        {
          title: '3. Mathematical Formulation',
          content: `
            <p><strong>Opinion Space:</strong> Define the opinion space as:</p>
            <div class="math-display">Ω = {(b, d, u, a) ∈ [0, 1]<sup>4</sup> | b + d + u = 1}</div>
            <p>Each opinion represents a subjective state on the proposition X.</p>

            <p><strong>Fusion Operator:</strong> Two opinions ω₁ and ω₂ can be fused under independence as:</p>
            <div class="math-display">ω₁ ⊕ ω₂ = ((b₁u₂ + b₂u₁)/k, (d₁u₂ + d₂u₁)/k, (u₁u₂)/k, a)</div>
            <p>where k = u₁ + u₂ − u₁u₂. This operator allows for the propagation of trust through a network of peers.</p>

            <p><strong>Discounting Operator:</strong> To propagate trust through transitive relationships: ω<sub>ik</sub> = ω<sub>ij</sub> ⊗ ω<sub>jk</sub>, with:</p>
            <div class="math-display">b<sub>ik</sub> = b<sub>ij</sub>b<sub>jk</sub>, &nbsp;&nbsp; d<sub>ik</sub> = d<sub>ij</sub> + u<sub>ij</sub>d<sub>jk</sub>, &nbsp;&nbsp; u<sub>ik</sub> = u<sub>ij</sub>u<sub>jk</sub></div>
          `
        },
        {
          title: '4. Integration into ZKML',
          content: `
            <p><strong>Zero-Knowledge Constraints:</strong> Each opinion update is represented as a circuit:</p>
            <div class="math-display">C<sub>EBSL</sub>(ω₁, ω₂) = ω₃</div>
            <p>and verified under zero-knowledge constraint:</p>
            <div class="math-display">VerifyZK(π) ⇒ b + d + u = 1, &nbsp; 0 ≤ b, d, u ≤ 1</div>
            <p>Thus, trust propagation can be verified cryptographically without exposing the contributing evidence.</p>

            <p><strong>ZKML Training and Inference:</strong> Machine learning models operating in zero-knowledge can utilize belief vectors ω<sub>i</sub> as input features. The model computes:</p>
            <div class="math-display">ŷ<sub>i</sub> = f<sub>θ</sub>(ω<sub>i</sub>)</div>
            <p>where f<sub>θ</sub> is a parameterized function (e.g. neural network). Proof of correct inference is produced by a ZKML prover:</p>
            <div class="math-display">Proof = ProveZK(f<sub>θ</sub>, ω<sub>i</sub>, ŷ<sub>i</sub>)</div>
            <p>This enables explainable predictions over uncertain inputs without revealing raw evidence or model parameters.</p>
          `
        },
        {
          title: '5. Identity and Reputation Modeling',
          content: `
            <p><strong>Belief Tensor for Identity:</strong> Each identity I<sub>i</sub> is defined as a tensor of opinions:</p>
            <div class="math-display">T<sub>i</sub> = [ω<sub>i,1</sub>, ω<sub>i,2</sub>, ..., ω<sub>i,n</sub>]</div>
            <p>representing beliefs across different contexts — e.g. reliability, honesty, performance. Identity thus becomes an evidential field, evolving as opinions are fused over time.</p>

            <p><strong>Temporal Update Rule:</strong> Reputation updates follow an exponential decay model:</p>
            <div class="math-display">R<sub>i</sub><sup>(t+1)</sup> = βR<sub>i</sub><sup>(t)</sup> + (1 − β)E(ω<sub>i</sub><sup>(t)</sup>)</div>
            <p>where β encodes memory persistence. New evidence adjusts the identity's belief distribution without revealing raw transactions.</p>
          `
        },
        {
          title: '6. Algorithmic Implementation',
          content: `
            <p>The EBSL-based reputation update in ZKML systems follows this algorithm:</p>
            
            <ol>
              <li>Compute opinion from evidence: ω<sub>i</sub> ← f<sub>EBSL</sub>(E<sub>i</sub><sup>(t)</sup>)</li>
              <li>Fuse neighbor opinions: ω'<sub>i</sub> ← ⨁<sub>j∈N(i)</sub> ω<sub>j</sub></li>
              <li>Generate proof: π ← ProveZK(C<sub>EBSL</sub>, ω<sub>i</sub>, ω'<sub>i</sub>)</li>
              <li>Verify proof: VerifyZK(π) = 1</li>
              <li>Update reputation: R<sub>i</sub><sup>(t+1)</sup> ← βR<sub>i</sub><sup>(t)</sup> + (1 − β)E(ω'<sub>i</sub>)</li>
            </ol>

            <p>This process allows decentralised identity networks to maintain verifiable reputation states even under partial observability and privacy constraints.</p>
          `
        },
        {
          title: '7. Entropy and Uncertainty',
          content: `
            <p>Uncertainty <em>u</em> measures informational entropy:</p>
            <div class="math-display">H(ω) = −b log b − d log d − u log u</div>
            <p>This entropy directly informs the model's confidence calibration, allowing agents to evaluate trustworthiness as a function of evidential entropy rather than deterministic assertions.</p>

            <p>Entropy regularization in ZKML training can be achieved via:</p>
            <div class="math-display">L<sub>trust</sub> = ‖E(ω) − ŷ‖² + λH(ω)</div>
            <p>balancing belief fidelity with epistemic humility.</p>
          `
        },
        {
          title: '8. Applications',
          content: `
            <p><strong>Verifiable Reputation Graphs:</strong> Reputation is computed through EBSL fusion and proven in ZK, forming a decentralised, privacy-preserving trust graph suitable for social, financial, or DAO governance applications.</p>

            <p><strong>Evidential Credential Verification:</strong> Institutions issue attestations in the form of opinions rather than static credentials. A verifier checks only the ZK proof that the opinion satisfies belief normalization and threshold conditions.</p>

            <p><strong>Sybil Resistance:</strong> EBSL-based identities possess measurable uncertainty; newly created identities exhibit high <em>u</em>, reducing their influence until evidence accumulates.</p>
          `
        },
        {
          title: '9. Conclusion',
          content: `
            <p>Evidence-Based Subjective Logic in ZKML Identity Systems establishes a foundation for verifiable epistemic reasoning — a world where digital identity evolves through evidence, where belief becomes a measurable construct, and where privacy and transparency are no longer opposites.</p>

            <p>By uniting evidential logic, probabilistic reasoning, and zero-knowledge cryptography, EBSL represents not just a framework for decentralised identity, but the blueprint of a new digital epistemology.</p>

            <p>Trust is no longer an assumption or a score — it is a dynamic, evidential waveform verified by mathematics.</p>
          `
        },
      ]
    },
    'eqbsl-quantum': {
      id: 'eqbsl-quantum',
      title: 'EQBSL: Against Trust Scores',
      authors: 'Oliver C. Hirst, Independent Researcher (December 2025)',
      abstract: 'Most "trust scores" are numerology with a user interface: confident decimals that conceal their own provenance. Evidence-Based Subjective Logic (EBSL) is a corrective, because it refuses to treat trust as a mystical scalar and instead anchors it in manipulable, auditable evidence. This paper presents EQBSL, a systems-oriented extension that lifts evidence-based trust into a structured, vectorised, operator-defined form suitable for dynamic graphs and hypergraphs, and for downstream machine learning via stable trust embeddings.',
      downloadUrl: 'https://raw.githubusercontent.com/Steake/EQBSL/main/Papers/EQBSL%2BZK.pdf',
      sections: [
        {
          title: '1. Introduction',
          content: `
            <p>Trust, in computation, is often treated as though it were weather: a quantity one can simply "measure" and then operate on as if the measurement were innocent. In reality it is a ledger of claims, counterclaims, and uncertainty—and any framework that pretends otherwise ends up smuggling assumptions through the back door.</p>

            <p>Subjective Logic provides a compact algebra for reasoning under uncertainty, including trust transitivity and opinion fusion. Evidence-Based Subjective Logic (EBSL) strengthens this foundation by centring the calculus on evidence flow, addressing structural failure modes that arise when applying classical discounting to general trust networks.</p>

            <p>This paper proposes EQBSL as a pragmatic extension of EBSL for modern systems where: (i) interactions evolve over time, (ii) evidence is multi-dimensional and context-bound, (iii) multi-party interactions are native (hyperedges rather than forced pairwise fictions), and (iv) downstream models benefit from stable vector embeddings per agent that retain a clear chain of custody back to evidence.</p>
          `
        },
        {
          title: '2. Subjective Logic and EBSL',
          content: `
            <p><strong>Subjective Logic:</strong> Classical Subjective Logic represents an opinion of agent A about proposition X as a 4-tuple:</p>
            <div class="math-display">ω<sup>X</sup><sub>A</sub> = (b, d, u, a)</div>
            <p>where <em>b</em> is belief, <em>d</em> is disbelief, <em>u</em> is uncertainty, and <em>a</em> is the base rate (the prior probability when evidence is uninformative). The opinion satisfies b + d + u = 1.</p>

            <p><strong>Evidence-Based Subjective Logic (EBSL):</strong> EBSL reframes opinions explicitly in terms of evidence counts. For a binary proposition, interpret <em>r</em> as the amount of positive evidence, <em>s</em> as the amount of negative evidence, and <em>K</em> &gt; 0 as a fixed normalisation constant. The mapping from evidence to opinion is:</p>
            <div class="math-display">b = r/(r+s+K), &nbsp;&nbsp; d = s/(r+s+K), &nbsp;&nbsp; u = K/(r+s+K)</div>

            <p>Key properties: Evidence is additive, uncertainty decays with evidence, and network computation can be implemented as evidence-flow operations.</p>
          `
        },
        {
          title: '3. EQBSL Framework',
          content: `
            <p>EQBSL lifts evidence-based opinions into a structured, vectorised, operator form over dynamic graphs and hypergraphs, with explicit temporal and contextual semantics.</p>

            <p><strong>Evidence Tensors:</strong> Instead of scalar (r, s) per relationship, maintain a richer evidence vector e<sub>ij</sub>(t) ∈ ℝ<sup>m</sup> for each ordered pair of agents (i, j) at time t. Components can include counts or scores for: successful vs. failed trades, on-time vs. late delivery, governance alignment votes, dispute outcomes, attestation patterns, and time-weighted recency terms.</p>

            <p>To recover scalar EBSL evidence parameters, define nonnegative aggregation functionals:</p>
            <div class="math-display">r<sub>ij</sub>(t) = φ<sup>+</sup>(e<sub>ij</sub>(t)), &nbsp;&nbsp; s<sub>ij</sub>(t) = φ<sup>−</sup>(e<sub>ij</sub>(t))</div>
            <p>where φ<sup>+</sup>, φ<sup>−</sup> : ℝ<sup>m</sup> → ℝ<sub>≥0</sub> are application-defined (often linear) maps.</p>
          `
        },
        {
          title: '4. Operator View of Trust Propagation',
          content: `
            <p>Rather than ad-hoc "iterate until convergence" rules, EQBSL models trust-state evolution as an operator acting on the global evidence state.</p>

            <p>Let the time-indexed (hyper)graph be G<sub>t</sub> = (V, E<sub>t</sub>), and let E<sub>t</sub> denote the collection of all evidence vectors on directed edges. Let Δ<sub>t</sub> denote the collection of new events observed between t and t + 1. Define a global update operator:</p>
            <div class="math-display">F : (E<sub>t</sub>, Δ<sub>t</sub>) ↦ E<sub>t+1</sub></div>

            <p>The operator F encodes: EBSL-style evidence combination rules, temporal decay, context-dependent weighting, and hyperedge aggregation. The result is a well-defined state update step suitable for batch or streaming systems.</p>
          `
        },
        {
          title: '5. Hypergraph-Aware Trust',
          content: `
            <p>Many interactions are natively multi-party (DAOs, multi-sig execution, group swaps, committees). Forcing these into pairwise edges tends to erase accountability structure.</p>

            <p>EQBSL represents evidence per hyperedge:</p>
            <div class="math-display">e<sub>h</sub>(t), &nbsp;&nbsp; h ⊆ V, |h| ≥ 2</div>

            <p>and defines a decomposition rule that allocates hyperedge evidence into pairwise or groupwise evidence tensors. One generic form is:</p>
            <div class="math-display">e<sub>ij</sub>(t) += Σ<sub>h∋i,j</sub> α<sub>ijh</sub> Π<sub>ij</sub>(e<sub>h</sub>(t))</div>
            <p>where Π<sub>ij</sub> is a projection / attribution map and α<sub>ijh</sub> are allocation coefficients (e.g. symmetric, role-weighted, or protocol-specific).</p>
          `
        },
        {
          title: '6. Node-Level Trust Embeddings',
          content: `
            <p>EQBSL outputs stable per-agent embeddings:</p>
            <div class="math-display">u<sub>i</sub>(t) = Γ(i, E<sub>t</sub>, G<sub>t</sub>) ∈ ℝ<sup>d<sub>u</sub></sup></div>

            <p>where Γ aggregates how the network "feels" about agent i across evidence/opinions, structural position, and temporal patterns. These embeddings are intended as the main interface for downstream components (e.g. ranking, anomaly detection, clustering, recommendation, or human-facing summarisation layers).</p>

            <p>The crucial requirement is that they remain tethered to the evidence ledger, so that an embedding can be challenged with more than indignation.</p>
          `
        },
        {
          title: '7. Proof-Carrying EQBSL (Bridge to ZK)',
          content: `
            <p>Having a principled trust operator is one thing; forcing systems to actually use it is another. The companion ZK paper takes the state model just described and wraps it in cryptographic obligation.</p>

            <p>At time t, let the full EQBSL state be S<sub>t</sub> := (G<sub>t</sub>, E<sub>t</sub>). A proof-carrying instantiation publishes a binding commitment C<sub>t</sub> = Com(S<sub>t</sub>; r<sub>t</sub>), where Com is a standard vector commitment scheme.</p>

            <p>Define an arithmetic circuit C<sub>F</sub> : (S<sub>t</sub>, Δ<sub>t</sub>) ↦ S<sub>t+1</sub> implementing exactly the EQBSL update. A zero-knowledge proof system is then used to prove that the published state transitions respect the operator F, without revealing underlying evidence.</p>

            <p>The verifier need never see the evidence vectors; they see only that the same operator F defined in this paper actually governed the update. The distance between spec and implementation collapses into a proof.</p>
          `
        },
        {
          title: '8. Conclusion',
          content: `
            <p>EQBSL is deliberately framed as a systems-level lift: it keeps EBSL's evidence-centric foundation and extends the representation so trust becomes a first-class, vectorised state that composes with time, hyperedges, and machine learning pipelines.</p>

            <p>The exact choices of φ<sup>±</sup>, F, and Γ are domain-specific; the virtue is that these choices are exposed as parameters rather than buried as folklore. That makes the system falsifiable: you can perturb evidence, trace effects, and find the fault lines.</p>

            <p>The proof-carrying layer sketched here and detailed in the companion paper does not change the algebra; it constrains the implementation. The system designer may still make poor choices, but they can no longer claim that the code does one thing while the evidence calculus says another. For a domain long dominated by oracular trust scores and unexplained bans, that is already a cultural revolution.</p>
          `
        }
      ]
    },
    'proof-trust': {
      id: 'proof-trust',
      title: 'Proof-Carrying Trust: Zero-Knowledge Constraints for EQBSL',
      authors: 'O. C. Hirst, Independent Researcher (December 2025)',
      abstract: 'Trust systems on the internet tend to behave like oracles: they emit scores, decline to explain themselves, and insist that users take it on faith that the internals are sane. The EQBSL framework replaces this with an evidence-flow calculus for trust on dynamic (hyper)graphs, but it still leaves a gap between specification and implementation. This paper closes that gap with a proof-carrying construction: we define circuits and zero-knowledge constraints that force each trust update to respect the EQBSL operator, without revealing underlying evidence. In short, if a system claims to be running the EQBSL calculus, it can now be compelled to prove it.',
      downloadUrl: 'https://raw.githubusercontent.com/Steake/EQBSL/main/Papers/Proof-Carrying-Trust.pdf',
      sections: [
        {
          title: '1. Introduction',
          content: `
            <p>A trust score that cannot be interrogated is not a metric, it is a superstition. The EQBSL paper attacks this by putting trust on an explicit footing: evidence tensors on edges, an operator F that rewrites the state step-by-step, and a mapping from evidence to Subjective Logic opinions grounded in EBSL. The result is a calculus that makes its assumptions legible.</p>

            <p>What EQBSL does not do on its own is prevent an implementation from quietly cheating. Nothing in the algebra stops a developer from publishing E<sub>t+1</sub> that is only loosely related to F(E<sub>t</sub>, Δ<sub>t</sub>), or embeddings u<sub>i</sub>(t) that have a more mystical than mathematical relationship to the stated operator Γ.</p>

            <p>This paper proposes a remedy: a proof-carrying instantiation in which every EQBSL state transition and, optionally, every published embedding, is accompanied by a zero-knowledge proof that the right algebra was followed. Evidence and contextual details can remain private; the obedience to F and Γ cannot.</p>
          `
        },
        {
          title: '2. EQBSL State Model (Recap)',
          content: `
            <p>We adopt the notation and definitions of EQBSL, summarised only as much as is needed to define constraints.</p>

            <p><strong>Evidence and Opinions:</strong> For a binary proposition, EBSL interprets <em>r</em> as the amount of positive evidence, <em>s</em> as the amount of negative evidence, and <em>K</em> &gt; 0 as a fixed normalisation constant. The mapping from evidence to opinion is:</p>
            <div class="math-display">b = r/(r+s+K), &nbsp;&nbsp; d = s/(r+s+K), &nbsp;&nbsp; u = K/(r+s+K)</div>
            <p>with b + d + u = 1.</p>

            <p><strong>Evidence Tensors:</strong> For each ordered pair of agents (i, j) and time t, EQBSL maintains an evidence vector e<sub>ij</sub>(t) ∈ ℝ<sup>m</sup>. Scalar evidence parameters are recovered via nonnegative aggregation maps:</p>
            <div class="math-display">r<sub>ij</sub>(t) = φ<sup>+</sup>(e<sub>ij</sub>(t)), &nbsp;&nbsp; s<sub>ij</sub>(t) = φ<sup>−</sup>(e<sub>ij</sub>(t))</div>

            <p><strong>Global State and Operator:</strong> Let the time-indexed (hyper)graph be G<sub>t</sub> = (V, E<sub>t</sub>), and let the evidence field be E<sub>t</sub> = {e<sub>ij</sub>(t)}<sub>(i,j)∈V×V</sub>. Let Δ<sub>t</sub> denote the collection of new events between t and t + 1. EQBSL defines an update operator:</p>
            <div class="math-display">F : (E<sub>t</sub>, Δ<sub>t</sub>) ↦ E<sub>t+1</sub></div>
          `
        },
        {
          title: '3. Commitments and Statement of Soundness',
          content: `
            <p>The core idea is conceptually simple: commit to state, update according to F, and prove that this update occurred as advertised.</p>

            <p><strong>State Commitments:</strong> At time t the EQBSL state is S<sub>t</sub> = (G<sub>t</sub>, E<sub>t</sub>). A verifier does not need to see S<sub>t</sub>; they only need a binding handle for it. Let C<sub>t</sub> = Com(S<sub>t</sub>; r<sub>t</sub>) be a commitment under some binding, hiding vector commitment scheme Com with randomness r<sub>t</sub>.</p>

            <p><strong>Transition Statement:</strong> Given the EQBSL operator F, the honest update from t to t + 1 is S<sub>t+1</sub> = (G<sub>t+1</sub>, F(E<sub>t</sub>, Δ<sub>t</sub>)). The public statement we want to prove is:</p>
            
            <p><em>Given public inputs (C<sub>t</sub>, C<sub>t+1</sub>, Δ<sub>t</sub>), there exist states S<sub>t</sub>, S<sub>t+1</sub> and randomness (r<sub>t</sub>, r<sub>t+1</sub>) such that C<sub>t</sub> = Com(S<sub>t</sub>; r<sub>t</sub>), C<sub>t+1</sub> = Com(S<sub>t+1</sub>; r<sub>t+1</sub>), and S<sub>t+1</sub> = (G<sub>t+1</sub>, F(E<sub>t</sub>, Δ<sub>t</sub>)).</em></p>
          `
        },
        {
          title: '4. Circuits for F and Ψ',
          content: `
            <p>To make the statement above machine-checkable, we compile the EQBSL update into arithmetic circuits or equivalent constraint systems.</p>

            <p><strong>Circuit C<sub>F</sub> for the Evidence Operator:</strong> Define an arithmetic circuit C<sub>F</sub> : (S<sub>t</sub>, Δ<sub>t</sub>) ↦ S<sub>t+1</sub> whose gates implement exactly the EQBSL update rules:</p>
            <ul>
              <li>per-edge and per-hyperedge evidence updates,</li>
              <li>temporal decay (if any) on components of e<sub>ij</sub>(t),</li>
              <li>aggregation of hyperedge evidence into pairwise tensors,</li>
              <li>any domain-specific clamping or normalisation.</li>
            </ul>

            <p>The constraint system for C<sub>F</sub> contains, in arithmetised form, the same algebra that defines F; there is no room for a second, "convenient" operator.</p>

            <p><strong>Circuit C<sub>Ψ</sub> for Evidence-to-Opinion Mapping:</strong> We define a per-edge circuit C<sub>Ψ</sub> : e<sub>ij</sub>(t) ↦ ω<sub>ij</sub>(t) whose constraints implement:</p>
            <div class="math-display">r<sub>ij</sub>(t) = φ<sup>+</sup>(e<sub>ij</sub>(t)), &nbsp;&nbsp; s<sub>ij</sub>(t) = φ<sup>−</sup>(e<sub>ij</sub>(t))</div>
            <div class="math-display">b<sub>ij</sub>(t) = r<sub>ij</sub>(t)/(r<sub>ij</sub>(t) + s<sub>ij</sub>(t) + K)</div>
            <div class="math-display">d<sub>ij</sub>(t) = s<sub>ij</sub>(t)/(r<sub>ij</sub>(t) + s<sub>ij</sub>(t) + K)</div>
            <div class="math-display">u<sub>ij</sub>(t) = K/(r<sub>ij</sub>(t) + s<sub>ij</sub>(t) + K)</div>
            <div class="math-display">b<sub>ij</sub>(t) + d<sub>ij</sub>(t) + u<sub>ij</sub>(t) = 1</div>

            <p>In practice, denominators are handled via fixed-point arithmetic and multiplicative constraints rather than literal division, but the algebra is identical.</p>
          `
        },
        {
          title: '5. Circuits for Embeddings Γ',
          content: `
            <p>When node-level embeddings are published or used as features, we may wish to prove that they are honest functions of the committed EQBSL state.</p>

            <p>Let U<sub>t</sub> = {u<sub>i</sub>(t)}<sub>i∈V</sub> be the embedding set at time t. Define a circuit C<sub>Γ</sub> : S<sub>t</sub> ↦ U<sub>t</sub> whose constraints implement u<sub>i</sub>(t) = Γ(i, E<sub>t</sub>, G<sub>t</sub>) exactly.</p>

            <p>The details of Γ are domain-specific: it may be a graph neural network, a hand-designed feature map, or a simpler summary. What matters is that the same Γ that appears in specifications is the one whose constraints end up in C<sub>Γ</sub>.</p>

            <p>The public statement then becomes: <em>Given C<sub>t</sub> and a candidate embedding set U<sub>t</sub>, there exists S<sub>t</sub>, r<sub>t</sub> such that C<sub>t</sub> = Com(S<sub>t</sub>; r<sub>t</sub>) and U<sub>t</sub> = C<sub>Γ</sub>(S<sub>t</sub>).</em></p>

            <p>If the system wants to enjoy the authority of "EQBSL embeddings", it must accept the cost of proving it.</p>
          `
        },
        {
          title: '6. Zero-Knowledge Layer',
          content: `
            <p>All of the above can, in principle, be done with transparent commitments and non-zero-knowledge proofs. In practice, it is often socially and legally necessary to keep raw evidence private, while still providing verifiable guarantees about trust computation.</p>

            <p><strong>Prover and Verifier Views:</strong> The prover knows the full states S<sub>t</sub>, S<sub>t+1</sub>, the randomness r<sub>t</sub>, r<sub>t+1</sub> for commitments, and the complete event set Δ<sub>t</sub>. The verifier sees public inputs (C<sub>t</sub>, C<sub>t+1</sub>, Δ<sub>t</sub><sup>pub</sup>), optional published embeddings U<sub>t</sub>, U<sub>t+1</sub> and/or opinions for selected edges, and a zero-knowledge proof π<sub>t</sub> attesting that the constraints of C<sub>F</sub> (and optionally C<sub>Ψ</sub>, C<sub>Γ</sub>) are satisfied.</p>

            <p>A modern proof system (SNARK, STARK, etc.) provides succinct π<sub>t</sub> and efficient verification. The choice of scheme is a question of engineering, not of algebra.</p>

            <p><strong>Revelation Policies:</strong> One of the advantages of working in evidence space is granularity. A system can commit to the entire E<sub>t</sub> but only reveal aggregate opinions for a subset of edges, embeddings for a subset of nodes, or coarse-grained statistics for compliance or audit. The proof does not care; it only cares that the revealed pieces are consistent with some hidden whole that obeys the EQBSL operator.</p>
          `
        },
        {
          title: '7. Conclusion',
          content: `
            <p>The point of this paper is not to sell yet another proof system. It is to show that once trust is written as evidence flow (EQBSL), the usual excuses for unverifiable behaviour look thin. If you can write down F and Γ, you can arithmetise them. If you can arithmetise them, you can prove you followed them.</p>

            <p>There are, of course, costs: circuit size, prover time, and the usual headaches of efficient arithmetisation. But these are honest costs. They make explicit the computational price of epistemic hygiene in a domain that has grown accustomed to free-floating scores.</p>

            <p>In exchange, one gains a property that "trust oracles" by design never had: the obligation to show their work, or at least a zero-knowledge proof that the work exists.</p>
          `
        }
      ]
    }
  };

  paper = computed(() => {
    const id = this.paperId();
    return this.paperDatabase[id] || null;
  });

  constructor() {
    // Re-render math whenever the paper changes
    effect(() => {
      const currentPaper = this.paper();
      if (currentPaper) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => this.renderMath(), 0);
      }
    });
  }

  private renderMath(): void {
    const containerRef = this.contentContainer();
    if (!containerRef) return;
    
    const container = containerRef.nativeElement;
    if (!container) return;
    
    // Import KaTeX dynamically
    import('katex').then((katex) => {
      // Find all math expressions in the content
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      const nodesToReplace: { node: Node; parent: Node; html: string }[] = [];

      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent || '';
        
        // Check for display math ($$...$$) or inline math ($...$)
        if (text.includes('$')) {
          let html = text;
          
          // Process display math first ($$...$$)
          html = html.replace(/\$\$([^\$]+)\$\$/g, (match, math) => {
            try {
              return '<span class="math-display">' + katex.renderToString(math.trim(), {
                displayMode: true,
                throwOnError: false
              }) + '</span>';
            } catch (e) {
              return match;
            }
          });
          
          // Process inline math ($...$)
          html = html.replace(/\$([^\$]+)\$/g, (match, math) => {
            try {
              return '<span class="math-inline">' + katex.renderToString(math.trim(), {
                displayMode: false,
                throwOnError: false
              }) + '</span>';
            } catch (e) {
              return match;
            }
          });
          
          if (html !== text && node.parentNode) {
            nodesToReplace.push({
              node: node,
              parent: node.parentNode,
              html: html
            });
          }
        }
      }

      // Replace nodes with rendered math
      nodesToReplace.forEach(({ node, parent, html }) => {
        const span = document.createElement('span');
        span.innerHTML = html;
        parent.replaceChild(span, node);
      });
    }).catch((err) => {
      console.error('Failed to load KaTeX:', err);
    });
  }
}

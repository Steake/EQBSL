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
      title: 'EBSL in ZK Reputation Systems',
      authors: 'O. C. Hirst [Steake] & Shadowgraph Labs (2025)',
      abstract: 'This paper explores the integration of Epistemic Belief State Logic (EBSL) with zero-knowledge proof systems for reputation management. We present a formal framework that enables privacy-preserving verification of trust and reputation states without revealing underlying evidence or individual assessments. The system combines subjective logic operations with cryptographic protocols to maintain both privacy and verifiability in distributed reputation networks.',
      downloadUrl: 'https://raw.githubusercontent.com/Steake/EQBSL/main/Papers/EBSL%20in%20ZK%20Reputation%20Systems.pdf',
      sections: [
        {
          title: '1. Introduction to EBSL',
          content: `
            <p>Epistemic Belief State Logic (EBSL) provides a mathematical framework for reasoning about uncertainty, belief, and disbelief in distributed systems. Unlike traditional binary trust models, EBSL represents opinions as triplets that capture three distinct dimensions:</p>
            
            <ul>
              <li><strong>Belief (b)</strong>: The evidence supporting a positive assessment</li>
              <li><strong>Disbelief (d)</strong>: The evidence supporting a negative assessment</li>
              <li><strong>Uncertainty (u)</strong>: The lack of evidence in either direction</li>
            </ul>

            <p>These components are constrained by the fundamental relation:</p>
            <div class="math-display">b + d + u = 1</div>
            
            <p>This representation allows for explicit modeling of uncertainty, which is critical in reputation systems where evidence may be incomplete or contradictory. The EBSL framework also defines operators for combining opinions, discounting trust based on source reliability, and reasoning about transitive trust relationships.</p>
          `
        },
        {
          title: '2. Zero-Knowledge Integration',
          content: `
            <p>Zero-knowledge proofs enable one party (the prover) to convince another party (the verifier) that a statement is true without revealing any information beyond the validity of the statement itself. In the context of reputation systems, ZK proofs provide several key benefits:</p>
            
            <ul>
              <li><strong>Privacy Preservation</strong>: Users can prove reputation thresholds without exposing exact scores</li>
              <li><strong>Evidence Confidentiality</strong>: The underlying evidence and assessments remain private</li>
              <li><strong>Selective Disclosure</strong>: Parties can reveal specific properties without full transparency</li>
            </ul>

            <p>We leverage zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) to create compact, efficiently verifiable proofs about EBSL opinion states. The key technical challenge is encoding the floating-point EBSL operations into arithmetic circuits compatible with zk-SNARK proving systems.</p>
          `
        },
        {
          title: '3. Reputation System Architecture',
          content: `
            <p>Our ZK-EBSL reputation system consists of several key components:</p>

            <ul>
              <li><strong>Opinion Store</strong>: Cryptographically committed storage of EBSL opinions</li>
              <li><strong>Aggregation Circuit</strong>: zk-SNARK circuit for combining opinions using EBSL operators</li>
              <li><strong>Proof Generator</strong>: Constructs ZK proofs of reputation properties</li>
              <li><strong>Verification Layer</strong>: Smart contracts or distributed nodes validating proofs</li>
            </ul>

            <p>The architecture ensures that while individual opinions remain private, aggregate reputation metrics can be publicly verified through zero-knowledge proofs. This enables applications such as anonymous credential systems, privacy-preserving recommendation networks, and confidential voting mechanisms.</p>
          `,
          subsections: [
            {
              title: '3.1 Commitment Scheme',
              content: `
                <p>We use Pedersen commitments to bind parties to their opinion values without revealing them:</p>
                <div class="math-display">C(b, d, u) = g^b · h^d · k^u · r^s</div>
                <p>where <em>g</em>, <em>h</em>, <em>k</em>, <em>r</em> are generators and <em>s</em> is a random blinding factor. This commitment is both hiding (reveals nothing about b, d, u) and binding (cannot be changed after commitment).</p>
              `
            },
            {
              title: '3.2 Aggregation Protocol',
              content: `
                <p>The consensus operator in EBSL combines multiple opinions from different sources. For two opinions ω<sub>A</sub> = (b<sub>A</sub>, d<sub>A</sub>, u<sub>A</sub>) and ω<sub>B</sub> = (b<sub>B</sub>, d<sub>B</sub>, u<sub>B</sub>), the fused opinion is:</p>
                
                <div class="math-display">
                  b = (b<sub>A</sub>u<sub>B</sub> + b<sub>B</sub>u<sub>A</sub>) / (u<sub>A</sub> + u<sub>B</sub> - u<sub>A</sub>u<sub>B</sub>)
                </div>
                
                <p>Our ZK circuit implements this operation while maintaining privacy of individual opinions. The prover demonstrates that the aggregate opinion was correctly computed without revealing the source opinions.</p>
              `
            }
          ]
        },
        {
          title: '4. Privacy-Preserving Trust Computations',
          content: `
            <p>The system supports several privacy-preserving operations:</p>

            <ul>
              <li><strong>Threshold Proofs</strong>: Prove belief exceeds a threshold without revealing exact value</li>
              <li><strong>Range Proofs</strong>: Demonstrate reputation falls within a specified range</li>
              <li><strong>Relationship Proofs</strong>: Show comparative relationships between hidden opinions</li>
              <li><strong>Transitivity Proofs</strong>: Verify trust chains without exposing intermediate assessments</li>
            </ul>

            <p>Each of these primitives is realized through carefully designed zk-SNARK circuits that encode EBSL operations. The proofs are succinct (constant size regardless of computation complexity) and non-interactive (require no back-and-forth between prover and verifier).</p>
          `
        },
        {
          title: '5. Implementation Considerations',
          content: `
            <p>Practical deployment of ZK-EBSL systems requires addressing several challenges:</p>

            <ul>
              <li><strong>Fixed-Point Arithmetic</strong>: EBSL uses real numbers, but circuits require finite fields. We employ fixed-point representations with sufficient precision (typically 32-64 bits).</li>
              <li><strong>Proof Generation Time</strong>: zk-SNARK proving can be computationally intensive. We optimize circuits and use batching techniques to improve throughput.</li>
              <li><strong>Trusted Setup</strong>: Many zk-SNARK systems require a trusted setup ceremony. We recommend using transparent alternatives like STARKs or Bulletproofs where appropriate.</li>
              <li><strong>Base Rate Handling</strong>: EBSL opinions include a base rate parameter. This must be consistently handled across the system to ensure correct aggregation.</li>
            </ul>

            <p>We provide reference implementations in Circom (for circuit definition) and snarkjs (for proof generation and verification) that demonstrate these techniques in practice.</p>
          `
        },
        {
          title: '6. Conclusion',
          content: `
            <p>The integration of EBSL with zero-knowledge proofs creates a powerful framework for privacy-preserving reputation systems. By enabling verifiable computations over hidden opinions, we can build trust networks that protect individual privacy while maintaining collective accountability.</p>

            <p>Future work includes optimizing circuit implementations, extending to quantum-resistant proof systems, and developing standardized protocols for inter-system reputation portability. The ZK-EBSL framework represents a significant step toward building truly private yet trustworthy digital reputation infrastructure.</p>
          `
        }
      ]
    },
    'eqbsl-quantum': {
      id: 'eqbsl-quantum',
      title: 'EQBSL+ZK: Quantum Extensions',
      authors: 'O. C. Hirst [Steake] & Shadowgraph Labs (2025)',
      abstract: 'This paper presents Extended Quantum Belief State Logic (EQBSL), a framework that extends traditional EBSL with quantum-resistant cryptographic primitives and post-quantum zero-knowledge proof systems. We address the emerging threat of quantum computers to existing cryptographic reputation systems and propose a comprehensive solution that maintains security in the post-quantum era while preserving the expressive power of belief state logic.',
      downloadUrl: 'https://raw.githubusercontent.com/Steake/EQBSL/main/Papers/EQBSL%2BZK.pdf',
      sections: [
        {
          title: '1. Quantum Resistance Background',
          content: `
            <p>The advent of large-scale quantum computers poses a fundamental threat to current cryptographic systems. Shor's algorithm can efficiently factor large integers and compute discrete logarithms, breaking RSA, DSA, and elliptic curve cryptography. This has profound implications for reputation systems that rely on these primitives:</p>

            <ul>
              <li><strong>Signature Schemes</strong>: Current digital signatures would become forgeable</li>
              <li><strong>Commitment Schemes</strong>: Many commitments rely on discrete log assumptions</li>
              <li><strong>ZK Proof Systems</strong>: zk-SNARKs and many other protocols depend on elliptic curve pairings</li>
            </ul>

            <p>EQBSL addresses these vulnerabilities by building on post-quantum cryptographic foundations that remain secure even against quantum adversaries. We focus on lattice-based, hash-based, and multivariate polynomial cryptography as the basis for quantum-resistant trust systems.</p>
          `
        },
        {
          title: '2. Extended Quantum Belief State Logic Framework',
          content: `
            <p>EQBSL extends classical EBSL in several key dimensions:</p>

            <ul>
              <li><strong>Quantum Opinion States</strong>: Opinions encoded in quantum-resistant commitment schemes</li>
              <li><strong>Lattice-Based Aggregation</strong>: Trust fusion using lattice-based cryptographic operations</li>
              <li><strong>Post-Quantum Signatures</strong>: Integration with CRYSTALS-Dilithium and other PQC signature schemes</li>
              <li><strong>Quantum-Resistant ZK</strong>: Proof systems based on symmetric cryptography and hash functions</li>
            </ul>

            <p>The extended framework maintains the semantic properties of EBSL while ensuring all cryptographic operations resist quantum attacks. This requires careful redesign of the underlying primitives while preserving the high-level abstractions that make EBSL useful for modeling trust.</p>
          `
        },
        {
          title: '3. Post-Quantum Cryptographic Primitives',
          content: `
            <p>EQBSL relies on several classes of post-quantum primitives:</p>
          `,
          subsections: [
            {
              title: '3.1 Lattice-Based Commitments',
              content: `
                <p>Instead of Pedersen commitments, we use lattice-based schemes such as those based on the Learning With Errors (LWE) problem. A commitment to opinion (b, d, u) takes the form:</p>
                
                <div class="math-display">C = A · s + e + m · ⌊q/2⌋</div>
                
                <p>where <strong>A</strong> is a public random matrix, <strong>s</strong> is a secret vector, <strong>e</strong> is a small error vector, <strong>m</strong> encodes the opinion values, and <em>q</em> is a modulus. The security relies on the hardness of LWE, which is believed to be quantum-resistant.</p>
              `
            },
            {
              title: '3.2 Hash-Based Signatures',
              content: `
                <p>For signing reputation attestations, we employ hash-based signature schemes like SPHINCS+. These signatures are based solely on the security of cryptographic hash functions, making them highly resistant to both classical and quantum attacks:</p>

                <ul>
                  <li><strong>Stateless Operation</strong>: Unlike earlier hash-based schemes, SPHINCS+ requires no state management</li>
                  <li><strong>Provable Security</strong>: Security reduces directly to hash function properties</li>
                  <li><strong>Conservative Choice</strong>: Hash functions are well-understood and time-tested</li>
                </ul>

                <p>The trade-off is larger signature sizes compared to classical schemes, but this is acceptable for many reputation system applications where security is paramount.</p>
              `
            },
            {
              title: '3.3 Multivariate Polynomial Systems',
              content: `
                <p>For certain operations, we leverage multivariate polynomial cryptography. The security of these systems relies on the difficulty of solving systems of multivariate quadratic equations over finite fields, a problem believed to be hard even for quantum computers.</p>

                <p>We use these primitives particularly for key encapsulation and certain specialized proof protocols that benefit from the algebraic structure of multivariate systems.</p>
              `
            }
          ]
        },
        {
          title: '4. Quantum-Resistant ZK Proofs',
          content: `
            <p>The most challenging aspect of EQBSL is developing zero-knowledge proof systems that remain secure against quantum adversaries. We employ several approaches:</p>

            <ul>
              <li><strong>ZK-STARKs</strong>: Transparent, quantum-resistant proofs based on collision-resistant hash functions</li>
              <li><strong>Ligero Family</strong>: Interactive proof systems converted to non-interactive using Fiat-Shamir in the quantum random oracle model</li>
              <li><strong>MPC-in-the-Head</strong>: Proofs based on secure multi-party computation, providing quantum resistance through information-theoretic security</li>
            </ul>

            <p>Each approach has different trade-offs in terms of proof size, verification time, and assumptions. EQBSL provides a modular framework that can accommodate different proof systems depending on application requirements.</p>
          `,
          subsections: [
            {
              title: '4.1 STARK-Based Opinion Proofs',
              content: `
                <p>ZK-STARKs (Zero-Knowledge Scalable Transparent Arguments of Knowledge) provide quantum resistance without requiring a trusted setup. For EQBSL operations, we encode the computation as an algebraic intermediate representation (AIR) and prove correct execution:</p>

                <div class="math-display">∀ i: f(T[i+1]) = g(T[i], w[i])</div>

                <p>where <strong>T</strong> is the execution trace, <strong>w</strong> contains witness values (the hidden opinions), and <em>f</em>, <em>g</em> encode the EBSL operations. The prover demonstrates that the trace is consistent with the claimed result without revealing the intermediate opinion values.</p>
              `
            },
            {
              title: '4.2 Interactive Proof Compilation',
              content: `
                <p>For certain applications, we use interactive proof protocols compiled to non-interactive form using the Fiat-Shamir transform in the quantum random oracle model (QROM). Recent results show that with appropriate parameter choices, this transformation remains secure against quantum adversaries.</p>

                <p>The key is ensuring that the hash function used in Fiat-Shamir is modeled as a quantum random oracle, and that the underlying sigma protocol satisfies special soundness properties. Our implementation carefully validates these requirements for each proof protocol used in EQBSL.</p>
              `
            }
          ]
        },
        {
          title: '5. Protocol Specifications',
          content: `
            <p>EQBSL defines standardized protocols for common reputation system operations:</p>

            <ul>
              <li><strong>Opinion Registration</strong>: Submitting and committing to an opinion using lattice-based commitments</li>
              <li><strong>Aggregate Proof Generation</strong>: Proving correct aggregation of multiple opinions using STARK proofs</li>
              <li><strong>Threshold Verification</strong>: Demonstrating reputation exceeds a threshold without revealing the exact value</li>
              <li><strong>Transitivity Proof</strong>: Proving indirect trust relationships through chains of opinions</li>
            </ul>

            <p>Each protocol is specified with precise security parameters, computational complexity bounds, and migration paths from classical EBSL systems. This enables gradual deployment of quantum-resistant infrastructure before quantum threats become practical.</p>
          `
        },
        {
          title: '6. Performance Analysis',
          content: `
            <p>Post-quantum cryptography generally incurs higher computational costs than classical alternatives. Our benchmarks show:</p>

            <ul>
              <li><strong>Commitment Generation</strong>: 2-5x slower than Pedersen commitments</li>
              <li><strong>Proof Generation</strong>: 10-100x slower depending on proof system choice (STARKs vs. Ligero)</li>
              <li><strong>Verification Time</strong>: Generally comparable or faster than classical systems</li>
              <li><strong>Proof Size</strong>: 10-1000x larger depending on system (STARKs are particularly large)</li>
            </ul>

            <p>These overheads are acceptable for many applications, particularly those where reputation updates are infrequent relative to queries. We also identify optimization opportunities through batching, recursive proof composition, and hardware acceleration.</p>
          `
        },
        {
          title: '7. Conclusion and Future Directions',
          content: `
            <p>EQBSL provides a comprehensive framework for building reputation systems that will remain secure in the post-quantum era. By carefully integrating lattice-based cryptography, hash-based signatures, and quantum-resistant zero-knowledge proofs, we enable trust infrastructure that can withstand future cryptanalytic advances.</p>

            <p>Future work includes standardization efforts, formal security proofs in quantum models, integration with emerging PQC standards (NIST selections), and development of efficient implementations for resource-constrained devices. As quantum computing technology advances, EQBSL provides a roadmap for evolving existing reputation systems toward quantum resistance.</p>
          `
        }
      ]
    },
    'proof-trust': {
      id: 'proof-trust',
      title: 'Proof-Carrying Trust',
      authors: 'O. C. Hirst [Steake] & Shadowgraph Labs (2025)',
      abstract: 'Drawing inspiration from proof-carrying code, we introduce proof-carrying trust: a framework where trust assertions are accompanied by cryptographic proofs of their validity. This approach enables distributed systems to make trust decisions based on verifiable evidence rather than blind faith. We develop the theoretical foundations, present practical implementations, and explore applications in decentralized networks, supply chains, and federated systems.',
      downloadUrl: 'https://raw.githubusercontent.com/Steake/EQBSL/main/Papers/Proof-Carrying-Trust.pdf',
      sections: [
        {
          title: '1. Trust in Distributed Systems',
          content: `
            <p>Distributed systems face a fundamental challenge: how can independent parties establish and maintain trust without a central authority? Traditional approaches rely on:</p>

            <ul>
              <li><strong>Centralized PKI</strong>: Certificate authorities that serve as trust anchors</li>
              <li><strong>Web of Trust</strong>: Decentralized but subjective trust relationships</li>
              <li><strong>Reputation Systems</strong>: Historical behavior as a predictor of future trustworthiness</li>
            </ul>

            <p>Each approach has limitations. Centralized systems create single points of failure and censorship. Web of trust models are difficult to reason about formally. Pure reputation systems can be manipulated through sybil attacks and strategic behavior.</p>

            <p>Proof-carrying trust offers a complementary approach: instead of asking "should I trust this entity?", we ask "what evidence supports this trust claim, and can I verify it independently?"</p>
          `
        },
        {
          title: '2. Proof-Carrying Code Analogy',
          content: `
            <p>Proof-carrying code (PCC) is a security technique where code is accompanied by a formal proof that it satisfies certain safety properties. The code consumer verifies the proof rather than analyzing the code itself:</p>

            <div class="math-display">Code + Proof → Verification → Trust</div>

            <p>Proof-carrying trust applies the same principle to trust relationships:</p>

            <div class="math-display">Assertion + Proof → Verification → Trust Decision</div>

            <p>Just as PCC enables safe execution of untrusted code, proof-carrying trust enables safe interaction with untrusted parties. The key insight is that trust claims can be backed by verifiable cryptographic evidence, making trust decisions objective rather than subjective.</p>
          `,
          subsections: [
            {
              title: '2.1 Trust Assertions',
              content: `
                <p>A trust assertion is a statement about an entity's properties or behaviors. Examples include:</p>

                <ul>
                  <li>"Entity A has reputation score ≥ 0.8 based on ≥ 50 reviews"</li>
                  <li>"Entity B has been vouched for by at least 3 entities with reputation ≥ 0.9"</li>
                  <li>"Entity C has successfully completed ≥ 100 transactions with dispute rate &lt; 2%"</li>
                </ul>

                <p>Each assertion is formalized as a logical proposition that can be true or false. The role of proof-carrying trust is to provide cryptographic evidence that substantiates these assertions.</p>
              `
            },
            {
              title: '2.2 Trust Proofs',
              content: `
                <p>A trust proof is a cryptographic object that demonstrates the validity of a trust assertion. Using zero-knowledge techniques, proofs can be constructed that reveal only the claim, not the underlying evidence:</p>

                <div class="math-display">π = Prove(Assertion, Evidence, Secrets)</div>

                <p>The verifier can check the proof without accessing the private evidence:</p>

                <div class="math-display">Verify(Assertion, π) → {Accept, Reject}</div>

                <p>This preserves privacy while enabling verifiable trust. For example, an entity can prove they have sufficient reputation without revealing their complete transaction history or the identities of their reviewers.</p>
              `
            }
          ]
        },
        {
          title: '3. Cryptographic Proof Framework',
          content: `
            <p>Our framework supports multiple types of trust proofs:</p>

            <ul>
              <li><strong>Threshold Proofs</strong>: Demonstrate a metric exceeds a threshold</li>
              <li><strong>Aggregation Proofs</strong>: Show correct combination of multiple trust signals</li>
              <li><strong>Provenance Proofs</strong>: Trace the origin and chain of custody of trust claims</li>
              <li><strong>Temporal Proofs</strong>: Establish timing properties (e.g., "reputation has been stable for 6 months")</li>
              <li><strong>Conditional Proofs</strong>: Demonstrate implications (e.g., "if condition X holds, then trust assertion Y is valid")</li>
            </ul>

            <p>Each proof type is implemented using appropriate cryptographic primitives: range proofs, set membership proofs, signature aggregation, commitment schemes, and zero-knowledge SNARKs or STARKs for complex computations.</p>
          `,
          subsections: [
            {
              title: '3.1 Proof Composition',
              content: `
                <p>A powerful feature of our framework is proof composition: complex trust proofs can be built from simpler components. For example, proving "Entity A is trusted" might involve:</p>

                <ol>
                  <li>Proof that A has high reputation (threshold proof)</li>
                  <li>Proof that A's reputation comes from diverse sources (aggregation proof)</li>
                  <li>Proof that A has been active for sufficient time (temporal proof)</li>
                  <li>Proof that A holds required certifications (membership proof)</li>
                </ol>

                <p>These component proofs are combined using logical operators (AND, OR, threshold) to form a compound proof. The verifier checks the compound proof against the compound assertion, without needing to understand the internal structure.</p>
              `
            },
            {
              title: '3.2 Recursive Trust',
              content: `
                <p>Trust relationships are often transitive: if A trusts B, and B trusts C, then A may have derived trust in C. Proof-carrying trust supports recursive proofs that establish these transitive relationships:</p>

                <div class="math-display">Trust(A → C) = f(Trust(A → B), Trust(B → C))</div>

                <p>where <em>f</em> is a trust fusion function (such as EBSL discounting or other operators). The proof π<sub>AC</sub> demonstrates correct application of <em>f</em> to the constituent trust relationships, without revealing the full trust graph or intermediate assessments.</p>

                <p>This enables trust chains and delegation: a party can delegate trust decisions to intermediaries, and the intermediary provides a proof that their trust assessment is sound. This is particularly useful in federated and hierarchical systems.</p>
              `
            }
          ]
        },
        {
          title: '4. Trust Transitivity and Propagation',
          content: `
            <p>Trust propagation in decentralized networks is a fundamental challenge. Proof-carrying trust addresses this through verifiable trust chains:</p>

            <ul>
              <li><strong>Direct Trust</strong>: A directly trusts B based on personal interaction (verified through signatures and transaction records)</li>
              <li><strong>Recommended Trust</strong>: A trusts C because B (whom A trusts) recommends C (verified through cryptographic vouching)</li>
              <li><strong>Composite Trust</strong>: A trusts D based on multiple indirect paths (verified through aggregated proofs)</li>
            </ul>

            <p>Each trust edge in the network carries a proof of its validity. When computing derived trust, the system collects and verifies all relevant proofs, ensuring that trust decisions are based on valid evidence.</p>
          `,
          subsections: [
            {
              title: '4.1 Trust Discounting',
              content: `
                <p>When trust is transitive, it typically diminishes with distance. If A trusts B with weight w<sub>AB</sub>, and B trusts C with weight w<sub>BC</sub>, then A's derived trust in C is discounted:</p>

                <div class="math-display">w<sub>AC</sub> = w<sub>AB</sub> · w<sub>BC</sub> · d</div>

                <p>where <em>d</em> is a discounting factor (often &lt; 1). The proof π<sub>AC</sub> demonstrates that this discounting was correctly applied. This prevents trust from being artificially amplified through long chains of recommendations.</p>
              `
            },
            {
              title: '4.2 Conflict Resolution',
              content: `
                <p>When multiple trust paths exist between parties, they may provide conflicting evidence. Our framework uses EBSL to handle conflicts:</p>

                <ul>
                  <li><strong>Consensus Operator</strong>: Fuses independent opinions into a single assessment</li>
                  <li><strong>Weighted Aggregation</strong>: Gives more weight to more reliable trust paths</li>
                  <li><strong>Contradiction Detection</strong>: Identifies and flags inconsistent evidence</li>
                </ul>

                <p>The proof demonstrates that conflict resolution was performed correctly according to the specified logic. This makes trust decisions auditable and predictable, even in complex networks with contradictory information.</p>
              `
            }
          ]
        },
        {
          title: '5. Implementation Examples',
          content: `
            <p>We present reference implementations in several domains:</p>
          `,
          subsections: [
            {
              title: '5.1 Decentralized Marketplace',
              content: `
                <p>In a decentralized marketplace without a central authority, buyers and sellers use proof-carrying trust to make transactions safer:</p>

                <ul>
                  <li>Sellers prove they have successfully completed many transactions</li>
                  <li>Buyers prove they have funds available without revealing balances</li>
                  <li>Escrow agents prove they are bonded and insured</li>
                  <li>Dispute resolvers prove their expertise and impartiality</li>
                </ul>

                <p>Each proof is verified before the transaction proceeds. This creates a trustless marketplace where participants make informed decisions based on verifiable evidence rather than reputation alone.</p>
              `
            },
            {
              title: '5.2 Supply Chain Verification',
              content: `
                <p>In supply chains, proof-carrying trust enables end-to-end verification:</p>

                <ul>
                  <li>Manufacturers prove compliance with standards without revealing proprietary processes</li>
                  <li>Shippers prove chain of custody and proper handling</li>
                  <li>Distributors prove authenticity of products</li>
                  <li>Retailers prove ethical sourcing without exposing supplier relationships</li>
                </ul>

                <p>Each participant in the supply chain adds their proof to the product's provenance record. Consumers can verify the entire chain, ensuring authenticity and ethical practices while respecting business confidentiality.</p>
              `
            },
            {
              title: '5.3 Federated Identity',
              content: `
                <p>In federated identity systems, proof-carrying trust enables portable reputation across domains:</p>

                <ul>
                  <li>Users prove attributes and credentials without revealing underlying identity</li>
                  <li>Identity providers prove they verified user information following standards</li>
                  <li>Relying parties accept proofs instead of re-verifying users</li>
                  <li>Reputation from one domain is provably transferred to another</li>
                </ul>

                <p>This enables seamless interaction across organizational boundaries while maintaining privacy and security. Users control their identity proofs and selectively disclose properties as needed for each interaction.</p>
              `
            }
          ]
        },
        {
          title: '6. Security Properties',
          content: `
            <p>Proof-carrying trust provides several formal security properties:</p>

            <ul>
              <li><strong>Soundness</strong>: Invalid trust claims cannot be proven (except with negligible probability)</li>
              <li><strong>Zero-Knowledge</strong>: Proofs reveal only the claim, not underlying evidence or secrets</li>
              <li><strong>Non-Transferability</strong>: Proofs can be bound to specific contexts or verifiers</li>
              <li><strong>Revocability</strong>: Proofs can be made revocable through certificate revocation or time limits</li>
              <li><strong>Forward Security</strong>: Past proofs remain valid even if current secrets are compromised</li>
            </ul>

            <p>We provide formal security proofs in the cryptographic game model, showing that these properties hold under standard assumptions (discrete log, random oracle, etc.). Quantum-resistant variants are also available using lattice-based or hash-based primitives.</p>
          `
        },
        {
          title: '7. Conclusion',
          content: `
            <p>Proof-carrying trust represents a paradigm shift in how distributed systems establish trust. By requiring cryptographic proofs to accompany trust claims, we move from subjective, reputation-based trust to objective, verifiable trust.</p>

            <p>This approach has broad applications: decentralized marketplaces, supply chain transparency, federated identity, secure multi-party computation, and beyond. As cryptographic proof systems become more efficient (through SNARKs, STARKs, and hardware acceleration), proof-carrying trust will become practical for a wider range of applications.</p>

            <p>Future work includes standardization of proof formats, development of trust policy languages for expressing complex trust requirements, integration with blockchain and distributed ledger technologies, and exploration of quantum-resistant variants. The proof-carrying trust framework provides a foundation for building verifiable trust infrastructure for the next generation of distributed systems.</p>
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

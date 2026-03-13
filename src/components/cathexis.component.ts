import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EbslService } from '../services/ebsl.service';

type ProfileId = 'new' | 'good' | 'bad' | 'mixed' | 'validator';
type ScenarioId = 'baseline' | 'stress';

interface QueryState {
  r: number;
  s: number;
  degree: number;
  clustering: number;
  recency: number;
  volatility: number;
  hyperedgeLoad: number;
}

interface DemoAgent extends QueryState {
  id: string;
  name: string;
}

interface CathexisCategory {
  id: number;
  handle: string;
  gloss: string;
  guidance: string;
  style: string;
  prototype: number[];
}

interface CategoryProbability {
  category: CathexisCategory;
  probability: number;
}

interface BatchAssignment {
  agent: DemoAgent;
  probabilities: CategoryProbability[];
  top: CategoryProbability;
  featureVector: number[];
}

interface CategorySummaryView {
  category: CathexisCategory;
  members: string[];
  count: number;
  meanConfidence: number;
  meanFeatureVector: number[];
  topFeatureIndices: number[];
  drift: number;
}

@Component({
  selector: 'app-cathexis',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold text-white mb-2">CATHEXIS Layer</h2>
          <p class="text-slate-400 max-w-3xl">
            CATHEXIS sits on top of EQBSL and turns feature states <span class="text-indigo-300 font-mono">xᵢ(t)</span>
            into category mixtures <span class="text-amber-300 font-mono">pᵢ(t)</span>, then stable human-readable handles.
            This demo shows both the offline batch pipeline and an online per-agent query.
          </p>
        </div>
        <div class="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm">
          <div class="text-slate-400">Paper model:</div>
          <div class="font-mono text-slate-200">xᵢ(t) → fθ(x) → pᵢ(t) → cᵢ(t) → label</div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div class="xl:col-span-2 bg-slate-800/30 border border-slate-700 rounded-2xl p-6 space-y-6">
          <div>
            <h3 class="text-lg font-bold text-white mb-2">1. Online Query (Per-Agent Handle)</h3>
            <p class="text-sm text-slate-400">
              Adjust trust, graph, and behavioural signals to build a real CATHEXIS feature vector, then run the categoriser.
            </p>
          </div>

          <div>
            <label class="block text-xs uppercase tracking-wider text-slate-500 mb-2 font-bold">Load Profile</label>
            <div class="grid grid-cols-2 gap-2">
              @for (p of profileButtons; track p.id) {
                <button
                  (click)="setProfile(p.id)"
                  class="px-3 py-2 rounded border text-xs font-semibold transition-colors"
                  [class]="activeProfile() === p.id
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'"
                >
                  {{ p.label }}
                </button>
              }
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <div class="flex justify-between mb-1 text-sm">
                <label class="text-emerald-400">Positive Evidence (r)</label>
                <span class="font-mono text-white">{{ query().r }}</span>
              </div>
              <input type="range" min="0" max="80" step="1" [value]="query().r" (input)="updateField('r', $event)"
                class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500">
            </div>
            <div>
              <div class="flex justify-between mb-1 text-sm">
                <label class="text-red-400">Negative Evidence (s)</label>
                <span class="font-mono text-white">{{ query().s }}</span>
              </div>
              <input type="range" min="0" max="80" step="1" [value]="query().s" (input)="updateField('s', $event)"
                class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500">
            </div>
            <div>
              <div class="flex justify-between mb-1 text-sm">
                <label class="text-slate-300">Graph Degree</label>
                <span class="font-mono text-white">{{ query().degree }}</span>
              </div>
              <input type="range" min="0" max="12" step="1" [value]="query().degree" (input)="updateField('degree', $event)"
                class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500">
            </div>
            <div>
              <div class="flex justify-between mb-1 text-sm">
                <label class="text-slate-300">Clustering</label>
                <span class="font-mono text-white">{{ query().clustering.toFixed(2) }}</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" [value]="query().clustering" (input)="updateField('clustering', $event)"
                class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500">
            </div>
            <div>
              <div class="flex justify-between mb-1 text-sm">
                <label class="text-slate-300">Recency / Activity</label>
                <span class="font-mono text-white">{{ query().recency }}</span>
              </div>
              <input type="range" min="0" max="10" step="1" [value]="query().recency" (input)="updateField('recency', $event)"
                class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500">
            </div>
            <div>
              <div class="flex justify-between mb-1 text-sm">
                <label class="text-slate-300">Behaviour Volatility</label>
                <span class="font-mono text-white">{{ query().volatility }}</span>
              </div>
              <input type="range" min="0" max="10" step="1" [value]="query().volatility" (input)="updateField('volatility', $event)"
                class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500">
            </div>
            <div>
              <div class="flex justify-between mb-1 text-sm">
                <label class="text-slate-300">Hyperedge Load</label>
                <span class="font-mono text-white">{{ query().hyperedgeLoad }}</span>
              </div>
              <input type="range" min="0" max="10" step="1" [value]="query().hyperedgeLoad" (input)="updateField('hyperedgeLoad', $event)"
                class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500">
            </div>
          </div>

          <div class="bg-black/20 rounded-lg border border-slate-700/50 p-4 font-mono text-xs">
            <div class="text-indigo-400 font-bold mb-2">Feature State xᵢ(t)</div>
            <div class="text-slate-400 leading-relaxed break-all">
              {{ queryFeatureVectorText() }}
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2 text-slate-500">
              <div>b={{ queryOpinion().b.toFixed(3) }}</div>
              <div>d={{ queryOpinion().d.toFixed(3) }}</div>
              <div>u={{ queryOpinion().u.toFixed(3) }}</div>
              <div>E(ω)={{ queryExpectation().toFixed(3) }}</div>
            </div>
          </div>
          
          <div class="flex gap-2">
             <button (click)="setProfile('new')" class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors">New</button>
             <button (click)="setProfile('good')" class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors">Good</button>
             <button (click)="setProfile('bad')" class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors">Bad</button>
             <button (click)="setProfile('mixed')" class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors">Mixed</button>
          </div>
        </div>

        <div class="xl:col-span-3 space-y-6">
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-emerald-500/10 rounded-2xl blur-xl"></div>
            <div class="relative bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div class="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
                <div>
                  <div class="text-xs font-bold tracking-widest text-amber-500 uppercase mb-2">Online Query Result</div>
                  <div [class]="'inline-flex px-4 py-2 rounded-full border text-base font-bold ' + currentCategory().style">
                    {{ currentCategory().handle }}
                  </div>
                  <p class="text-slate-300 italic mt-3 max-w-2xl">"{{ currentCategory().gloss }}"</p>
                  <p class="text-xs text-slate-500 mt-2">{{ currentCategory().guidance }}</p>
                </div>
                <div class="w-full lg:w-80 space-y-2">
                  <div class="text-xs uppercase tracking-wider text-slate-500 font-bold">Category Distribution pᵢ(t)</div>
                  @for (row of currentProbabilities(); track row.category.id) {
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="text-slate-300">{{ row.category.handle }}</span>
                        <span class="font-mono text-slate-400">{{ (row.probability * 100).toFixed(1) }}%</span>
                      </div>
                      <div class="h-2 rounded bg-slate-800 overflow-hidden border border-slate-700/60">
                        <div class="h-full transition-all duration-300" [style.width.%]="row.probability * 100"
                          [class]="barClass(row.category.id)"></div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h3 class="text-lg font-bold text-white">2. Offline Batch CATHEXIS Pipeline</h3>
                <p class="text-sm text-slate-400">Classify a snapshot, build category summaries μₖ(t), and compare drift across scenarios.</p>
              </div>
              <div class="inline-flex bg-slate-900 rounded-lg border border-slate-700 p-1">
                @for (s of scenarioButtons; track s.id) {
                  <button
                    (click)="scenario.set(s.id)"
                    class="px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                    [class]="scenario() === s.id
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-slate-400 hover:text-white'"
                  >
                    {{ s.label }}
                  </button>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 2xl:grid-cols-2 gap-4">
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Snapshot Assignments cᵢ(t)</div>
                <div class="space-y-2 max-h-80 overflow-auto pr-1">
                  @for (a of batchAssignments(); track a.agent.id) {
                    <div class="p-3 rounded-lg border border-slate-700/70 bg-slate-900">
                      <div class="flex justify-between items-center gap-3">
                        <div>
                          <div class="text-white font-medium">{{ a.agent.name }}</div>
                          <div class="text-xs text-slate-500 font-mono">{{ a.agent.id }}</div>
                        </div>
                        <div [class]="'px-2 py-1 rounded border text-xs font-bold ' + a.top.category.style">
                          {{ a.top.category.handle }}
                        </div>
                      </div>
                      <div class="mt-2 text-xs text-slate-400">
                        max p = <span class="font-mono">{{ a.top.probability.toFixed(3) }}</span>
                        · xᵢ dim = <span class="font-mono">{{ a.featureVector.length }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Category Summaries (μₖ, members, drift)</div>
                <div class="space-y-3 max-h-80 overflow-auto pr-1">
                  @for (s of batchSummaries(); track s.category.id) {
                    <div class="p-3 rounded-lg border border-slate-700/70 bg-slate-900">
                      <div class="flex items-center justify-between gap-3">
                        <div [class]="'px-2 py-1 rounded border text-xs font-bold ' + s.category.style">
                          {{ s.category.handle }}
                        </div>
                        <div class="text-xs text-slate-500 font-mono">
                          |Sₖ|={{ s.count }} · drift={{ s.drift.toFixed(3) }}
                        </div>
                      </div>
                      <div class="mt-2 text-xs text-slate-400">{{ s.category.gloss }}</div>
                      <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div class="text-slate-500">mean confidence</div>
                        <div class="font-mono text-slate-300 text-right">{{ s.meanConfidence.toFixed(3) }}</div>
                        <div class="text-slate-500">top features</div>
                        <div class="font-mono text-slate-300 text-right">{{ topFeaturesLabel(s.topFeatureIndices) }}</div>
                      </div>
                      <div class="mt-2 text-xs text-slate-500">
                        Members: <span class="text-slate-400">{{ s.members.join(', ') || 'none' }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
            <h3 class="text-lg font-bold text-white mb-3">3. CATHEXIS Usage (Rust Crate / Pipeline)</h3>
            <p class="text-sm text-slate-400 mb-4">
              The implemented <code class="font-mono text-indigo-300">cathexis</code> crate mirrors the yellowpaper pipeline: build features, run a categoriser,
              summarise categories, refresh labels, then query an agent handle online.
            </p>
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Offline Batch</div>
                <pre class="text-xs text-slate-300 overflow-x-auto"><code>let batch = engine.run_batch(BatchInput &#123;
  snapshot_time: 42,
  graph: &graph,
  eqbsl: &eqbsl,
&#125;)?;

engine.refresh_labels(&batch, &mut provider);</code></pre>
              </div>
              <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Online Query</div>
                <pre class="text-xs text-slate-300 overflow-x-auto"><code>let out = engine.query_agent_handle(QueryInput &#123;
  now: 42,
  agent_id: "alice",
  graph: &graph,
  eqbsl: &eqbsl,
&#125;)?;</code></pre>
              </div>
            </div>
            <div class="mt-4 p-4 rounded-lg bg-indigo-900/20 border border-indigo-500/30 text-sm text-indigo-100/80">
              This UI demo uses a prototype-based categoriser for interpretability, but the crate supports the MLP baseline
              (<code class="font-mono text-indigo-200">fθ</code>) and pluggable feature extractors / label providers.
            </div>
          </div>

          <!-- Neural Network Simulation -->
          <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
             <div class="absolute top-0 right-0 p-2 opacity-10">
               <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" /></svg>
             </div>

             <h3 class="text-lg font-bold text-white mb-6">Categoriser Output (Softmax)</h3>
             
             <div class="space-y-3">
               @for (cat of categories(); track cat.id) {
                 <div class="relative">
                   <div class="flex justify-between text-xs text-slate-300 mb-1">
                     <span>{{ cat.name }}</span>
                     <span>{{ (cat.prob * 100).toFixed(1) }}%</span>
                   </div>
                   <div class="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                     <div class="h-full transition-all duration-500" 
                          [style.width.%]="cat.prob * 100"
                          [class]="cat.color"></div>
                   </div>
                 </div>
               }
             </div>
          </div>

          <!-- Final Label Card -->
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-2xl blur-xl"></div>
            <div class="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center min-h-[200px]">
              
              <div class="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">LLM Generated Handle</div>
              
              <div [class]="'px-8 py-4 rounded-full border-2 text-xl font-bold shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all duration-500 ' + currentLabel().style">
                {{ currentLabel().handle }}
              </div>

              <p class="text-slate-300 italic mt-6 max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                "{{ currentLabel().gloss }}"
              </p>
              
              <div class="mt-6 pt-6 border-t border-slate-800 w-full text-left">
                
                <div class="mb-6">
                  <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Formal Model (from Paper)</h4>
                  <div class="bg-slate-950/50 p-4 rounded border border-slate-800 font-mono text-xs text-slate-400 space-y-2">
                    <div><span class="text-purple-400">x</span><sub>i</sub>(t) = <span class="text-blue-400">&Phi;</span>(i, <span class="text-emerald-400">u</span><sub>i</sub>(t), <span class="text-amber-400">G</span><sub>t</sub>) &in; &#8477;<sup>d</sup></div>
                    <div><span class="text-orange-400">f</span><sub>&theta;</sub>: &#8477;<sup>d</sup> &rarr; &Delta;<sup>K-1</sup></div>
                    <div>c<sub>i</sub>(t) = argmax<sub>k</sub> <span class="text-orange-400">f</span><sub>&theta;</sub>(<span class="text-purple-400">x</span><sub>i</sub>(t))<sub>k</sub></div>
                  </div>
                </div>

                <div class="mb-4">
                  <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Rust Implementation</h4>
                  <div class="text-[10px] text-slate-600 font-mono mb-1">cathexis-rs/src/pipeline.rs</div>
                  <div class="bg-black/50 p-3 rounded font-mono text-[10px] text-slate-400 overflow-x-auto border border-slate-800">
<pre>let features = self.graph.compute_features(agent_id)?;
let probs = self.categoriser.forward(&features)?;
let category_id = self.categoriser.predict(&features)?;
let label = self.labeler.generate_label(&category_id)?;</pre>
                  </div>
                </div>

                <div class="flex justify-center mt-6">
                   <a href="https://github.com/Steake/EQBSL/blob/main/docs/CATHEXIS-Manual.md" target="_blank" class="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors">
                     <span>Read the CATHEXIS System Manual</span>
                     <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                   </a>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class CathexisComponent {
  ebsl = inject(EbslService);
  readonly featureNames = ['b', 'd', 'u', 'E(ω)', 'degₙ', 'cluster', 'recency', 'volatility', 'hyper'];

  readonly categories: CathexisCategory[] = [
    {
      id: 0,
      handle: 'Ecosystem Steward',
      gloss: 'High evidence, low uncertainty, structurally central, and behaviourally stable.',
      guidance: 'Suitable as a trust anchor, but continue monitoring for concept drift.',
      style: 'text-emerald-300 border-emerald-500/60 bg-emerald-950/40',
      prototype: [0.88, 0.03, 0.09, 0.92, 0.80, 0.60, 0.90, 0.10, 0.70]
    },
    {
      id: 1,
      handle: 'Reliable Operator',
      gloss: 'Strong positive evidence and predictable behaviour with moderate network centrality.',
      guidance: 'Generally safe for routine interactions.',
      style: 'text-teal-300 border-teal-500/60 bg-teal-950/40',
      prototype: [0.72, 0.08, 0.20, 0.82, 0.45, 0.35, 0.75, 0.20, 0.35]
    },
    {
      id: 2,
      handle: 'Unverified Participant',
      gloss: 'Sparse evidence and elevated uncertainty; the system should avoid overconfident conclusions.',
      guidance: 'Require more evidence or external attestations before high-value interactions.',
      style: 'text-blue-300 border-blue-500/60 bg-blue-950/40',
      prototype: [0.18, 0.06, 0.76, 0.56, 0.18, 0.20, 0.35, 0.25, 0.15]
    },
    {
      id: 3,
      handle: 'Controversial Figure',
      gloss: 'Substantial evidence exists but is polarized, often with volatile behaviour.',
      guidance: 'Context-specific trust only; inspect the evidence tensor dimensions.',
      style: 'text-amber-300 border-amber-500/60 bg-amber-950/40',
      prototype: [0.42, 0.38, 0.20, 0.52, 0.55, 0.30, 0.65, 0.70, 0.50]
    },
    {
      id: 4,
      handle: 'High-Risk Actor',
      gloss: 'Negative evidence dominates and the behavioural pattern is unstable or adversarial.',
      guidance: 'Interaction discouraged; route through safeguards if unavoidable.',
      style: 'text-red-300 border-red-500/60 bg-red-950/40',
      prototype: [0.10, 0.72, 0.18, 0.19, 0.35, 0.15, 0.50, 0.85, 0.45]
    }
  ];

  profileButtons: { id: ProfileId; label: string }[] = [
    { id: 'new', label: 'New User' },
    { id: 'good', label: 'Power User' },
    { id: 'bad', label: 'Sybil / Bot' },
    { id: 'mixed', label: 'Controversial' },
    { id: 'validator', label: 'Validator' }
  ];

  scenarioButtons: { id: ScenarioId; label: string }[] = [
    { id: 'baseline', label: 'Baseline Snapshot' },
    { id: 'stress', label: 'Stress Snapshot' }
  ];

  activeProfile = signal<ProfileId>('new');
  scenario = signal<ScenarioId>('baseline');
  query = signal<QueryState>(this.profileState('new'));

  queryOpinion = computed(() => this.ebsl.calculateOpinion(this.query().r, this.query().s));
  queryExpectation = computed(() => this.ebsl.expectedProbability(this.queryOpinion()));
  queryFeatureVector = computed(() => this.buildFeatureVector(this.query()));
  queryFeatureVectorText = computed(() => `[${this.queryFeatureVector().map(v => v.toFixed(3)).join(', ')}]`);

  currentProbabilities = computed(() => this.classify(this.query()).sort((a, b) => b.probability - a.probability));
  currentCategory = computed(() => this.currentProbabilities()[0].category);

  batchAssignments = computed(() => {
    const agents = this.snapshotAgents(this.scenario());
    return agents.map((agent) => {
      const probs = this.classify(agent).sort((a, b) => b.probability - a.probability);
      return {
        agent,
        probabilities: probs,
        top: probs[0],
        featureVector: this.buildFeatureVector(agent)
      } satisfies BatchAssignment;
    });
  });

  batchSummaries = computed(() => {
    const current = this.summarise(this.batchAssignments());
    const baseline = this.summarise(
      this.snapshotAgents('baseline').map((agent) => {
        const probs = this.classify(agent).sort((a, b) => b.probability - a.probability);
        return { agent, probabilities: probs, top: probs[0], featureVector: this.buildFeatureVector(agent) } satisfies BatchAssignment;
      })
    );

    const baselineMap = new Map(baseline.map((s) => [s.category.id, s]));
    return current
      .map((s) => {
        const prev = baselineMap.get(s.category.id);
        return {
          ...s,
          drift: prev ? this.l2(s.meanFeatureVector, prev.meanFeatureVector) : s.drift
        };
      })
      .sort((a, b) => b.count - a.count || a.category.id - b.category.id);
  });

  setProfile(type: ProfileId) {
    this.activeProfile.set(type);
    this.query.set(this.profileState(type));
  }

  updateField(field: keyof QueryState, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    this.activeProfile.set('new');
    this.query.update((q) => ({ ...q, [field]: value }));
  }

  barClass(categoryId: number): string {
    switch (categoryId) {
      case 0: return 'bg-emerald-500';
      case 1: return 'bg-teal-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-amber-500';
      case 4: return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  }

  topFeaturesLabel(indices: number[]): string {
    return indices.slice(0, 3).map(i => this.featureNames[i] ?? `f${i}`).join(', ');
  }

  private profileState(id: ProfileId): QueryState {
    switch (id) {
      case 'good':
        return { r: 58, s: 4, degree: 6, clustering: 0.48, recency: 8, volatility: 2, hyperedgeLoad: 4 };
      case 'bad':
        return { r: 9, s: 46, degree: 5, clustering: 0.12, recency: 6, volatility: 9, hyperedgeLoad: 5 };
      case 'mixed':
        return { r: 28, s: 24, degree: 7, clustering: 0.26, recency: 7, volatility: 8, hyperedgeLoad: 6 };
      case 'validator':
        return { r: 72, s: 2, degree: 10, clustering: 0.61, recency: 9, volatility: 1, hyperedgeLoad: 8 };
      case 'new':
      default:
        return { r: 0, s: 0, degree: 1, clustering: 0, recency: 2, volatility: 2, hyperedgeLoad: 1 };
    }
  }

  private snapshotAgents(scenario: ScenarioId): DemoAgent[] {
    const base: DemoAgent[] = [
      { id: 'agent_001', name: 'Aster Market Maker', r: 64, s: 3, degree: 9, clustering: 0.58, recency: 9, volatility: 1, hyperedgeLoad: 7 },
      { id: 'agent_002', name: 'Delta OTC Desk', r: 49, s: 7, degree: 6, clustering: 0.42, recency: 8, volatility: 2, hyperedgeLoad: 4 },
      { id: 'agent_003', name: 'Fresh Wallet', r: 1, s: 0, degree: 1, clustering: 0.00, recency: 2, volatility: 2, hyperedgeLoad: 1 },
      { id: 'agent_004', name: 'Bridge Arb Syndicate', r: 33, s: 29, degree: 8, clustering: 0.21, recency: 8, volatility: 8, hyperedgeLoad: 7 },
      { id: 'agent_005', name: 'Sybil Ring Node', r: 6, s: 38, degree: 4, clustering: 0.07, recency: 7, volatility: 9, hyperedgeLoad: 5 },
      { id: 'agent_006', name: 'DAO Treasurer', r: 57, s: 2, degree: 8, clustering: 0.66, recency: 9, volatility: 2, hyperedgeLoad: 8 },
      { id: 'agent_007', name: 'Niche Curator', r: 12, s: 3, degree: 3, clustering: 0.54, recency: 5, volatility: 3, hyperedgeLoad: 2 },
      { id: 'agent_008', name: 'Cross-chain Bot', r: 17, s: 18, degree: 5, clustering: 0.18, recency: 10, volatility: 10, hyperedgeLoad: 6 }
    ];

    if (scenario === 'baseline') return base;

    return base.map((a) => {
      if (a.id === 'agent_002') return { ...a, s: a.s + 8, volatility: 5, recency: 6 };
      if (a.id === 'agent_004') return { ...a, s: a.s + 6, volatility: 9 };
      if (a.id === 'agent_006') return { ...a, r: a.r - 8, s: a.s + 5, recency: 6 };
      if (a.id === 'agent_008') return { ...a, r: a.r + 5, s: a.s + 3, volatility: 9 };
      return { ...a, recency: Math.max(1, a.recency - 1) };
    });
  }

  private classify(state: QueryState): CategoryProbability[] {
    const x = this.buildFeatureVector(state);
    const logits = this.categories.map((category) => -this.squaredDistance(x, category.prototype) * 2.4);
    const probs = this.softmax(logits);
    return this.categories.map((category, i) => ({ category, probability: probs[i] }));
  }

  private buildFeatureVector(state: QueryState): number[] {
    const op = this.ebsl.calculateOpinion(state.r, state.s);
    const expectation = this.ebsl.expectedProbability(op);
    return [
      op.b,
      op.d,
      op.u,
      expectation,
      this.clamp01(state.degree / 10),
      this.clamp01(state.clustering),
      this.clamp01(state.recency / 10),
      this.clamp01(state.volatility / 10),
      this.clamp01(state.hyperedgeLoad / 10),
    ];
  }

  private summarise(assignments: BatchAssignment[]): CategorySummaryView[] {
    const grouped = new Map<number, BatchAssignment[]>();
    for (const row of assignments) {
      const list = grouped.get(row.top.category.id) ?? [];
      list.push(row);
      grouped.set(row.top.category.id, list);
    }

    const summaries: CategorySummaryView[] = [];
    for (const category of this.categories) {
      const rows = grouped.get(category.id) ?? [];
      if (!rows.length) continue;

      const dim = rows[0].featureVector.length;
      const mean = new Array(dim).fill(0);
      for (const row of rows) {
        for (let i = 0; i < dim; i++) mean[i] += row.featureVector[i];
      }
      for (let i = 0; i < dim; i++) mean[i] /= rows.length;

      const globalMean = this.globalBatchMean(assignments);
      const ranked = mean
        .map((v, i) => ({ i, delta: Math.abs(v - globalMean[i]) }))
        .sort((a, b) => b.delta - a.delta)
        .map((x) => x.i);

      summaries.push({
        category,
        members: rows.map(r => r.agent.name),
        count: rows.length,
        meanConfidence: rows.reduce((acc, r) => acc + r.top.probability, 0) / rows.length,
        meanFeatureVector: mean,
        topFeatureIndices: ranked.slice(0, 4),
        drift: 0
      });
    }
    return summaries;
  }

  private globalBatchMean(assignments: BatchAssignment[]): number[] {
    if (!assignments.length) return [];
    const dim = assignments[0].featureVector.length;
    const mean = new Array(dim).fill(0);
    for (const row of assignments) {
      for (let i = 0; i < dim; i++) mean[i] += row.featureVector[i];
    }
    for (let i = 0; i < dim; i++) mean[i] /= assignments.length;
    return mean;
  }

  private squaredDistance(a: number[], b: number[]): number {
    let acc = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const d = a[i] - b[i];
      acc += d * d;
    }
    return acc;
  }

  private l2(a: number[], b: number[]): number {
    return Math.sqrt(this.squaredDistance(a, b));
  }

  private softmax(logits: number[]): number[] {
    const max = Math.max(...logits);
    const exps = logits.map((v) => Math.exp(v - max));
    const sum = exps.reduce((acc, v) => acc + v, 0) || 1;
    return exps.map((v) => v / sum);
  }

  private clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }
}

import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EbslService } from '../services/ebsl.service';

@Component({
  selector: 'app-cathexis',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-6xl mx-auto py-8 px-4">
      <div class="mb-10">
        <h2 class="text-3xl font-bold text-white mb-2">CATHEXIS Layer</h2>
        <p class="text-slate-400 max-w-2xl">
          Humans don't read tensors. They read labels. Cathexis uses a pipeline of feature extraction, neural categorization, and LLM labeling to map high-dimensional trust embeddings into semantic handles.
        </p>
        <p class="text-slate-500 text-sm mt-2">
          Reference Implementation: <code class="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">EQBSL/cathexis-rs</code>
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- COLUMN 1: INPUTS -->
        <div class="space-y-6">
          <div class="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
            <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs text-slate-300">1</span>
              Trust Signals
            </h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-emerald-400 mb-1">Positive Evidence (r)</label>
                <input type="range" min="0" max="100" [value]="r()" (input)="updateR($event)" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500">
                <div class="text-right text-xs text-slate-400 font-mono">{{ r() }}</div>
              </div>
              
              <div>
                <label class="block text-xs font-medium text-red-400 mb-1">Negative Evidence (s)</label>
                <input type="range" min="0" max="100" [value]="s()" (input)="updateS($event)" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500">
                <div class="text-right text-xs text-slate-400 font-mono">{{ s() }}</div>
              </div>
            </div>
          </div>

          <div class="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
            <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs text-slate-300">2</span>
              Graph Features
            </h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-blue-400 mb-1">Centrality</label>
                <input type="range" min="0" max="100" [value]="centrality()" (input)="updateCentrality($event)" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
              </div>
              <div>
                <label class="block text-xs font-medium text-purple-400 mb-1">Platform Activity</label>
                <input type="range" min="0" max="100" [value]="activity()" (input)="updateActivity($event)" class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500">
              </div>
            </div>
          </div>
          
          <div class="flex gap-2">
             <button (click)="setProfile('new')" class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors">New</button>
             <button (click)="setProfile('good')" class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors">Good</button>
             <button (click)="setProfile('bad')" class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors">Bad</button>
             <button (click)="setProfile('mixed')" class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors">Mixed</button>
          </div>
        </div>

        <!-- COLUMN 2: PIPELINE VISUALIZATION -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Feature Vector -->
          <div class="bg-black/40 border border-slate-800 rounded-xl p-4 font-mono text-xs">
            <div class="text-slate-500 mb-2">// Assembled Feature Vector x_i(t)</div>
            <div class="text-emerald-400 break-all">
              [ {{ featureVector().join(', ') }} ]
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
  
  // Inputs
  r = signal(0);
  s = signal(0);
  centrality = signal(10);
  activity = signal(20);

  // Computed Features
  featureVector = computed(() => {
    // Simulate normalization and feature assembly
    const r_norm = this.r() / 100;
    const s_norm = this.s() / 100;
    const cent_norm = this.centrality() / 100;
    const act_norm = this.activity() / 100;
    const u = 2 / (this.r() + this.s() + 2); // Uncertainty
    
    return [
      r_norm.toFixed(2), 
      s_norm.toFixed(2), 
      u.toFixed(2),
      cent_norm.toFixed(2),
      act_norm.toFixed(2)
    ];
  });

  // Simulated Categoriser Network Output
  categories = computed(() => {
    const r = this.r();
    const s = this.s();
    const cent = this.centrality();
    const act = this.activity();
    const total = r + s;

    // Heuristics to simulate NN weights
    let prob_steward = 0;
    let prob_reliable = 0;
    let prob_risk = 0;
    let prob_controversial = 0;
    let prob_unknown = 0;

    if (total < 5) {
      prob_unknown = 0.9;
      prob_risk = 0.1;
    } else {
      const ratio = r / total;
      
      // Steward: High volume, high ratio, high centrality
      if (ratio > 0.9) prob_steward = (total / 100) * (cent / 100);
      
      // Reliable: Good ratio, decent activity
      if (ratio > 0.8) prob_reliable = 0.8 * (act / 100);

      // Risk: Low ratio
      if (ratio < 0.4) prob_risk = 0.9;

      // Controversial: Mid ratio, high activity
      if (ratio >= 0.4 && ratio <= 0.6) prob_controversial = 0.8 * (act / 100);

      // Unknown: decays with activity
      prob_unknown = Math.max(0, 1 - (total/20));
    }

    // Normalize
    const sum = prob_steward + prob_reliable + prob_risk + prob_controversial + prob_unknown + 0.01;
    
    return [
      { id: 'steward', name: 'Ecosystem Steward', prob: prob_steward / sum, color: 'bg-emerald-500' },
      { id: 'reliable', name: 'Reliable Operator', prob: prob_reliable / sum, color: 'bg-teal-500' },
      { id: 'controversial', name: 'Controversial', prob: prob_controversial / sum, color: 'bg-amber-500' },
      { id: 'risk', name: 'High Risk', prob: prob_risk / sum, color: 'bg-red-500' },
      { id: 'unknown', name: 'Unverified / New', prob: prob_unknown / sum, color: 'bg-slate-500' },
    ].sort((a, b) => b.prob - a.prob);
  });

  // Label Generation (taking the top category)
  currentLabel = computed(() => {
    const top = this.categories()[0];
    
    switch(top.id) {
      case 'steward':
        return { 
          handle: "Ecosystem Steward", 
          gloss: "High volume of positive evidence with negligible defects. Trust anchor.",
          style: "text-emerald-400 border-emerald-500 bg-emerald-950/30"
        };
      case 'reliable':
        return { 
          handle: "Reliable Operator", 
          gloss: "Consistent positive performance with minor or justified exceptions.",
          style: "text-teal-400 border-teal-500 bg-teal-950/30"
        };
      case 'risk':
        return { 
          handle: "High-Risk Actor", 
          gloss: "History of negative outcomes. Interaction discouraged.",
          style: "text-red-400 border-red-500 bg-red-950/30"
        };
      case 'controversial':
        return { 
          handle: "Controversial Figure", 
          gloss: "Significant evidence exists, but it is deeply polarized.",
          style: "text-amber-400 border-amber-500 bg-amber-950/30"
        };
      default:
        return { 
          handle: "Unverified Participant", 
          gloss: "Insufficient evidence or activity to form a reliable reputation.",
          style: "text-slate-400 border-slate-500 bg-slate-950/30"
        };
    }
  });

  updateR(e: Event) { this.r.set(Number((e.target as HTMLInputElement).value)); }
  updateS(e: Event) { this.s.set(Number((e.target as HTMLInputElement).value)); }
  updateCentrality(e: Event) { this.centrality.set(Number((e.target as HTMLInputElement).value)); }
  updateActivity(e: Event) { this.activity.set(Number((e.target as HTMLInputElement).value)); }

  setProfile(type: 'new' | 'good' | 'bad' | 'mixed') {
    switch(type) {
      case 'new': 
        this.r.set(0); this.s.set(0); this.centrality.set(5); this.activity.set(10); 
        break;
      case 'good': 
        this.r.set(85); this.s.set(2); this.centrality.set(80); this.activity.set(90); 
        break;
      case 'bad': 
        this.r.set(12); this.s.set(40); this.centrality.set(20); this.activity.set(60); 
        break;
      case 'mixed': 
        this.r.set(45); this.s.set(42); this.centrality.set(90); this.activity.set(85); 
        break;
    }
  }
}

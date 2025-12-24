import { Component, computed, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EbslService } from '../services/ebsl.service';

@Component({
  selector: 'app-ebsl-playground',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto py-8 px-4">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-white mb-2">The EBSL Calculator</h2>
        <p class="text-slate-400">
          In Evidence-Based Subjective Logic, belief is not a single number. It is a triplet <i>(b, d, u)</i> derived from accumulated evidence.
          Observe how <span class="text-indigo-400">Uncertainty (<i>u</i>)</span> naturally decays only as total evidence increases.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- Controls -->
        <div class="space-y-8 bg-slate-800/30 p-8 rounded-2xl border border-slate-700">
          <div>
            <div class="flex justify-between mb-2">
              <label class="font-medium text-emerald-400">Positive Evidence (<i>r</i>)</label>
              <span class="font-mono text-white bg-slate-700 px-2 rounded">{{ r() }}</span>
            </div>
            <input 
              type="range" min="0" max="50" step="1" 
              [value]="r()" 
              (input)="updateR($event)"
              class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
            >
            <p class="text-xs text-slate-500 mt-2">Successful trades, honest validations, uptime.</p>
          </div>

          <div>
            <div class="flex justify-between mb-2">
              <label class="font-medium text-red-400">Negative Evidence (<i>s</i>)</label>
              <span class="font-mono text-white bg-slate-700 px-2 rounded">{{ s() }}</span>
            </div>
            <input 
              type="range" min="0" max="50" step="1" 
              [value]="s()" 
              (input)="updateS($event)"
              class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400"
            >
            <p class="text-xs text-slate-500 mt-2">Failed deliveries, slashings, downtime.</p>
          </div>

          <div class="pt-6 border-t border-slate-700">
            <h3 class="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Formal Definition</h3>
            <div class="bg-slate-900 p-4 rounded-lg font-mono text-sm text-slate-400 border border-slate-800 overflow-x-auto">
              <div>b = r / (r + s + 2) = <span class="text-emerald-400">{{ op().b.toFixed(3) }}</span></div>
              <div>d = s / (r + s + 2) = <span class="text-red-400">{{ op().d.toFixed(3) }}</span></div>
              <div>u = 2 / (r + s + 2) = <span class="text-indigo-400">{{ op().u.toFixed(3) }}</span></div>
            </div>
          </div>
        </div>

        <!-- Visualization -->
        <div class="space-y-8">
           <!-- Bar Chart Representation -->
           <div class="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h3 class="text-lg font-medium text-white mb-6">Opinion Composition</h3>
              <div class="h-16 w-full rounded-lg overflow-hidden flex font-mono text-xs font-bold text-white/90 shadow-lg">
                <div class="bg-emerald-500 flex items-center justify-center transition-all duration-500 relative group" [style.width.%]="op().b * 100">
                  @if (op().b > 0.1) { <span>b: {{ (op().b * 100).toFixed(1) }}%</span> }
                  <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div class="bg-indigo-500 flex items-center justify-center transition-all duration-500 relative group" [style.width.%]="op().u * 100">
                  @if (op().u > 0.1) { <span>u: {{ (op().u * 100).toFixed(1) }}%</span> }
                   <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div class="bg-red-500 flex items-center justify-center transition-all duration-500 relative group" [style.width.%]="op().d * 100">
                  @if (op().d > 0.1) { <span>d: {{ (op().d * 100).toFixed(1) }}%</span> }
                   <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
              
              <div class="mt-8 flex justify-between items-center bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <span class="text-slate-400">Expected Probability <i>E(&omega;)</i></span>
                <span class="text-2xl font-bold text-white">{{ expectation().toFixed(3) }}</span>
              </div>
           </div>

           <!-- Concept Note -->
           <div class="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
             <div class="flex gap-3">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <div>
                 <h4 class="text-indigo-300 font-medium mb-1">Why this matters</h4>
                 <p class="text-indigo-200/70 text-sm">
                   A newly created identity (0 evidence) has <i>u</i>=1.0. A binary system would have to arbitrarily assign it 0.5 or 0. EBSL explicitly models it as "Unknown".
                   As evidence accumulates, <i>u</i> &rarr; 0, forcing the system to "earn" its confidence.
                 </p>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  `
})
export class EbslPlaygroundComponent {
  ebsl = inject(EbslService);
  
  r = signal(0);
  s = signal(0);

  op = computed(() => this.ebsl.calculateOpinion(this.r(), this.s()));
  expectation = computed(() => this.ebsl.expectedProbability(this.op()));

  updateR(e: Event) {
    this.r.set(Number((e.target as HTMLInputElement).value));
  }

  updateS(e: Event) {
    this.s.set(Number((e.target as HTMLInputElement).value));
  }
}
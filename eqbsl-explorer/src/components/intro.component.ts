import { Component, ChangeDetectionStrategy, output } from '@angular/core';

@Component({
  selector: 'app-intro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto py-12 px-6">
      <header class="mb-16 text-center">
        <h1 class="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-6 tracking-tight">
          Verifiable Epistemic Trust
        </h1>
        <p class="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Explore the mathematical substrate for privacy-preserving, evidential reasoning in decentralized identity systems.
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div class="group relative p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer" (click)="navigate.emit('ebsl')">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 transition duration-500 blur"></div>
          <h3 class="text-xl font-bold text-white mb-2 relative">1. EBSL Logic</h3>
          <p class="text-slate-400 relative">
            From Probability to Belief. Move beyond binary trust scores. Understand how evidence (<i>r, s</i>) shapes uncertainty (<i>u</i>).
          </p>
          <div class="mt-4 flex items-center text-indigo-400 text-sm font-medium relative">
            Launch Interactive Calculator &rarr;
          </div>
        </div>

        <div class="group relative p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/50 transition-all cursor-pointer" (click)="navigate.emit('eqbsl')">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl opacity-0 group-hover:opacity-20 transition duration-500 blur"></div>
          <h3 class="text-xl font-bold text-white mb-2 relative">2. EQBSL Graph</h3>
          <p class="text-slate-400 relative">
            Trust Flow in Dynamic Networks. Vectorized evidence tensors and propagation operators on hypergraphs.
          </p>
          <div class="mt-4 flex items-center text-teal-400 text-sm font-medium relative">
            View Trust Graph &rarr;
          </div>
        </div>

        <div class="group relative p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-pink-500/50 transition-all cursor-pointer" (click)="navigate.emit('zk')">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl opacity-0 group-hover:opacity-20 transition duration-500 blur"></div>
          <h3 class="text-xl font-bold text-white mb-2 relative">3. Proof-Carrying Trust</h3>
          <p class="text-slate-400 relative">
            Zero-Knowledge Constraints. Prove that trust updates follow the rules without revealing raw evidence.
          </p>
          <div class="mt-4 flex items-center text-pink-400 text-sm font-medium relative">
            Simulate ZK Proof &rarr;
          </div>
        </div>

        <div class="group relative p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer" (click)="navigate.emit('cathexis')">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl opacity-0 group-hover:opacity-20 transition duration-500 blur"></div>
          <h3 class="text-xl font-bold text-white mb-2 relative">4. CATHEXIS</h3>
          <p class="text-slate-400 relative">
            Trust Handles. Map high-dimensional trust tensors to human-readable labels using AI.
          </p>
          <div class="mt-4 flex items-center text-amber-400 text-sm font-medium relative">
            Generate Handles &rarr;
          </div>
        </div>
      </div>
      
      <div class="border-t border-slate-800 pt-8">
        <h4 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Core Papers</h4>
        <ul class="space-y-3 text-sm text-slate-400 font-mono">
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Evidence-Based Subjective Logic in ZKML Identity Systems
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
            Proof-Carrying Trust: ZK Constraints for EQBSL
          </li>
           <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            EQBSL: Against Trust Scores
          </li>
        </ul>
      </div>
    </div>
  `
})
export class IntroComponent {
  navigate = output<string>();
}
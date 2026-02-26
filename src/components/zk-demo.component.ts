import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EbslService } from '../services/ebsl.service';

@Component({
  selector: 'app-zk-demo',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto py-12 px-6">
      <div class="mb-10 text-center">
        <h2 class="text-3xl font-bold text-white mb-2">Proof-Carrying Trust</h2>
        <p class="text-slate-400">
          Simulating Zero-Knowledge constraints for EQBSL. 
          The <span class="text-pink-400">Verifier</span> checks if the update operator <i>F(E<sub>t</sub>, &Delta;<sub>t</sub>)</i> was followed without seeing <i>E<sub>t</sub></i>.
        </p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-1 overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          
          <!-- Prover Side -->
          <div class="p-8 space-y-6">
            <div class="flex items-center gap-3 mb-6">
              <div class="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-slate-400">ROLE: PROVER</div>
              <div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Private Evidence Input (&Delta;<sub>t</sub>)</label>
              <div class="grid grid-cols-2 gap-4">
                 <button 
                   (click)="addPrivateEvidence(true)" 
                   class="p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/20 hover:border-emerald-500/50 transition-colors text-emerald-400 font-mono text-sm"
                 >
                   +1 Positive
                 </button>
                 <button 
                   (click)="addPrivateEvidence(false)" 
                   class="p-4 rounded-lg bg-red-900/20 border border-red-500/20 hover:border-red-500/50 transition-colors text-red-400 font-mono text-sm"
                 >
                   +1 Negative
                 </button>
              </div>
              <p class="text-xs text-slate-500 mt-3">Current Private State: r={{privateR()}}, s={{privateS()}}</p>
            </div>

            <button 
              (click)="generateProof()"
              [disabled]="isGenerating()"
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              @if(isGenerating()) {
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating Proof...
              } @else {
                <span>Generate Proof &pi;<sub>t</sub></span>
              }
            </button>
          </div>

          <!-- Verifier Side -->
          <div class="p-8 space-y-6 bg-slate-900/50">
             <div class="flex items-center gap-3 mb-6">
              <div class="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-slate-400">ROLE: VERIFIER</div>
            </div>

            <div class="space-y-4">
              <div class="p-4 rounded bg-black/40 border border-slate-800 font-mono text-sm">
                <div class="text-slate-500 text-xs mb-1">PUBLIC INPUTS</div>
                <div class="flex justify-between">
                  <span>Commitment <i>C<sub>t</sub></i>:</span>
                  <span class="text-slate-300">{{ commitment() }}</span>
                </div>
                <div class="flex justify-between mt-2">
                   <span>Proof <i>&pi;</i>:</span>
                   <span [class]="proof() ? 'text-pink-400' : 'text-slate-600'">{{ proof() ? '0x7f...3a' : 'None' }}</span>
                </div>
              </div>

              <div *ngIf="proof()" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div class="flex items-center gap-2 text-green-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <span class="font-bold">Constraint Check Passed</span>
                </div>
                <p class="text-xs text-slate-400">
                  The proof cryptographically asserts that the state transition follows operator <i>F</i> without revealing that you added {{ lastAction() }}.
                </p>
                
                <div class="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/20 rounded text-xs text-indigo-300">
                  Updated Trust Score (Public View): <br>
                  <span class="text-lg font-bold">{{ publicScore().toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class ZkDemoComponent {
  ebsl = inject(EbslService);
  privateR = signal(0);
  privateS = signal(0);
  isGenerating = signal(false);
  proof = signal(false);
  commitment = signal("0x00...00");
  lastAction = signal("");
  publicScore = signal(0.5); // Start at 0.5 (unknown/neutral ish)

  addPrivateEvidence(positive: boolean) {
    this.proof.set(false); // Reset proof
    if (positive) {
      this.privateR.update(v => v + 1);
      this.lastAction.set("positive evidence");
    } else {
      this.privateS.update(v => v + 1);
      this.lastAction.set("negative evidence");
    }
    // Simulate commitment change immediately (hash changes)
    this.commitment.set("0x" + Math.floor(Math.random()*16777215).toString(16) + "...");
  }

  generateProof() {
    this.isGenerating.set(true);
    setTimeout(() => {
      this.isGenerating.set(false);
      this.proof.set(true);
      
      // Calculate score based on EBSL logic (simple expectation for display)
      const r = this.privateR();
      const s = this.privateS();
      const op = this.ebsl.calculateOpinion(r, s, 0.5);
      this.publicScore.set(this.ebsl.expectedProbability(op));
    }, 1500);
  }
}

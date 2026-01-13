import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Official Documentation
        </h1>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto">
          Explore the research papers and official documentation for EQBSL and related technologies.
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        @for (paper of papers; track paper.filename) {
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 bg-indigo-500/10 rounded-lg">
                <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <span class="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">PDF</span>
            </div>
            
            <h3 class="text-xl font-semibold mb-2 text-slate-200">{{ paper.title }}</h3>
            <p class="text-slate-400 text-sm mb-4 line-clamp-3">{{ paper.description }}</p>
            
            <div class="flex items-center justify-between text-xs text-slate-500 mb-4 pb-4 border-b border-slate-700/50">
              <span>{{ paper.size }}</span>
              <span>{{ paper.type }}</span>
            </div>
            
            <div class="flex gap-2">
              <a 
                [href]="paper.viewUrl" 
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 text-center px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                View
              </a>
              <a 
                [href]="paper.downloadUrl" 
                download
                class="flex-1 text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Download
              </a>
            </div>
          </div>
        }
      </div>

      <div class="bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 text-center">
        <h2 class="text-2xl font-bold mb-4 text-slate-200">Additional Resources</h2>
        <p class="text-slate-400 mb-6 max-w-2xl mx-auto">
          These papers represent ongoing research into EQBSL (Extended Quantum Belief State Logic), 
          zero-knowledge proofs, and trust-based systems. For the latest updates and source code, 
          visit our GitHub repository.
        </p>
        <a 
          href="https://github.com/Steake/EQBSL" 
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors duration-200 font-medium"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path>
          </svg>
          View on GitHub
        </a>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class DocsComponent {
  papers = [
    {
      title: 'EBSL in ZK Reputation Systems',
      description: 'Explores the integration of Epistemic Belief State Logic (EBSL) with zero-knowledge proof systems for reputation management. Covers formal verification and privacy-preserving trust mechanisms.',
      filename: 'EBSL in ZK Reputation Systems.pdf',
      size: '178 KB',
      type: 'Research Paper',
      viewUrl: 'https://github.com/Steake/EQBSL/blob/main/Papers/EBSL%20in%20ZK%20Reputation%20Systems.pdf',
      downloadUrl: 'https://raw.githubusercontent.com/Steake/EQBSL/main/Papers/EBSL%20in%20ZK%20Reputation%20Systems.pdf'
    },
    {
      title: 'EQBSL+ZK: Quantum Extensions',
      description: 'Presents the Extended Quantum Belief State Logic framework with zero-knowledge integration. Details quantum-resistant protocols and advanced cryptographic constructions for belief state verification.',
      filename: 'EQBSL+ZK.pdf',
      size: '211 KB',
      type: 'Research Paper',
      viewUrl: 'https://github.com/Steake/EQBSL/blob/main/Papers/EQBSL%2BZK.pdf',
      downloadUrl: 'https://raw.githubusercontent.com/Steake/EQBSL/main/Papers/EQBSL%2BZK.pdf'
    },
    {
      title: 'Proof-Carrying Trust',
      description: 'Introduces a novel framework for carrying cryptographic proofs of trust across distributed systems. Combines formal logic with practical implementations for decentralized trust networks.',
      filename: 'Proof-Carrying-Trust.pdf',
      size: '202 KB',
      type: 'Research Paper',
      viewUrl: 'https://github.com/Steake/EQBSL/blob/main/Papers/Proof-Carrying-Trust.pdf',
      downloadUrl: 'https://raw.githubusercontent.com/Steake/EQBSL/main/Papers/Proof-Carrying-Trust.pdf'
    }
  ];
}
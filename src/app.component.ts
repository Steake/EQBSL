import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavComponent } from './components/nav.component';
import { IntroComponent } from './components/intro.component';
import { EbslPlaygroundComponent } from './components/ebsl-playground.component';
import { EqbslGraphComponent } from './components/eqbsl-graph.component';
import { ZkDemoComponent } from './components/zk-demo.component';
import { CathexisComponent } from './components/cathexis.component';
import { DocsComponent } from './components/docs.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NavComponent,
    IntroComponent,
    EbslPlaygroundComponent,
    EqbslGraphComponent,
    ZkDemoComponent,
    CathexisComponent,
    DocsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-200 selection:bg-indigo-500/30">
      <app-nav 
        [tabs]="tabs" 
        [activeTab]="activeTab()" 
        (onSelect)="activeTab.set($event)"
      />
      
      <main class="animate-in fade-in duration-500">
        @switch (activeTab()) {
          @case ('intro') { <app-intro (navigate)="activeTab.set($event)" /> }
          @case ('ebsl') { <app-ebsl-playground /> }
          @case ('eqbsl') { <app-eqbsl-graph /> }
          @case ('zk') { <app-zk-demo /> }
          @case ('cathexis') { <app-cathexis /> }
          @case ('docs') { <app-docs /> }
        }
      </main>

      <footer class="py-8 text-center text-slate-600 text-sm border-t border-slate-800/50 mt-12">
        <p>Based on research by O. C. Hirst [Steake] & Shadowgraph Labs (2025)</p>
      </footer>
    </div>
  `
})
export class AppComponent {
  activeTab = signal('intro');
  
  tabs = [
    { id: 'intro', label: 'Overview' },
    { id: 'ebsl', label: 'EBSL Logic' },
    { id: 'eqbsl', label: 'EQBSL Graph' },
    { id: 'zk', label: 'ZK Proofs' },
    { id: 'cathexis', label: 'Cathexis Handles' },
    { id: 'docs', label: 'Documentation' }
  ];
}

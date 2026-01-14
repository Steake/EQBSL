import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavComponent } from './components/nav.component';
import { IntroComponent } from './components/intro.component';
import { EbslPlaygroundComponent } from './components/ebsl-playground.component';
import { EqbslGraphComponent } from './components/eqbsl-graph.component';
import { ZkDemoComponent } from './components/zk-demo.component';
import { CathexisComponent } from './components/cathexis.component';
import { PapersComponent } from './components/papers.component';
import { PaperDetailComponent } from './components/paper-detail.component';

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
    PapersComponent,
    PaperDetailComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-200 selection:bg-indigo-500/30">
      <app-nav 
        [tabs]="tabs" 
        [activeTab]="activeTab()" 
        (onSelect)="handleTabSelect($event)"
      />
      
      <main class="animate-in fade-in duration-500">
        @switch (activeTab()) {
          @case ('intro') { <app-intro (navigate)="activeTab.set($event)" /> }
          @case ('ebsl') { <app-ebsl-playground /> }
          @case ('eqbsl') { <app-eqbsl-graph /> }
          @case ('zk') { <app-zk-demo /> }
          @case ('cathexis') { <app-cathexis /> }
          @case ('papers') { <app-papers (viewPaper)="viewPaper($event)" /> }
          @case ('paper-detail') { 
            <app-paper-detail 
              [paperId]="selectedPaper()" 
              (back)="handleTabSelect('papers')" 
            /> 
          }
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
  selectedPaper = signal('');
  
  tabs = [
    { id: 'intro', label: 'Overview' },
    { id: 'ebsl', label: 'EBSL Logic' },
    { id: 'eqbsl', label: 'EQBSL Graph' },
    { id: 'zk', label: 'ZK Proofs' },
    { id: 'cathexis', label: 'Cathexis Handles' },
    { id: 'papers', label: 'Papers' }
  ];

  handleTabSelect(tabId: string): void {
    this.activeTab.set(tabId);
    if (tabId !== 'paper-detail') {
      this.selectedPaper.set('');
    }
  }

  viewPaper(paperId: string): void {
    this.selectedPaper.set(paperId);
    this.activeTab.set('paper-detail');
  }
}
// Update SHA is: d59c9f00b8d1887bae9407b4cb4ad7835b67e633

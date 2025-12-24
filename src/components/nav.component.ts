import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
              E
            </div>
            <span class="font-bold text-lg tracking-tight">ZK-EBSL <span class="text-slate-500 font-normal">Explorer</span></span>
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              @for (tab of tabs(); track tab.id) {
                <button
                  (click)="onSelect.emit(tab.id)"
                  [class]="activeTab() === tab.id 
                    ? 'bg-slate-800 text-white px-3 py-2 rounded-md text-sm font-medium border border-slate-700 transition-all'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-all'"
                >
                  {{ tab.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavComponent {
  tabs = input.required<{id: string, label: string}[]>();
  activeTab = input.required<string>();
  onSelect = output<string>();
}
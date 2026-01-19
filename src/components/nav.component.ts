import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
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
          
          <!-- Desktop Navigation -->
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

          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button
              (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              class="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              aria-expanded="false"
            >
              <span class="sr-only">Open main menu</span>
              <!-- Hamburger icon -->
              @if (!mobileMenuOpen()) {
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              } @else {
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      @if (mobileMenuOpen()) {
        <div class="md:hidden border-t border-slate-800">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            @for (tab of tabs(); track tab.id) {
              <button
                (click)="handleMobileSelect(tab.id)"
                [class]="activeTab() === tab.id 
                  ? 'bg-slate-800 text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium border border-slate-700 transition-all'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-all'"
              >
                {{ tab.label }}
              </button>
            }
          </div>
        </div>
      }
    </nav>
  `
})
export class NavComponent {
  tabs = input.required<{id: string, label: string}[]>();
  activeTab = input.required<string>();
  onSelect = output<string>();
  mobileMenuOpen = signal(false);

  handleMobileSelect(tabId: string): void {
    this.onSelect.emit(tabId);
    this.mobileMenuOpen.set(false);
  }
}
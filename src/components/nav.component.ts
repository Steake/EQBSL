import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    /* Hamburger icon animation */
    .hamburger-line {
      transition: all 0.3s ease-in-out;
      transform-origin: center;
    }
    
    .hamburger-open .line-1 {
      transform: translateY(6px) rotate(45deg);
    }
    
    .hamburger-open .line-2 {
      opacity: 0;
      transform: scaleX(0);
    }
    
    .hamburger-open .line-3 {
      transform: translateY(-6px) rotate(-45deg);
    }
    
    /* Mobile menu slide animation */
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .mobile-menu-enter {
      animation: slideDown 0.2s ease-out;
    }
    
    /* Menu items stagger animation */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .menu-item {
      animation: fadeInUp 0.3s ease-out backwards;
    }
    
    .menu-item:nth-child(1) { animation-delay: 0.05s; }
    .menu-item:nth-child(2) { animation-delay: 0.1s; }
    .menu-item:nth-child(3) { animation-delay: 0.15s; }
    .menu-item:nth-child(4) { animation-delay: 0.2s; }
    .menu-item:nth-child(5) { animation-delay: 0.25s; }
    .menu-item:nth-child(6) { animation-delay: 0.3s; }
  `],
  template: `
    <nav class="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
              E
            </div>
            <span class="font-bold text-lg tracking-tight">EQBSL <span class="text-slate-500 font-normal">Explorer</span></span>
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
              [attr.aria-expanded]="mobileMenuOpen()"
            >
              <span class="sr-only">{{ mobileMenuOpen() ? 'Close main menu' : 'Open main menu' }}</span>
              <!-- Animated hamburger icon -->
              <svg 
                class="h-6 w-6" 
                [class.hamburger-open]="mobileMenuOpen()"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
              >
                <line class="hamburger-line line-1" x1="4" y1="6" x2="20" y2="6" stroke-width="2" stroke-linecap="round" />
                <line class="hamburger-line line-2" x1="4" y1="12" x2="20" y2="12" stroke-width="2" stroke-linecap="round" />
                <line class="hamburger-line line-3" x1="4" y1="18" x2="20" y2="18" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      @if (mobileMenuOpen()) {
        <div class="md:hidden border-t border-slate-800 mobile-menu-enter">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            @for (tab of tabs(); track tab.id) {
              <button
                (click)="handleMobileSelect(tab.id)"
                class="menu-item"
                [ngClass]="{
                  'bg-slate-800 text-white border border-slate-700': activeTab() === tab.id,
                  'text-slate-400 hover:text-white hover:bg-slate-800': activeTab() !== tab.id,
                  'block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-all': true
                }"
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

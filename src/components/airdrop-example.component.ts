import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { EbslService } from '../services/ebsl.service';

type ClaimPath = 'ecdsa' | 'zk';
type PayoutCurve = 'LINEAR' | 'SQRT' | 'QUADRATIC';

@Component({
  selector: 'app-airdrop-example',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 space-y-8 sm:space-y-10">
      <header class="text-center max-w-4xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-lg shadow-emerald-950/20 text-emerald-300 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
          Applied Example
        </div>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance tracking-tight">Reputation-Gated Airdrops</h2>
        <p class="text-slate-400 leading-relaxed text-sm sm:text-base max-w-3xl mx-auto text-pretty">
          This example adapts the flow from the Shadowgraph Reputation-Gated Airdrop project into the EQBSL Explorer.
          It shows how evidence becomes an opinion, how that opinion becomes a scaled reputation score, and how that score gates an airdrop claim.
        </p>
        <a
          href="https://github.com/Steake/Reputation-Gated-Airdrop"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
        >
          View reference implementation
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 3h7m0 0v7m0-7L10 14"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5v14h14"></path>
          </svg>
        </a>
      </header>

      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950/90 p-4 sm:p-5 shadow-xl shadow-black/20">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Expectation</div>
          <div class="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">{{ expectation().toFixed(3) }}</div>
          <div class="text-xs text-slate-400 mt-2">Expected trust probability from the current opinion.</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950/90 p-4 sm:p-5 shadow-xl shadow-black/20">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Scaled score</div>
          <div class="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">{{ scaledScore() | number:'1.0-0' }}</div>
          <div class="text-xs text-slate-400 mt-2">Mapped into the airdrop’s 0..1,000,000 score range.</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950/90 p-4 sm:p-5 shadow-xl shadow-black/20">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Eligibility</div>
          <div class="text-lg sm:text-2xl font-bold tracking-tight" [class]="eligible() ? 'text-emerald-400' : 'text-red-400'">
            {{ eligible() ? 'Pass' : 'Fail' }}
          </div>
          <div class="text-xs text-slate-400 mt-2">Threshold is {{ floorScore | number:'1.0-0' }} for this campaign.</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950/90 p-4 sm:p-5 shadow-xl shadow-black/20">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Quoted payout</div>
          <div class="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">{{ payoutTokens().toFixed(2) }}</div>
          <div class="text-xs text-slate-400 mt-2">Current payout result using the selected claim path and curve.</div>
        </div>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] gap-6 xl:gap-8 items-start">
        <div class="bg-gradient-to-b from-slate-800/45 to-slate-900/55 border border-slate-700/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
          <div>
            <h3 class="text-xl font-semibold text-white mb-2">1. Claimant evidence</h3>
            <p class="text-slate-400 text-sm leading-relaxed">
              Think of this as a simple reputation record. Positive evidence means "things this wallet did well." Negative evidence means "things that count against trust."
            </p>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <div class="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 to-transparent px-4 py-3 shadow-lg shadow-emerald-950/10">
              <div class="text-xs uppercase tracking-wider text-emerald-300/80 mb-1">Good history</div>
              <div class="text-2xl font-mono font-bold text-emerald-400">{{ r() }}</div>
                <div class="text-xs text-emerald-200/70 mt-1">Derived trust-supporting evidence total</div>
            </div>
            <div class="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/8 to-transparent px-4 py-3 shadow-lg shadow-red-950/10">
              <div class="text-xs uppercase tracking-wider text-red-300/80 mb-1">Bad history</div>
              <div class="text-2xl font-mono font-bold text-red-400">{{ s() }}</div>
                <div class="text-xs text-red-200/70 mt-1">Derived trust-reducing evidence total</div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg shadow-black/10">
            <div class="flex justify-between mb-2">
                <label class="text-emerald-400 font-medium">Positive attestations</label>
                <span class="font-mono text-white bg-slate-900 px-2 py-0.5 rounded">{{ positiveAttestations() }}</span>
            </div>
            <input
              type="range"
              min="0"
                max="20"
              step="1"
                [value]="positiveAttestations()"
                (input)="positiveAttestations.set(toNumber($event))"
              class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            >
              <p class="text-xs text-slate-500 mt-2">How many credible attestations or endorsements the claimant received from other parties.</p>
          </div>

          <div class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg shadow-black/10">
            <div class="flex justify-between mb-2">
                <label class="text-emerald-400 font-medium">Successful prior actions</label>
                <span class="font-mono text-white bg-slate-900 px-2 py-0.5 rounded">{{ successfulActions() }}</span>
            </div>
            <input
              type="range"
              min="0"
                max="20"
              step="1"
                [value]="successfulActions()"
                (input)="successfulActions.set(toNumber($event))"
                class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              >
              <p class="text-xs text-slate-500 mt-2">Completed deliveries, valid prior claims, or other successful on-chain / off-chain outcomes.</p>
            </div>

            <div class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg shadow-black/10">
              <div class="flex justify-between mb-2">
                <label class="text-red-400 font-medium">Negative reports or disputes</label>
                <span class="font-mono text-white bg-slate-900 px-2 py-0.5 rounded">{{ negativeReports() }}</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                [value]="negativeReports()"
                (input)="negativeReports.set(toNumber($event))"
              class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            >
              <p class="text-xs text-slate-500 mt-2">Complaints, bad attestations, disputes, or moderation-relevant negative outcomes.</p>
            </div>

            <div class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg shadow-black/10">
              <div class="flex justify-between mb-2">
                <label class="text-red-400 font-medium">Fraud / sybil flags</label>
                <span class="font-mono text-white bg-slate-900 px-2 py-0.5 rounded">{{ fraudFlags() }}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                [value]="fraudFlags()"
                (input)="fraudFlags.set(toNumber($event))"
                class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              >
              <p class="text-xs text-slate-500 mt-2">Heavier-weight negative signals such as sybil detection, fraud markers, or severe policy violations.</p>
            </div>

          <div class="grid sm:grid-cols-2 gap-4 pt-2">
            <div class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg shadow-black/10">
              <label class="block text-sm font-medium text-slate-300 mb-2">Claim path</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  (click)="claimPath.set('ecdsa')"
                  [class]="claimPath() === 'ecdsa' ? activeButtonClass : inactiveButtonClass"
                >
                  ECDSA
                </button>
                <button
                  (click)="claimPath.set('zk')"
                  [class]="claimPath() === 'zk' ? activeButtonClass : inactiveButtonClass"
                >
                  ZK
                </button>
              </div>
              <p class="text-xs text-slate-500 mt-3">Switch between signed claims and proof-based claims.</p>
            </div>

            <div class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg shadow-black/10">
              <label class="block text-sm font-medium text-slate-300 mb-2">Payout curve</label>
              <select
                [value]="curve()"
                (change)="curve.set(toCurve($event))"
                class="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-200 px-3 py-2"
              >
                <option value="LINEAR">Linear</option>
                <option value="SQRT">Square root</option>
                <option value="QUADRATIC">Quadratic</option>
              </select>
              <p class="text-xs text-slate-500 mt-3">Controls how quickly higher reputation reaches maximum payout.</p>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg shadow-black/10">
            <div class="flex justify-between mb-2">
              <label class="text-slate-300 font-medium">Reputation age (days)</label>
              <span class="font-mono text-white bg-slate-900 px-2 py-0.5 rounded">{{ reputationAgeDays() }}</span>
            </div>
            <input
              type="range"
              min="0"
              max="14"
              step="1"
              [value]="reputationAgeDays()"
              (input)="reputationAgeDays.set(toNumber($event))"
              class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            >
            <p class="text-xs text-slate-500 mt-2">The reference ZK path uses a freshness window; the example defaults to 7 days.</p>
          </div>
        </div>

        <div class="bg-gradient-to-b from-slate-900 to-slate-950/95 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl shadow-black/25">
          <div>
            <h3 class="text-xl font-semibold text-white mb-2">2. Derived reputation + claim outcome</h3>
            <p class="text-slate-400 text-sm">
              Parameters below mirror the reference project: score scale 0..1,000,000, floor 600,000, cap 1,000,000, payout range 100..1000 tokens.
            </p>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div class="bg-gradient-to-b from-slate-800/70 to-slate-900/80 rounded-xl p-4 border border-slate-700 shadow-lg shadow-black/10">
              <div class="text-xs uppercase tracking-wider text-slate-500 mb-2">Opinion</div>
              <div class="space-y-1 font-mono text-sm">
                <div class="flex justify-between"><span class="text-slate-400">b</span><span class="text-emerald-400">{{ opinion().b.toFixed(3) }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">d</span><span class="text-red-400">{{ opinion().d.toFixed(3) }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">u</span><span class="text-indigo-400">{{ opinion().u.toFixed(3) }}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">E(ω)</span><span class="text-white">{{ expectation().toFixed(3) }}</span></div>
              </div>
            </div>

            <div class="bg-gradient-to-b from-slate-800/70 to-slate-900/80 rounded-xl p-4 border border-slate-700 shadow-lg shadow-black/10">
              <div class="text-xs uppercase tracking-wider text-slate-500 mb-2">Scaled score</div>
              <div class="text-3xl font-bold text-white font-mono">{{ scaledScore() | number:'1.0-0' }}</div>
              <div class="mt-2 text-xs text-slate-400">Eligibility threshold: {{ floorScore | number:'1.0-0' }}</div>
              <div class="text-xs text-slate-400">Cap for max payout: {{ capScore | number:'1.0-0' }}</div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 sm:p-5 shadow-xl shadow-black/15">
            <div class="flex flex-wrap items-center gap-3 justify-between mb-4">
              <div>
                <h4 class="text-white font-semibold">Score ramp</h4>
                <p class="text-xs text-slate-500 mt-1">Where the current score sits relative to floor and cap.</p>
              </div>
              <div class="flex flex-wrap gap-2 text-[11px]">
                <span class="px-2.5 py-1 rounded-full border border-red-500/20 bg-red-500/10 text-red-300">Below floor</span>
                <span class="px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300">Eligible ramp</span>
                <span class="px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">Max payout zone</span>
              </div>
            </div>

            <div class="rounded-xl overflow-hidden border border-slate-800">
            <div class="h-4 sm:h-5 flex">
              <div class="bg-red-500/80" [style.width.%]="floorPercent"></div>
              <div class="bg-amber-500/80" [style.width.%]="capPercent - floorPercent"></div>
              <div class="bg-emerald-500/80" [style.width.%]="100 - capPercent"></div>
            </div>
            <div class="relative h-16 sm:h-14 bg-slate-950">
              <div class="absolute inset-y-2 border-l-2 border-white/80" [style.left.%]="scorePercent()"></div>
              <div class="absolute -translate-x-1/2 top-2 px-2 py-0.5 rounded bg-white text-[10px] text-slate-900 font-semibold whitespace-nowrap" [style.left.%]="scorePercent()">
                {{ scaledScore() | number:'1.0-0' }}
              </div>
              <div class="absolute left-3 bottom-2 text-[11px] text-slate-500">Floor {{ floorScore | number:'1.0-0' }}</div>
              <div class="absolute right-3 bottom-2 text-[11px] text-slate-500">Cap {{ capScore | number:'1.0-0' }}</div>
            </div>
          </div>
          </div>

          <div class="grid lg:grid-cols-2 gap-4">
            <div class="rounded-xl p-4 sm:p-5 border min-h-36 shadow-lg" [class]="eligible() ? 'bg-gradient-to-b from-emerald-950/35 to-emerald-900/15 border-emerald-500/30 shadow-emerald-950/10' : 'bg-gradient-to-b from-red-950/35 to-red-900/15 border-red-500/30 shadow-red-950/10'">
              <div class="text-xs uppercase tracking-wider mb-2" [class]="eligible() ? 'text-emerald-300' : 'text-red-300'">Eligibility</div>
              <div class="text-lg font-semibold" [class]="eligible() ? 'text-emerald-400' : 'text-red-400'">
                {{ eligible() ? 'Eligible to claim' : 'Below claim threshold' }}
              </div>
              <p class="text-sm mt-2" [class]="eligible() ? 'text-emerald-200/80' : 'text-red-200/80'">
                {{ eligibilityMessage() }}
              </p>
            </div>

            <div class="rounded-xl p-4 sm:p-5 border min-h-36 shadow-lg" [class]="freshEnough() ? 'bg-gradient-to-b from-indigo-950/35 to-indigo-900/15 border-indigo-500/30 shadow-indigo-950/10' : 'bg-gradient-to-b from-amber-950/35 to-amber-900/15 border-amber-500/30 shadow-amber-950/10'">
              <div class="text-xs uppercase tracking-wider mb-2" [class]="freshEnough() ? 'text-indigo-300' : 'text-amber-300'">Freshness</div>
              <div class="text-lg font-semibold" [class]="freshEnough() ? 'text-indigo-300' : 'text-amber-400'">
                {{ freshEnough() ? 'Reputation window valid' : 'Reputation is stale' }}
              </div>
              <p class="text-sm mt-2" [class]="freshEnough() ? 'text-indigo-200/80' : 'text-amber-200/80'">
                {{ freshnessMessage() }}
              </p>
            </div>
          </div>

          <div class="bg-gradient-to-br from-slate-800/45 to-slate-900/55 rounded-2xl p-5 sm:p-6 border border-slate-700 space-y-4 shadow-xl shadow-black/15">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <h4 class="text-white font-semibold">Quoted payout</h4>
              <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider" [class]="claimPath() === 'zk' ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30' : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'">
                {{ claimPath() === 'zk' ? 'ZK path' : 'ECDSA path' }}
              </span>
            </div>
            <div class="space-y-3">
              <div class="flex flex-wrap items-end gap-x-3 gap-y-1">
                <div class="text-4xl sm:text-5xl font-bold text-white font-mono leading-none tracking-tight">{{ payoutTokens().toFixed(2) }}</div>
                <div class="text-xs uppercase tracking-[0.22em] text-slate-500 pb-1">Tokens</div>
              </div>
              <p class="text-slate-400 text-sm leading-relaxed max-w-2xl">
                {{ claimPathDescription() }}
              </p>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-950/80 to-slate-900/85 p-5 sm:p-6 space-y-5 shadow-xl shadow-black/15">
            <div>
              <h4 class="text-white font-semibold">How the score is assembled</h4>
              <p class="text-sm text-slate-400 mt-1">
                In a real system, these values would come from attestations, claim history, dispute data, fraud heuristics, and timestamps. This demo compresses that into a few believable source counts.
              </p>
            </div>

            <div class="grid sm:grid-cols-2 gap-4 text-sm">
              <div class="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg shadow-black/10">
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">Source inputs</div>
                <div class="space-y-2 text-slate-300">
                  <div class="flex justify-between gap-3"><span>Positive attestations</span><span class="font-mono text-emerald-300">{{ positiveAttestations() }}</span></div>
                  <div class="flex justify-between gap-3"><span>Successful prior actions</span><span class="font-mono text-emerald-300">{{ successfulActions() }}</span></div>
                  <div class="flex justify-between gap-3"><span>Negative reports</span><span class="font-mono text-red-300">{{ negativeReports() }}</span></div>
                  <div class="flex justify-between gap-3"><span>Fraud / sybil flags</span><span class="font-mono text-red-300">{{ fraudFlags() }}</span></div>
                </div>
              </div>

              <div class="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg shadow-black/10">
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">Aggregation rule</div>
                <div class="space-y-3 font-mono text-sm">
                  <div class="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                    <div class="text-slate-500 mb-1">r (supporting evidence)</div>
                    <div class="text-emerald-400">{{ positiveAttestations() }} + {{ successfulActions() }} = {{ r() }}</div>
                  </div>
                  <div class="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                    <div class="text-slate-500 mb-1">s (negative evidence)</div>
                    <div class="text-red-400">{{ negativeReports() }} + 2 × {{ fraudFlags() }} = {{ s() }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid sm:grid-cols-3 gap-3">
              <div class="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg shadow-black/10">
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Opinion</div>
                <div class="text-lg font-mono text-white">({{ opinion().b.toFixed(2) }}, {{ opinion().d.toFixed(2) }}, {{ opinion().u.toFixed(2) }})</div>
                <div class="text-xs text-slate-500 mt-2">Belief, disbelief, uncertainty</div>
              </div>
              <div class="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg shadow-black/10">
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Expectation</div>
                <div class="text-2xl font-mono text-white">{{ expectation().toFixed(3) }}</div>
                <div class="text-xs text-slate-500 mt-2">Scalar trust estimate</div>
              </div>
              <div class="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg shadow-black/10">
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Scaled airdrop score</div>
                <div class="text-2xl font-mono text-white">{{ scaledScore() | number:'1.0-0' }}</div>
                <div class="text-xs text-slate-500 mt-2">Mapped into campaign thresholds</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-gradient-to-b from-slate-800/35 to-slate-900/50 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/15">
          <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
            <div>
              <h3 class="text-xl font-semibold text-white">3. End-to-end flow</h3>
              <p class="text-sm text-slate-400 mt-1 max-w-2xl">
                The airdrop pipeline is easier to read as a sequence: reputation input, trust computation, proof or signature preparation, eligibility checks, then payout.
              </p>
            </div>
          </div>

          <div class="space-y-4">
            @for (step of steps; track step.title) {
              <div class="rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900/65 to-slate-950/80 p-4 sm:p-5 shadow-lg shadow-black/10">
                <div class="grid grid-cols-[auto_1fr] gap-4 sm:gap-5 items-start">
                  <div class="flex flex-col items-center pt-0.5">
                    <div class="w-11 h-11 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-950/30">
                      {{ step.step.replace('Step ', '') }}
                    </div>
                    @if (step.step !== 'Step 5') {
                      <div class="w-px h-14 sm:h-16 bg-gradient-to-b from-indigo-500/30 to-transparent mt-3"></div>
                    }
                  </div>

                  <div class="min-w-0 pt-0.5">
                    <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">{{ step.step }}</div>
                    <div class="text-lg sm:text-xl text-slate-100 font-semibold mb-2 text-pretty">{{ step.title }}</div>
                    <p class="text-slate-400 leading-7 max-w-2xl">{{ step.body }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="bg-gradient-to-b from-slate-800/35 to-slate-900/50 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/15">
          <h3 class="text-xl font-semibold text-white mb-4">Reference parameters</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
            <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 shadow-lg shadow-black/10"><span class="block text-slate-500 text-xs mb-1">Score scale</span>0 to 1,000,000</div>
            <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 shadow-lg shadow-black/10"><span class="block text-slate-500 text-xs mb-1">Floor score</span>600,000</div>
            <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 shadow-lg shadow-black/10"><span class="block text-slate-500 text-xs mb-1">Cap score</span>1,000,000</div>
            <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 shadow-lg shadow-black/10"><span class="block text-slate-500 text-xs mb-1">Min payout</span>100 tokens</div>
            <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 shadow-lg shadow-black/10"><span class="block text-slate-500 text-xs mb-1">Max payout</span>1000 tokens</div>
            <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 shadow-lg shadow-black/10"><span class="block text-slate-500 text-xs mb-1">Default curve</span>SQRT</div>
            <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 lg:col-span-2 shadow-lg shadow-black/10"><span class="block text-slate-500 text-xs mb-1">ZK freshness window</span>7 days</div>
          </div>

          <div class="mt-6 p-4 rounded-xl bg-slate-900/70 border border-slate-700 text-sm text-slate-400">
            The explorer example stays focused on the trust and eligibility logic. The full reference project adds the SvelteKit frontend,
            proof worker pipeline, on-chain verifier, and claim contracts.
          </div>
        </div>
      </section>
    </div>
  `
})
export class AirdropExampleComponent {
  private readonly ebsl = inject(EbslService);

  readonly floorScore = 600_000;
  readonly capScore = 1_000_000;
  readonly minPayout = 100;
  readonly maxPayout = 1000;
  readonly maxReputationAgeDays = 7;
  readonly floorPercent = (this.floorScore / 1_000_000) * 100;
  readonly capPercent = (this.capScore / 1_000_000) * 100;
  readonly activeButtonClass = 'rounded-lg border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 px-3 py-2 text-sm font-medium transition-colors';
  readonly inactiveButtonClass = 'rounded-lg border border-slate-700 bg-slate-900 text-slate-400 px-3 py-2 text-sm font-medium hover:text-white hover:bg-slate-800 transition-colors';

  readonly positiveAttestations = signal(4);
  readonly successfulActions = signal(4);
  readonly negativeReports = signal(1);
  readonly fraudFlags = signal(0);
  readonly claimPath = signal<ClaimPath>('zk');
  readonly curve = signal<PayoutCurve>('SQRT');
  readonly reputationAgeDays = signal(3);

  readonly r = computed(() => this.positiveAttestations() + this.successfulActions());
  readonly s = computed(() => this.negativeReports() + (2 * this.fraudFlags()));

  readonly opinion = computed(() => this.ebsl.calculateOpinion(this.r(), this.s(), 0.5));
  readonly expectation = computed(() => this.ebsl.expectedProbability(this.opinion()));
  readonly scaledScore = computed(() => Math.round(this.expectation() * 1_000_000));
  readonly scorePercent = computed(() => Math.max(0, Math.min(100, this.scaledScore() / 10_000)));
  readonly eligible = computed(() => this.scaledScore() >= this.floorScore);
  readonly freshEnough = computed(() => this.reputationAgeDays() <= this.maxReputationAgeDays);
  readonly payoutTokens = computed(() => {
    if (!this.eligible()) {
      return 0;
    }

    const score = this.scaledScore();
    const normalized = Math.max(0, Math.min(1, (score - this.floorScore) / (this.capScore - this.floorScore)));

    let curveValue = normalized;
    switch (this.curve()) {
      case 'SQRT':
        curveValue = Math.sqrt(normalized);
        break;
      case 'QUADRATIC':
        curveValue = normalized * normalized;
        break;
      default:
        curveValue = normalized;
    }

    return this.minPayout + (this.maxPayout - this.minPayout) * curveValue;
  });
  readonly claimPathDescription = computed(() => this.claimPath() === 'zk'
    ? 'The claimant first proves reputation to the verifier contract, then claims through the ZK airdrop path if the score is fresh enough.'
    : 'The claimant submits a signed artifact authorizing a payout derived from the same reputation score and payout curve.'
  );
  readonly eligibilityMessage = computed(() => this.eligible()
    ? `Score ${this.scaledScore().toLocaleString()} clears the campaign floor of ${this.floorScore.toLocaleString()}.`
    : `Score ${this.scaledScore().toLocaleString()} is below the campaign floor of ${this.floorScore.toLocaleString()}.`
  );
  readonly freshnessMessage = computed(() => this.claimPath() === 'zk'
    ? (this.freshEnough()
        ? `Age ${this.reputationAgeDays()}d is within the ${this.maxReputationAgeDays}-day freshness window.`
        : `Age ${this.reputationAgeDays()}d exceeds the ${this.maxReputationAgeDays}-day freshness window used by the ZK claim path.`)
    : 'The ECDSA path does not require the same freshness check in this simplified example.'
  );

  readonly steps = [
    {
      step: 'Step 1',
      title: 'Load attestations',
      body: 'Trust evidence is gathered from the network and organized into the claimant’s local reputation inputs.'
    },
    {
      step: 'Step 2',
      title: 'Compute EBSL opinion',
      body: 'Evidence is fused into an opinion tuple and converted into an expectation score for gating decisions.'
    },
    {
      step: 'Step 3',
      title: 'Prepare proof or signature',
      body: 'The ECDSA path signs an authorization artifact; the ZK path prepares a privacy-preserving proof of the reputation result.'
    },
    {
      step: 'Step 4',
      title: 'Verify eligibility',
      body: 'The campaign checks threshold, payout curve, and, for the ZK path, whether the verified reputation is still fresh.'
    },
    {
      step: 'Step 5',
      title: 'Claim payout',
      body: 'Eligible users receive a payout between the configured minimum and maximum based on the scaled reputation score.'
    }
  ];

  toNumber(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }

  toCurve(event: Event): PayoutCurve {
    return (event.target as HTMLSelectElement).value as PayoutCurve;
  }
}


import { Component, signal, computed, ChangeDetectionStrategy, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleGenAI, Type } from "@google/genai";
import { EbslService } from '../services/ebsl.service';
import { CathexisService } from '../services/cathexis.service';

interface Node {
  id: string;
  label: string;
  role: 'Validator' | 'Trader' | 'Observer' | 'Sybil';
  reliability: number; // 0.0 to 1.0 (Probability of generating positive evidence)
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Visual Impact State
  impactVal: number; // 0.0 to 1.0 (Animation progress)
  impactType: 'success' | 'failure';
  // AI Identity
  customHandle?: string;
  customGloss?: string;
}

interface Edge {
  source: string;
  target: string;
  r: number;
  s: number;
  lastActive: number;
}

interface ActivePulse {
  id: number;
  sourceId: string;
  targetId: string;
  type: 'success' | 'failure';
  startTime: number;
  // Render props updated per frame
  x: number;
  y: number;
  rotation: number;
}

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: 'success' | 'failure' | 'neutral';
}

@Component({
  selector: 'app-eqbsl-graph',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto py-6 px-4">
      <!-- Header / Controls -->
      <div class="flex flex-col xl:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h2 class="text-3xl font-bold text-white">Network Trust Flow</h2>
            @if (isRunning()) {
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse uppercase tracking-wider">
                Live
              </span>
            } @else {
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                Paused
              </span>
            }
          </div>
          <p class="text-slate-400 text-sm max-w-xl">
            Simulating autonomous, multi-party interactions. Watch how nodes evolve from <span class="text-indigo-400">Unknown</span> to <span class="text-emerald-400">Trusted</span> (or <span class="text-red-400">Malicious</span>) based on evidence.
          </p>
        </div>
        
        <div class="flex flex-wrap items-center gap-4 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
           <div class="flex flex-col px-2">
             <span class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Avg Uncertainty</span>
             <span class="text-xl font-mono font-bold text-indigo-400">{{ avgUncertainty().toFixed(3) }}</span>
           </div>
           
           <div class="w-px h-8 bg-slate-700"></div>
           
           <div class="flex flex-col px-2">
             <span class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Tx Count</span>
             <span class="text-xl font-mono font-bold text-white">{{ transactionCount() }}</span>
           </div>

           <div class="w-px h-8 bg-slate-700"></div>

           <!-- Speed Control -->
           <div class="flex flex-col px-2 w-32">
             <div class="flex justify-between items-center mb-1">
               <span class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Speed</span>
               <span class="text-[10px] text-slate-400 font-mono">{{ speedLabel() }}</span>
             </div>
             <input 
               type="range" 
               min="100" 
               max="2000" 
               step="100" 
               [value]="2100 - simulationSpeed()" 
               (input)="onSpeedChange($event)" 
               class="h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 w-full"
             >
           </div>
           
           <div class="w-px h-8 bg-slate-700"></div>

           <div class="flex gap-2">
             <button
               (click)="addNode()"
               class="px-3 py-2 rounded font-bold border border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-white transition-all text-xs uppercase tracking-wider"
               title="Add New Actor"
             >
               + Actor
             </button>

             <button 
               (click)="resetGraph()"
               class="px-3 py-2 rounded font-bold border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xs uppercase tracking-wider"
               title="Reset Simulation"
             >
               Reset
             </button>

             <button 
               (click)="toggleSimulation()"
               [class]="isRunning() 
                 ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30' 
                 : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30'"
               class="px-6 py-2 rounded font-bold border transition-all min-w-[120px] flex items-center justify-center gap-2"
             >
               @if (isRunning()) {
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                 Pause
               } @else {
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                 Resume
               }
             </button>
           </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[650px]">
        
        <!-- Main Graph Viz -->
        <div class="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden shadow-inner shadow-black/50 flex flex-col group" (click)="onBgClick($event)">
          <svg 
            class="w-full h-full select-none" 
            viewBox="0 0 800 500" 
            (mousemove)="handleMouseMove($event)"
            (mouseup)="onMouseUp()"
            (mouseleave)="onMouseUp()"
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                 <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                 <feMerge>
                     <feMergeNode in="coloredBlur"/>
                     <feMergeNode in="SourceGraphic"/>
                 </feMerge>
              </filter>
              <!-- Gradients for Edges -->
              <linearGradient id="grad-trust" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#34d399" stop-opacity="0.2"/>
                <stop offset="50%" stop-color="#34d399" stop-opacity="0.8"/>
                <stop offset="100%" stop-color="#34d399" stop-opacity="0.2"/>
              </linearGradient>
            </defs>

            <!-- Connections -->
            @for (edge of edges(); track edge.source + edge.target) {
              <g 
                class="transition-opacity duration-500 group/edge cursor-pointer"
                (mouseenter)="showEdgeTooltip($event, edge)"
                (mouseleave)="hideTooltip()"
              >
                <!-- Hit Area (Invisible but wide) -->
                <line 
                  [attr.x1]="getNode(edge.source).x" [attr.y1]="getNode(edge.source).y"
                  [attr.x2]="getNode(edge.target).x" [attr.y2]="getNode(edge.target).y"
                  stroke="transparent" stroke-width="20"
                />

                <!-- Base Line -->
                <line 
                  [attr.x1]="getNode(edge.source).x" 
                  [attr.y1]="getNode(edge.source).y"
                  [attr.x2]="getNode(edge.target).x" 
                  [attr.y2]="getNode(edge.target).y"
                  [attr.stroke-width]="getEdgeWidth(edge)"
                  [attr.stroke]="getEdgeColor(edge)"
                  [attr.opacity]="getEdgeOpacity(edge)"
                  stroke-linecap="round"
                  class="transition-all duration-1000 group-hover/edge:opacity-100 group-hover/edge:stroke-white/40"
                />

                <!-- High Trust Flow Overlay (Only for trusted edges) -->
                @if (isTrustedEdge(edge)) {
                  <line 
                    [attr.x1]="getNode(edge.source).x" 
                    [attr.y1]="getNode(edge.source).y"
                    [attr.x2]="getNode(edge.target).x" 
                    [attr.y2]="getNode(edge.target).y"
                    stroke="url(#grad-trust)"
                    stroke-width="2"
                    stroke-dasharray="4 8"
                    class="flow-animation opacity-60 pointer-events-none"
                  />
                }
              </g>
            }

            <!-- Active Pulses (Packets moving) -->
            @for (pulse of pulses(); track pulse.id) {
              <g filter="url(#glow)" class="pointer-events-none will-change-transform"
                 [attr.transform]="'translate(' + pulse.x + ',' + pulse.y + ')'">
                
                <!-- Rotated Packet Group -->
                <g [attr.transform]="'rotate(' + pulse.rotation + ')'">
                   
                   @if(pulse.type === 'success') {
                      <!-- POSITIVE EVIDENCE: Streamlined Comet -->
                      <!-- Tail -->
                      <path d="M-15 0 L-2 0" stroke="#34d399" stroke-width="2" stroke-linecap="round" class="opacity-40" />
                      <!-- Head -->
                      <path d="M-4 -3 L4 0 L-4 3 Z" fill="#34d399" />
                      <circle cx="0" cy="0" r="2" fill="#d1fae5" />
                   } @else {
                      <!-- NEGATIVE EVIDENCE: Jagged Glitch -->
                      <!-- Tail -->
                      <path d="M-12 0 L-2 0" stroke="#f87171" stroke-width="2" stroke-dasharray="2 1" class="opacity-60" />
                      <!-- Head -->
                      <path d="M-4 -4 L0 -2 L2 -5 L5 0 L2 5 L0 2 L-4 4 Z" fill="#f87171" />
                      <circle cx="0" cy="0" r="1.5" fill="#fee2e2" />
                   }
                </g>
              </g>
            }

            <!-- Nodes -->
            @for (node of nodes(); track node.id) {
              <g 
                [attr.transform]="'translate(' + node.x + ',' + node.y + ')'"
                (mousedown)="onNodeDown($event, node)"
                (click)="selectNode(node.id, $event)"
                (mouseenter)="showNodeTooltip($event, node)"
                (mouseleave)="hideTooltip()"
                class="hover:opacity-90 transition-opacity"
                [class]="draggedNodeId() === node.id ? 'cursor-grabbing' : 'cursor-grab'"
              >
                
                <!-- IMPACT RIPPLE EFFECT -->
                @if (node.impactVal > 0.05) {
                   <circle 
                     cx="0" cy="0"
                     [attr.r]="25 + (1 - node.impactVal) * 50"
                     fill="none"
                     [attr.stroke]="node.impactType === 'success' ? '#34d399' : '#f87171'"
                     [attr.stroke-width]="node.impactVal * 4"
                     [attr.opacity]="node.impactVal"
                     class="pointer-events-none"
                   />
                   <!-- Impact flash fill -->
                   <circle 
                     cx="0" cy="0" r="25"
                     [attr.fill]="node.impactType === 'success' ? '#34d399' : '#f87171'"
                     [attr.opacity]="node.impactVal * 0.3"
                     class="pointer-events-none"
                   />
                }

                <!-- Selection Ring -->
                <circle 
                  [attr.r]="selectedNodeId() === node.id ? 45 : 0" 
                  fill="none" 
                  stroke="white"
                  stroke-width="1.5"
                  stroke-dasharray="4 4"
                  class="opacity-50 animate-spin-slow origin-center transition-all duration-300"
                />

                <!-- Trust Halo (Reputation Size) -->
                <circle 
                  [attr.r]="25 + getNodeReputation(node.id) * 15" 
                  fill="none" 
                  [attr.stroke]="getNodeCathexisColor(node.id)"
                  class="transition-all duration-700 opacity-30"
                  stroke-width="2"
                />
                
                <!-- Core Node -->
                <circle 
                  r="20" 
                  [attr.fill]="getNodeFill(node)" 
                  stroke="#1e293b" 
                  stroke-width="4"
                  class="shadow-xl relative z-10 transition-colors duration-300"
                  filter="url(#glow)"
                />
                
                <!-- ID -->
                <text 
                  text-anchor="middle" 
                  dy="5" 
                  fill="white" 
                  class="font-mono text-[10px] font-bold pointer-events-none select-none uppercase tracking-tighter"
                >
                  {{ node.id }}
                </text>

                <!-- Dynamic Cathexis Label -->
                <g transform="translate(0, 45)">
                   <rect x="-60" y="-10" width="120" height="20" rx="10" fill="#0f172a" class="opacity-80" />
                   <text 
                     text-anchor="middle" 
                     dy="4" 
                     [attr.fill]="getNodeCathexisColor(node.id)"
                     class="font-sans text-[10px] font-bold pointer-events-none select-none tracking-wide"
                   >
                     {{ getEffectiveLabel(node).handle }}
                   </text>
                </g>
              </g>
            }
          </svg>
          
          <!-- Graph Legends -->
          <div class="absolute bottom-4 left-4 flex gap-4 pointer-events-none">
             <div class="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
               <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
               Trusted Evidence (+r)
             </div>
             <div class="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
               <span class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
               Defect Evidence (+s)
             </div>
             <div class="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
               <span class="border-b-2 border-dashed border-emerald-500 w-4"></span>
               Verified Trust Channel
             </div>
          </div>

          <!-- Tooltip (Fixed Positioning) -->
          @if (tooltip().visible) {
            <div 
              class="fixed z-50 bg-slate-800/95 backdrop-blur border border-slate-700 shadow-2xl rounded-lg p-3 pointer-events-none transition-opacity duration-150 flex flex-col gap-1 min-w-[160px]"
              [style.left.px]="tooltip().x + 16"
              [style.top.px]="tooltip().y + 16"
            >
              <div class="font-bold text-white text-xs border-b border-slate-700 pb-1 mb-1 tracking-wide">{{ tooltip().title }}</div>
              @for (item of tooltip().items; track item.label) {
                <div class="flex justify-between items-center text-[10px] gap-4">
                  <span class="text-slate-400 font-medium">{{ item.label }}</span>
                  <span class="font-mono font-bold" [class]="item.color || 'text-slate-200'">{{ item.value }}</span>
                </div>
              }
            </div>
          }

        </div>

        <!-- Right Panel: Inspector or Log -->
        <div class="bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col h-full overflow-hidden transition-all duration-300">
          
          <!-- View 1: Node Inspector (When Selected) -->
          @if (selectedNodeId(); as id) {
             <div class="flex flex-col h-full animate-in slide-in-from-right duration-300">
                <div class="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                  <h3 class="font-bold text-white text-sm uppercase tracking-wider">Node Inspector</h3>
                  <button (click)="clearSelection()" class="text-slate-400 hover:text-white text-xs">Close</button>
                </div>

                <div class="p-6 flex-1 space-y-6 overflow-y-auto">
                   <div class="flex items-center gap-4">
                      <div class="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg transition-colors duration-500" [style.background-color]="getNodeFill(getNode(id))">
                        {{ id }}
                      </div>
                      <div>
                        <h4 class="text-lg font-bold text-white">{{ getNode(id).label }}</h4>
                        <div class="text-xs text-slate-400 font-mono">{{ getNode(id).role }}</div>
                      </div>
                   </div>

                   <!-- Role Selector -->
                   <div class="space-y-2">
                     <label class="text-[10px] font-bold text-slate-500 uppercase">Public Identity (Role)</label>
                     <div class="grid grid-cols-2 gap-2">
                       @for (role of roles; track role) {
                         <button 
                           (click)="updateNodeRole(id, role)"
                           [class]="getNode(id).role === role 
                             ? 'bg-slate-200 text-slate-900 font-bold' 
                             : 'bg-slate-800 text-slate-400 hover:bg-slate-700'"
                           class="px-2 py-2 rounded text-xs transition-colors border border-slate-600"
                         >
                           {{ role }}
                         </button>
                       }
                     </div>
                     <p class="text-[10px] text-slate-500 italic mt-1">
                       Sets default integrity.
                     </p>
                   </div>

                   <!-- Integrity / Behavior Selector -->
                   <div class="space-y-2 pt-4 border-t border-slate-700">
                      <label class="text-[10px] font-bold text-slate-500 uppercase">True Integrity (Hidden)</label>
                      <div class="flex gap-2">
                         <button (click)="setReliability(id, 0.98)" class="flex-1 py-1.5 bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded hover:bg-emerald-900/50">Honest</button>
                         <button (click)="setReliability(id, 0.5)" class="flex-1 py-1.5 bg-amber-900/30 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded hover:bg-amber-900/50">Mixed</button>
                         <button (click)="setReliability(id, 0.05)" class="flex-1 py-1.5 bg-red-900/30 border border-red-500/30 text-red-400 text-[10px] font-bold rounded hover:bg-red-900/50">Malicious</button>
                      </div>
                      <div class="flex items-center gap-2 mt-2">
                        <input type="range" min="0" max="1" step="0.01" [value]="getNode(id).reliability" (input)="updateReliabilitySlider(id, $event)" class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        <div class="text-[10px] text-slate-400 font-mono w-10 text-right">{{ (getNode(id).reliability * 100).toFixed(0) }}%</div>
                      </div>
                      <p class="text-[10px] text-slate-500 italic mt-1">
                        Determines the probability of generating positive evidence in transactions.
                      </p>
                   </div>

                   <div class="p-4 bg-slate-900 rounded-lg border border-slate-700 mt-4 relative group">
                      <div class="flex justify-between items-start mb-2">
                        <div class="text-[10px] uppercase text-slate-500 font-bold">Current Cathexis Handle</div>
                        <button 
                          (click)="generateAIHandle(id)"
                          [disabled]="isGeneratingIdentity()"
                          class="text-[10px] px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 border border-indigo-500/30 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
                          title="Generate unique AI identity based on reputation"
                        >
                          @if (isGeneratingIdentity()) {
                             <span class="animate-spin h-2 w-2 border-2 border-current border-t-transparent rounded-full"></span>
                          } @else {
                             <span class="text-xs">✨</span>
                          }
                          AI Gen
                        </button>
                      </div>
                      
                      @let label = getEffectiveLabel(getNode(id));
                      
                      <div [class]="'text-lg font-bold ' + label.style.split(' ')[0]">
                         {{ label.handle }}
                      </div>
                      <p class="text-xs text-slate-400 italic mt-1">"{{ label.gloss }}"</p>
                   </div>

                   <div class="space-y-3 mt-4">
                      <h5 class="text-xs font-bold text-slate-500 uppercase">Incoming Evidence Tensor</h5>
                      
                      @let stats = getNodeStats(id);
                      
                      <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="bg-emerald-900/20 p-2 rounded border border-emerald-500/20">
                          <div class="text-xs text-emerald-400 mb-1">Pos (r)</div>
                          <div class="font-mono font-bold text-white">{{ stats.r.toFixed(1) }}</div>
                        </div>
                        <div class="bg-red-900/20 p-2 rounded border border-red-500/20">
                          <div class="text-xs text-red-400 mb-1">Neg (s)</div>
                          <div class="font-mono font-bold text-white">{{ stats.s.toFixed(1) }}</div>
                        </div>
                        <div class="bg-indigo-900/20 p-2 rounded border border-indigo-500/20">
                          <div class="text-xs text-indigo-400 mb-1">Unc (u)</div>
                          <div class="font-mono font-bold text-white">{{ stats.u.toFixed(2) }}</div>
                        </div>
                      </div>
                   </div>
                   
                   <div class="mt-4 pt-4 border-t border-slate-700">
                      <h5 class="text-xs font-bold text-slate-500 uppercase mb-2">Subjective Logic Projection</h5>
                      <div class="h-2 w-full bg-slate-700 rounded-full overflow-hidden flex">
                         <div class="h-full bg-emerald-500" [style.width.%]="stats.b * 100"></div>
                         <div class="h-full bg-indigo-500" [style.width.%]="stats.u * 100"></div>
                         <div class="h-full bg-red-500" [style.width.%]="stats.d * 100"></div>
                      </div>
                      <div class="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                         <span>Belief: {{(stats.b*100).toFixed(0)}}%</span>
                         <span>Disbelief: {{(stats.d*100).toFixed(0)}}%</span>
                      </div>
                   </div>

                   <!-- Edge Inspector -->
                   @let nodeEdges = getNodeEdges(id);
                   <div class="pt-4 border-t border-slate-700">
                      <h5 class="text-xs font-bold text-slate-500 uppercase mb-3">Connection Details</h5>
                      
                      @if (nodeEdges.incoming.length === 0 && nodeEdges.outgoing.length === 0) {
                        <div class="text-xs text-slate-500 italic">No active connections.</div>
                      }

                      @if (nodeEdges.incoming.length > 0) {
                        <div class="mb-3">
                          <div class="text-[10px] text-slate-400 font-bold mb-1">INCOMING (Trust In)</div>
                          <div class="space-y-1">
                            @for (edge of nodeEdges.incoming; track edge.source) {
                               <div class="flex justify-between items-center bg-slate-900/40 px-2 py-1.5 rounded border border-slate-700/30">
                                  <div class="flex items-center gap-1.5">
                                    <div class="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                    <span class="text-xs font-mono text-slate-300">{{ edge.source }}</span>
                                  </div>
                                  <div class="flex gap-2 text-[10px] font-mono font-bold">
                                     <span class="text-emerald-500">r:{{edge.r.toFixed(1)}}</span>
                                     <span class="text-red-500">s:{{edge.s.toFixed(1)}}</span>
                                  </div>
                               </div>
                            }
                          </div>
                        </div>
                      }

                      @if (nodeEdges.outgoing.length > 0) {
                        <div class="mb-3">
                          <div class="text-[10px] text-slate-400 font-bold mb-1">OUTGOING (Trust Out)</div>
                          <div class="space-y-1">
                            @for (edge of nodeEdges.outgoing; track edge.target) {
                               <div class="flex justify-between items-center bg-slate-900/40 px-2 py-1.5 rounded border border-slate-700/30">
                                  <div class="flex items-center gap-1.5">
                                    <div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                    <span class="text-xs font-mono text-slate-300">{{ edge.target }}</span>
                                  </div>
                                  <div class="flex gap-2 text-[10px] font-mono font-bold">
                                     <span class="text-emerald-500">r:{{edge.r.toFixed(1)}}</span>
                                     <span class="text-red-500">s:{{edge.s.toFixed(1)}}</span>
                                  </div>
                               </div>
                            }
                          </div>
                        </div>
                      }
                   </div>

                   <!-- Delete Node (New) -->
                   <div class="pt-6 mt-6 border-t border-red-900/30">
                      <button 
                        (click)="removeNode(id)"
                        class="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        Remove Actor
                      </button>
                   </div>

                </div>
             </div>
          } 
          
          <!-- View 2: Live Ledger (Default) -->
          @else {
             <div class="flex flex-col h-full animate-in slide-in-from-left duration-300">
                <div class="p-4 border-b border-slate-700 bg-slate-800/80">
                  <h3 class="font-bold text-white text-sm uppercase tracking-wider">Live Activity Ledger</h3>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs relative scroll-smooth" #logContainer>
                  @if (logs().length === 0) {
                    <div class="text-slate-500 text-center mt-10 italic">
                      Waiting for network activity...
                    </div>
                  }

                  @for (log of logs(); track log.id) {
                    <div class="animate-in slide-in-from-right-2 duration-300">
                      <div class="text-slate-500 text-[10px] mb-0.5">{{ log.time }}</div>
                      <div [ngClass]="{
                        'text-emerald-400': log.type === 'success',
                        'text-red-400': log.type === 'failure',
                        'text-slate-300': log.type === 'neutral'
                      }">
                        <span class="opacity-70">> </span> {{ log.message }}
                      </div>
                    </div>
                  }
                </div>
                
                <div class="p-3 bg-slate-900/50 border-t border-slate-700 text-[10px] text-slate-500 text-center">
                   Select a node to view detailed trust tensors.
                </div>
             </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin-slow {
      animation: spin 8s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .flow-animation {
      animation: flow 1s linear infinite;
    }
    @keyframes flow {
      to { stroke-dashoffset: -12; }
    }
    .will-change-transform {
      will-change: transform;
    }
  `]
})
export class EqbslGraphComponent implements OnInit, OnDestroy {
  ebsl = inject(EbslService);
  cathexis = inject(CathexisService);
  
  // UI State
  selectedNodeId = signal<string | null>(null);
  draggedNodeId = signal<string | null>(null);
  roles = ['Validator', 'Trader', 'Observer', 'Sybil'] as const;
  isGeneratingIdentity = signal(false);

  // Tooltip State
  tooltip = signal<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    items: { label: string; value: string; color?: string }[];
  }>({ visible: false, x: 0, y: 0, title: '', items: [] });

  // Simulation State
  isRunning = signal(false);
  intervalId: any = null;
  decayIntervalId: any = null;
  transactionCount = signal(0);
  simulationSpeed = signal(1200);
  
  // Physics Loop
  physicsId: any = null;
  
  // Data State
  pulses = signal<ActivePulse[]>([]);
  logs = signal<LogEntry[]>([]);
  
  // Graph Topology
  initialNodes: Node[] = [
    { id: 'N1', label: 'Alpha', role: 'Validator', reliability: 0.98, x: 400, y: 100, vx: 0, vy: 0, impactVal: 0, impactType: 'success' },
    { id: 'N2', label: 'Beta', role: 'Trader', reliability: 0.9, x: 200, y: 250, vx: 0, vy: 0, impactVal: 0, impactType: 'success' },
    { id: 'N3', label: 'Gamma', role: 'Trader', reliability: 0.85, x: 600, y: 250, vx: 0, vy: 0, impactVal: 0, impactType: 'success' },
    { id: 'N4', label: 'Delta', role: 'Observer', reliability: 0.95, x: 400, y: 400, vx: 0, vy: 0, impactVal: 0, impactType: 'success' },
    { id: 'N5', label: 'Epsilon', role: 'Sybil', reliability: 0.2, x: 150, y: 400, vx: 0, vy: 0, impactVal: 0, impactType: 'success' },
    { id: 'N6', label: 'Zeta', role: 'Sybil', reliability: 0.3, x: 650, y: 400, vx: 0, vy: 0, impactVal: 0, impactType: 'success' },
    { id: 'N7', label: 'Eta', role: 'Trader', reliability: 0.7, x: 400, y: 250, vx: 0, vy: 0, impactVal: 0, impactType: 'success' },
  ];

  nodes = signal<Node[]>(JSON.parse(JSON.stringify(this.initialNodes)));
  nodeMap = computed(() => new Map(this.nodes().map(n => [n.id, n])));

  // START WITH ZERO EDGES
  initialEdges: Edge[] = [];

  edges = signal<Edge[]>([]);

  avgUncertainty = computed(() => {
    const allEdges = this.edges();
    if (allEdges.length === 0) return 1.0;
    let totalU = 0;
    allEdges.forEach(e => totalU += this.ebsl.calculateOpinion(e.r, e.s).u);
    return totalU / allEdges.length;
  });

  speedLabel = computed(() => {
    const ms = this.simulationSpeed();
    if (ms <= 500) return 'FAST';
    if (ms <= 1200) return 'NORMAL';
    return 'SLOW';
  });

  ngOnInit() {
    this.startPhysics();
    this.startDecayLoop();
  }

  ngOnDestroy() {
    this.stopSimulation();
    if (this.physicsId) cancelAnimationFrame(this.physicsId);
    if (this.decayIntervalId) clearInterval(this.decayIntervalId);
  }

  // --- Physics Engine ---

  startPhysics() {
    const loop = () => {
      this.updatePhysics();
      this.physicsId = requestAnimationFrame(loop);
    };
    loop();
  }

  updatePhysics() {
    const nodes = this.nodes(); // Current state
    const edges = this.edges();
    const width = 800;
    const height = 500;
    const now = Date.now();
    
    // Constants
    const repulsion = 5000;
    const damping = 0.85;
    const centerPull = 0.005;
    const minStandoffDistance = 180; 

    // Forces accumulator
    const forces = new Map<string, {fx: number, fy: number}>();
    nodes.forEach(n => forces.set(n.id, {fx: 0, fy: 0}));

    // 1. Repulsion (All vs All) with ELASTIC Standoff
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        let dx = n1.x - n2.x;
        let dy = n1.y - n2.y;
        let distSq = dx * dx + dy * dy;
        
        if (distSq < 0.1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; distSq = 1; }
        
        const dist = Math.sqrt(distSq);
        
        // General repulsion
        const f = repulsion / distSq;
        let fx = (dx / dist) * f;
        let fy = (dy / dist) * f;
        
        // MINIMUM STANDOFF
        if (dist < minStandoffDistance) {
            const overlap = minStandoffDistance - dist;
            const kStandoff = 0.1; 
            const pushX = (dx / dist) * overlap * kStandoff;
            const pushY = (dy / dist) * overlap * kStandoff;
            
            fx += pushX;
            fy += pushY;
        }

        const f1 = forces.get(n1.id)!;
        const f2 = forces.get(n2.id)!;

        f1.fx += fx;
        f1.fy += fy;
        f2.fx -= fx;
        f2.fy -= fy;
      }
    }

    // 2. Attraction (Edges)
    const nodeMap = this.nodeMap();
    edges.forEach(e => {
       const source = nodeMap.get(e.source);
       const target = nodeMap.get(e.target);
       if (!source || !target) return;

       let dx = target.x - source.x;
       let dy = target.y - source.y;
       const dist = Math.sqrt(dx*dx + dy*dy);
       if (dist === 0) return;

       const op = this.ebsl.calculateOpinion(e.r, e.s);
       
       let restLength = 180; 
       let k = 0.04; 

       if (op.b > op.d && op.b > 0.5) {
          // Trust pulls closer
          restLength = 150 - (op.b * 70); 
          k = 0.04 + (op.b * 0.04); 
       } else if (op.d > op.b && op.d > 0.5) {
          // Distrust pushes away
          restLength = 200 + (op.d * 150);
          k = 0.04 + (op.d * 0.02); 
       }

       const force = (dist - restLength) * k;
       const fx = (dx / dist) * force;
       const fy = (dy / dist) * force;

       const fs = forces.get(source.id)!;
       const ft = forces.get(target.id)!;

       fs.fx += fx;
       fs.fy += fy;
       ft.fx -= fx;
       ft.fy -= fy;
    });

    // 3. Apply Forces & Position
    // 3b. Process Impact Map first
    const impactMap = new Map<string, 'success' | 'failure'>();
    
    // 4. Update Pulses (Logic integrated to detect impact this frame)
    const activePulses = this.pulses().map(p => {
        const source = nodeMap.get(p.sourceId);
        const target = nodeMap.get(p.targetId);
        
        if (!source || !target) return null;
 
        const duration = 1000;
        const elapsed = now - p.startTime;
        const progress = elapsed / duration;
 
        // PACKET ARRIVAL
        if (progress >= 1) {
           const targetForce = forces.get(target.id);
           if (targetForce) {
               const dx = target.x - source.x;
               const dy = target.y - source.y;
               const angle = Math.atan2(dy, dx);
               targetForce.fx += Math.cos(angle) * 8.0; 
               targetForce.fy += Math.sin(angle) * 8.0;
               impactMap.set(target.id, p.type);
           }
           return null; 
        }
 
        // Interpolate position
        const x = source.x + (target.x - source.x) * progress;
        const y = source.y + (target.y - source.y) * progress;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
 
        return { ...p, x, y, rotation };
    }).filter(p => p !== null) as ActivePulse[];
    
    if (activePulses.length !== this.pulses().length || activePulses.length > 0) {
        this.pulses.set(activePulses);
    }

    const updatedNodes = nodes.map(n => {
       const f = forces.get(n.id)!;
       
       // Center gravity
       f.fx += (width/2 - n.x) * centerPull;
       f.fy += (height/2 - n.y) * centerPull;

       let vx = (n.vx + f.fx) * damping;
       let vy = (n.vy + f.fy) * damping;

       // Move (unless dragged)
       let x = n.x;
       let y = n.y;
       if (this.draggedNodeId() !== n.id) {
         x += vx;
         y += vy;
       }

       // Bounds
       const pad = 30;
       x = Math.max(pad, Math.min(width - pad, x));
       y = Math.max(pad, Math.min(height - pad, n.y));

       // Visual impact state
       let impactVal = n.impactVal;
       let impactType = n.impactType;
       
       if (impactMap.has(n.id)) {
           impactVal = 1.0;
           impactType = impactMap.get(n.id)!;
       } else if (impactVal > 0) {
           impactVal = Math.max(0, impactVal - 0.05);
       }

       return { ...n, x, y, vx, vy, impactVal, impactType };
    });

    this.nodes.set(updatedNodes);
  }

  // --- Interaction & Simulation ---

  onNodeDown(e: MouseEvent, node: Node) {
    e.stopPropagation();
    this.draggedNodeId.set(node.id);
  }

  onMouseUp() {
    this.draggedNodeId.set(null);
  }

  handleMouseMove(e: MouseEvent) {
    const id = this.draggedNodeId();
    if (!id) return;
    
    const node = this.nodes().find(n => n.id === id);
    if (node) {
      // Direct mutation for speed during drag (reactivity handles rest)
       node.x += e.movementX;
       node.y += e.movementY;
    }
  }

  onBgClick(e: Event) {
    if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg') {
      this.clearSelection();
    }
  }

  selectNode(id: string, e: Event) {
    e.stopPropagation();
    this.selectedNodeId.set(id);
  }

  clearSelection() {
    this.selectedNodeId.set(null);
  }

  toggleSimulation() {
    if (this.isRunning()) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  startSimulation() {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    
    // Auto-stepping simulation loop
    const runStep = () => {
      this.simulateNetworkStep();
      this.intervalId = setTimeout(runStep, this.simulationSpeed());
    };
    runStep();
    this.addLog('neutral', 'Simulation started. Nodes looking for peers...');
  }

  stopSimulation() {
    this.isRunning.set(false);
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.addLog('neutral', 'Simulation paused.');
  }

  startDecayLoop() {
    // Run decay logic independent of simulation speed (background physics)
    this.decayIntervalId = setInterval(() => this.decayEdges(), 500);
  }

  decayEdges() {
    const now = Date.now();
    this.edges.update(current => {
      return current.map(e => {
         const age = now - e.lastActive;
         let { r, s } = e;
         
         // 1. Standard Decay: Lose small evidence if inactive for > 2s
         if (age > 2000) {
           r *= 0.99;
           s *= 0.99;
         }
         
         // 2. Random Link Failure / Packet Loss (0.1% chance per tick)
         if (Math.random() < 0.001) {
            r *= 0.2; // Massive trust loss/reset
            s *= 0.2;
         }
         
         return { ...e, r, s };
      }).filter(e => (e.r + e.s) > 0.3); // Cull dead/ghost edges
    });
  }

  onSpeedChange(e: Event) {
    const val = Number((e.target as HTMLInputElement).value);
    this.simulationSpeed.set(2100 - val);
  }

  resetGraph() {
    this.stopSimulation();
    this.nodes.set(JSON.parse(JSON.stringify(this.initialNodes)));
    this.edges.set([]); // Clear Edges
    this.pulses.set([]);
    this.logs.set([]);
    this.transactionCount.set(0);
    this.addLog('neutral', 'Topology reset. Zero trust edges.');
  }

  // --- Core Logic: Organic Network Growth ---

  simulateNetworkStep() {
    const nodes = this.nodes();
    const edges = this.edges();
    if (nodes.length < 2) return;

    // 1. Pick a random Source Node
    const source = nodes[Math.floor(Math.random() * nodes.length)];
    
    // 2. Determine Strategy based on Network Maturity
    // Early Phase (Sparse): Cluster by Role (Discovery)
    // Later Phase (Dense): Select by Reputation (EBSL)
    const density = edges.length / (nodes.length * 1.5); // Heuristic
    const mode = density < 0.6 ? 'discovery' : 'ebsl';
    
    // 3. Find Target
    const target = this.findInteractionTarget(source, nodes, edges, mode);
    
    if (target) {
        this.executeTransaction(source, target);
    }
  }

  findInteractionTarget(source: Node, allNodes: Node[], allEdges: Edge[], mode: 'discovery' | 'ebsl'): Node | null {
      const candidates = allNodes.filter(n => n.id !== source.id);
      if (candidates.length === 0) return null;

      if (mode === 'discovery') {
          // Priority: Same Role
          const peers = candidates.filter(n => n.role === source.role);
          if (peers.length > 0 && Math.random() < 0.8) {
              return peers[Math.floor(Math.random() * peers.length)];
          }
          // Fallback to random exploration
          return candidates[Math.floor(Math.random() * candidates.length)];
      } 
      else {
          // EBSL Selection: Expectation Maximization vs Exploration
          // Calculate Subjective Score for each candidate
          const scored = candidates.map(c => {
             const edge = allEdges.find(e => e.source === source.id && e.target === c.id);
             let score = 0.5; // Unknown base rate
             if (edge) {
                 const op = this.ebsl.calculateOpinion(edge.r, edge.s);
                 // Expectation E = b + a*u
                 score = op.b + (0.5 * op.u);
             }
             return { node: c, score };
          });

          // Sort by score descending
          scored.sort((a, b) => b.score - a.score);

          // 70% chance to pick top 3 (Exploit trust), 30% chance to pick random (Explore)
          if (Math.random() < 0.7) {
             const topK = scored.slice(0, 3);
             return topK[Math.floor(Math.random() * topK.length)].node;
          } else {
             return candidates[Math.floor(Math.random() * candidates.length)];
          }
      }
  }

  executeTransaction(source: Node, target: Node) {
    const isSuccess = Math.random() < target.reliability;
    const now = Date.now();
    
    // Update or Create Edge
    this.edges.update(current => {
       const existingIdx = current.findIndex(e => e.source === source.id && e.target === target.id);
       
       if (existingIdx >= 0) {
           // Update existing
           const e = current[existingIdx];
           const updated = [...current];
           updated[existingIdx] = { 
               ...e, 
               r: isSuccess ? e.r + 1 : e.r, 
               s: isSuccess ? e.s : e.s + 1,
               lastActive: now
           };
           return updated;
       } else {
           // Create new connection
           const newEdge: Edge = {
               source: source.id,
               target: target.id,
               r: isSuccess ? 1 : 0,
               s: isSuccess ? 0 : 1,
               lastActive: now
           };
           return [...current, newEdge];
       }
    });

    this.triggerPulse(source, target, isSuccess);
    
    // Log less frequently to avoid spam
    if (this.transactionCount() % 3 === 0) {
        this.addLog(
          isSuccess ? 'success' : 'failure',
          `${source.id} → ${target.id}: ${isSuccess ? 'Verified' : 'Defect'} (r/s update)`
        );
    }
    
    this.transactionCount.update(c => c + 1);
  }

  triggerPulse(source: Node, target: Node, success: boolean) {
    const pulse: ActivePulse = {
      id: Math.random(),
      sourceId: source.id,
      targetId: target.id,
      type: success ? 'success' : 'failure',
      startTime: Date.now(),
      x: source.x,
      y: source.y,
      rotation: 0
    };
    this.pulses.update(p => [...p, pulse]);
  }

  addLog(type: 'success'|'failure'|'neutral', message: string) {
     const entry: LogEntry = {
       id: Math.random(),
       time: new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'}),
       type,
       message
     };
     this.logs.update(l => [entry, ...l].slice(0, 50));
  }

  addNode() {
     const id = 'N' + (this.nodes().length + 1);
     // Cycle roles for variety
     const role = this.roles[this.nodes().length % this.roles.length];
     
     const newNode: Node = {
       id,
       label: 'New Actor',
       role,
       reliability: role === 'Sybil' ? 0.2 : 0.9,
       x: 400 + (Math.random() - 0.5) * 100,
       y: 250 + (Math.random() - 0.5) * 100,
       vx: 0, vy: 0,
       impactVal: 0,
       impactType: 'success'
     };
     
     this.nodes.update(n => [...n, newNode]);
     this.addLog('neutral', `New node ${id} (${role}) joined. Seeking peers...`);
     // No manual edge creation! Simulation will pick it up.
  }

  removeNode(id: string) {
    this.nodes.update(n => n.filter(x => x.id !== id));
    this.edges.update(e => e.filter(x => x.source !== id && x.target !== id));
    if (this.selectedNodeId() === id) this.selectedNodeId.set(null);
  }

  updateNodeRole(id: string, role: any) {
    this.nodes.update(ns => ns.map(n => {
      if (n.id === id) {
        let reliability = 0.5;
        if (role === 'Validator') reliability = 0.99;
        if (role === 'Trader') reliability = 0.85;
        if (role === 'Observer') reliability = 0.95;
        if (role === 'Sybil') reliability = 0.15;
        return { ...n, role, reliability };
      }
      return n;
    }));
  }

  // --- New Methods for Manual Integrity ---
  setReliability(id: string, value: number) {
     this.nodes.update(ns => ns.map(n => {
       if (n.id === id) return { ...n, reliability: value };
       return n;
     }));
  }

  updateReliabilitySlider(id: string, e: Event) {
    const val = Number((e.target as HTMLInputElement).value);
    this.setReliability(id, val);
  }

  // --- AI Identity Generation ---
  async generateAIHandle(id: string) {
    if (this.isGeneratingIdentity()) return;
    
    const node = this.getNode(id);
    const stats = this.getNodeStats(id);
    this.isGeneratingIdentity.set(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
      
      const prompt = `
        Analyze this network node:
        Role: ${node.role} (Intended behavior context)
        Reliability (Ground Truth): ${(node.reliability * 100).toFixed(0)}%
        Reputation Stats:
        - Positive Evidence: ${stats.r}
        - Negative Evidence: ${stats.s}
        - Uncertainty: ${stats.u.toFixed(2)}
        
        Generate a creative, short, cyberpunk/sci-fi "Handle" (name) and a "Gloss" (description) for this entity based on its reputation.
        If it's honest/high trust, give it a noble or technical name.
        If it's malicious/low trust, give it a glitchy or warning name.
        If it's unknown, give it a mysterious name.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              handle: { type: Type.STRING },
              gloss: { type: Type.STRING }
            }
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      if (result.handle) {
         this.nodes.update(nodes => nodes.map(n => {
           if (n.id === id) {
             return { ...n, customHandle: result.handle, customGloss: result.gloss };
           }
           return n;
         }));
      }

    } catch(err) {
      console.error("AI Generation failed", err);
    } finally {
      this.isGeneratingIdentity.set(false);
    }
  }

  getEffectiveLabel(node: Node) {
    const stats = this.getNodeStats(node.id);
    const standard = this.cathexis.getHeuristicHandle(stats.r, stats.s);
    if (node.customHandle) {
      return { ...standard, handle: node.customHandle, gloss: node.customGloss || standard.gloss };
    }
    return standard;
  }

  // --- Visual Helpers ---

  getNode(id: string): Node {
    return this.nodeMap().get(id) || this.nodes()[0];
  }

  getNodeStats(id: string) {
    let r = 0, s = 0;
    this.edges().forEach(e => {
      if (e.target === id) {
        r += e.r;
        s += e.s;
      }
    });
    const op = this.ebsl.calculateOpinion(r, s);
    return { r, s, b: op.b, d: op.d, u: op.u };
  }

  getNodeEdges(id: string) {
    const all = this.edges();
    return {
      incoming: all.filter(e => e.target === id),
      outgoing: all.filter(e => e.source === id)
    };
  }

  getNodeReputation(id: string): number {
    const s = this.getNodeStats(id);
    return s.b - s.d;
  }
  
  getNodeCathexisLabel(id: string) {
    const s = this.getNodeStats(id);
    return this.cathexis.getHeuristicHandle(s.r, s.s);
  }
  
  getNodeCathexisColor(id: string): string {
    const label = this.getEffectiveLabel(this.getNode(id));
    if (label.style.includes('emerald')) return '#10b981';
    if (label.style.includes('teal')) return '#14b8a6';
    if (label.style.includes('red')) return '#ef4444';
    if (label.style.includes('amber')) return '#f59e0b';
    if (label.style.includes('blue')) return '#3b82f6';
    return '#94a3b8';
  }

  getNodeFill(node: Node): string {
     // Visual indicator of reliability (Simulated Ground Truth)
     if (node.reliability < 0.3) return '#ef4444'; // Malicious (Red)
     if (node.reliability < 0.7) return '#d97706'; // Mixed (Amber)

     // Healthy Colors
     if (node.role === 'Sybil') return '#475569';
     if (node.role === 'Validator') return '#4f46e5';
     if (node.role === 'Observer') return '#06b6d4';
     if (node.role === 'Trader') return '#3b82f6';
     return '#1e293b';
  }

  getEdgeWidth(edge: Edge): number {
    const total = edge.r + edge.s;
    return Math.min(10, 1 + Math.log(total + 1));
  }

  getEdgeColor(edge: Edge): string {
    const age = Date.now() - edge.lastActive;
    if (age > 4000) return '#64748b'; // Stale (Grey)

    if (edge.r === 0 && edge.s === 0) return '#475569';
    const ratio = edge.r / (edge.r + edge.s);
    if (ratio > 0.8) return '#34d399';
    if (ratio < 0.2) return '#f87171';
    return '#fbbf24';
  }

  getEdgeOpacity(edge: Edge): number {
    const age = Date.now() - edge.lastActive;
    if (age > 2000) {
      // Fade from 1.0 to 0.3 between 2s and 12s
      return Math.max(0.3, 1 - (age - 2000) / 10000);
    }
    return 1.0;
  }

  isTrustedEdge(edge: Edge): boolean {
    return edge.r > 5 && (edge.r / (edge.r + edge.s) > 0.9);
  }

  showEdgeTooltip(e: MouseEvent, edge: Edge) {
    this.tooltip.set({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      title: 'Trust Channel',
      items: [
        { label: 'Source', value: edge.source },
        { label: 'Target', value: edge.target },
        { label: 'Pos Evidence', value: edge.r.toFixed(1), color: 'text-emerald-400' },
        { label: 'Neg Evidence', value: edge.s.toFixed(1), color: 'text-red-400' }
      ]
    });
  }

  showNodeTooltip(e: MouseEvent, node: Node) {
    const stats = this.getNodeStats(node.id);
    this.tooltip.set({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      title: node.label,
      items: [
        { label: 'Role', value: node.role },
        { label: 'Belief (b)', value: stats.b.toFixed(2), color: 'text-emerald-400' },
        { label: 'Uncertainty (u)', value: stats.u.toFixed(2), color: 'text-indigo-400' }
      ]
    });
  }

  hideTooltip() {
    this.tooltip.update(t => ({ ...t, visible: false }));
  }
}

import { Injectable } from '@angular/core';

export interface CathexisHandle {
  handle: string;
  gloss: string;
  style: string;
}

@Injectable({
  providedIn: 'root'
})
export class CathexisService {
  /**
   * Lightweight heuristic handle generator used by graph visual demos.
   * The full CATHEXIS page demonstrates a richer categoriser pipeline.
   */
  getHeuristicHandle(r: number, s: number): CathexisHandle {
    const total = r + s;
    const ratio = total > 0 ? r / total : 0;

    if (total < 2) {
      return {
        handle: 'Unknown Entity',
        gloss: 'Insufficient evidence to form a reputation.',
        style: 'text-slate-400 border-slate-600'
      };
    }

    if (total > 50 && ratio > 0.95) {
      return {
        handle: 'Ecosystem Steward',
        gloss: 'High volume of positive evidence with negligible defects. Trust anchor.',
        style: 'text-emerald-400 border-emerald-500 bg-emerald-950/30'
      };
    }

    if (total > 20 && ratio > 0.8) {
      return {
        handle: 'Reliable Operator',
        gloss: 'Consistent positive performance with minor or justified exceptions.',
        style: 'text-teal-400 border-teal-500 bg-teal-950/30'
      };
    }

    if (total > 10 && ratio < 0.2) {
      return {
        handle: 'High-Risk Actor',
        gloss: 'History of negative outcomes. Interaction discouraged.',
        style: 'text-red-400 border-red-500 bg-red-950/30'
      };
    }

    if (total > 30 && ratio > 0.4 && ratio < 0.6) {
      return {
        handle: 'Controversial Figure',
        gloss: 'Significant evidence exists, but it is deeply polarized.',
        style: 'text-amber-400 border-amber-500 bg-amber-950/30'
      };
    }

    return {
      handle: 'Unverified Participant',
      gloss: 'Some evidence exists, but confidence is low due to high uncertainty.',
      style: 'text-blue-400 border-blue-500 bg-blue-950/30'
    };
  }
}

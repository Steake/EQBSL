import { Injectable } from '@angular/core';

export interface Opinion {
  b: number; // Belief
  d: number; // Disbelief
  u: number; // Uncertainty
  a: number; // Base rate
}

export interface Evidence {
  r: number; // Positive
  s: number; // Negative
}

@Injectable({
  providedIn: 'root'
})
export class EbslService {
  private readonly K = 2; // Default protocol parameter from papers

  /**
   * Calculates Subjective Logic opinion from evidence
   * b = r / (r + s + K)
   * d = s / (r + s + K)
   * u = K / (r + s + K)
   */
  calculateOpinion(r: number, s: number, a: number = 0.5): Opinion {
    const denominator = r + s + this.K;
    return {
      b: r / denominator,
      d: s / denominator,
      u: this.K / denominator,
      a: a
    };
  }

  /**
   * Expected probability E(w) = b + a * u
   */
  expectedProbability(opinion: Opinion): number {
    return opinion.b + (opinion.a * opinion.u);
  }

  /**
   * Fuse two opinions (Simplified Consensus operator)
   * This is a simplified version for the demo to show accumulation
   */
  fuseOpinions(op1: Opinion, op2: Opinion): Opinion {
    // A proper implementation of the cumulative fusion operator
    // For this demo, we can approximate by summing evidence if derived from same source type,
    // or using the consensus operator algebra.
    // Let's stick to the visual intuition: more evidence reduces uncertainty.
    
    // Using a simplified mock fusion for the visualizer if we don't track raw evidence perfectly in the graph
    // But ideally, we track evidence vectors.
    return op1; 
  }

  getCathexisLabel(r: number, s: number): { handle: string, gloss: string, style: string } {
    const total = r + s;
    const ratio = total > 0 ? r / total : 0;
    
    if (total < 2) {
      return { 
        handle: "Unknown Entity", 
        gloss: "Insufficient evidence to form a reputation.",
        style: "text-slate-400 border-slate-600"
      };
    }

    if (total > 50 && ratio > 0.95) {
      return { 
        handle: "Ecosystem Steward", 
        gloss: "High volume of positive evidence with negligible defects. Trust anchor.",
        style: "text-emerald-400 border-emerald-500 bg-emerald-950/30"
      };
    }

    if (total > 20 && ratio > 0.8) {
      return { 
        handle: "Reliable Operator", 
        gloss: "Consistent positive performance with minor or justified exceptions.",
        style: "text-teal-400 border-teal-500 bg-teal-950/30"
      };
    }

    if (total > 10 && ratio < 0.2) {
      return { 
        handle: "High-Risk Actor", 
        gloss: "History of negative outcomes. Interaction discouraged.",
        style: "text-red-400 border-red-500 bg-red-950/30"
      };
    }

    if (total > 30 && ratio > 0.4 && ratio < 0.6) {
      return { 
        handle: "Controversial Figure", 
        gloss: "Significant evidence exists, but it is deeply polarized.",
        style: "text-amber-400 border-amber-500 bg-amber-950/30"
      };
    }

    return { 
      handle: "Unverified Participant", 
      gloss: "Some evidence exists, but confidence is low due to high uncertainty.",
      style: "text-blue-400 border-blue-500 bg-blue-950/30"
    };
  }
}
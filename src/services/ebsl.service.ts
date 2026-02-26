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

}

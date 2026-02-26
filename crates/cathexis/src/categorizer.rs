use crate::{
    error::{CathexisError, Result},
    types::ProbabilityVector,
};

pub trait Categorizer {
    fn category_count(&self) -> usize;
    fn input_dim(&self) -> usize;
    fn predict(&self, x: &[f64]) -> Result<ProbabilityVector>;

    fn assign(&self, x: &[f64]) -> Result<(usize, ProbabilityVector)> {
        let p = self.predict(x)?;
        let (idx, _) = p
            .iter()
            .enumerate()
            .max_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(core::cmp::Ordering::Equal))
            .ok_or(CathexisError::InvalidProbabilityVector)?;
        Ok((idx, p))
    }
}

/// MLP baseline from the paper (Eq. 20) for inference-time usage.
#[derive(Debug, Clone)]
pub struct MlpCategorizer {
    input_dim: usize,
    hidden_dim: usize,
    categories: usize,
    w1: Vec<f64>, // hidden_dim x input_dim
    b1: Vec<f64>, // hidden_dim
    w2: Vec<f64>, // categories x hidden_dim
    b2: Vec<f64>, // categories
}

impl MlpCategorizer {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        input_dim: usize,
        hidden_dim: usize,
        w1: Vec<f64>,
        b1: Vec<f64>,
        categories: usize,
        w2: Vec<f64>,
        b2: Vec<f64>,
    ) -> Result<Self> {
        if categories == 0 || input_dim == 0 || hidden_dim == 0 {
            return Err(CathexisError::InvalidCategoryCount);
        }
        if w1.len() != hidden_dim * input_dim {
            return Err(CathexisError::DimensionMismatch {
                context: "w1",
                expected: hidden_dim * input_dim,
                got: w1.len(),
            });
        }
        if b1.len() != hidden_dim {
            return Err(CathexisError::DimensionMismatch {
                context: "b1",
                expected: hidden_dim,
                got: b1.len(),
            });
        }
        if w2.len() != categories * hidden_dim {
            return Err(CathexisError::DimensionMismatch {
                context: "w2",
                expected: categories * hidden_dim,
                got: w2.len(),
            });
        }
        if b2.len() != categories {
            return Err(CathexisError::DimensionMismatch {
                context: "b2",
                expected: categories,
                got: b2.len(),
            });
        }
        Ok(Self {
            input_dim,
            hidden_dim,
            categories,
            w1,
            b1,
            w2,
            b2,
        })
    }

    fn relu(x: f64) -> f64 {
        x.max(0.0)
    }

    fn matvec(rows: usize, cols: usize, m: &[f64], v: &[f64], b: &[f64]) -> Vec<f64> {
        let mut out = vec![0.0; rows];
        for r in 0..rows {
            let row = &m[(r * cols)..((r + 1) * cols)];
            let mut acc = b[r];
            for (a, x) in row.iter().zip(v.iter()) {
                acc += a * x;
            }
            out[r] = acc;
        }
        out
    }

    fn softmax(logits: &[f64]) -> ProbabilityVector {
        let max = logits
            .iter()
            .copied()
            .fold(f64::NEG_INFINITY, |a, b| a.max(b));
        let mut exps: Vec<f64> = logits.iter().map(|&x| (x - max).exp()).collect();
        let sum: f64 = exps.iter().sum();
        if sum > 0.0 && sum.is_finite() {
            for x in &mut exps {
                *x /= sum;
            }
        }
        exps
    }
}

impl Categorizer for MlpCategorizer {
    fn category_count(&self) -> usize {
        self.categories
    }

    fn input_dim(&self) -> usize {
        self.input_dim
    }

    fn predict(&self, x: &[f64]) -> Result<ProbabilityVector> {
        if x.len() != self.input_dim {
            return Err(CathexisError::DimensionMismatch {
                context: "feature vector",
                expected: self.input_dim,
                got: x.len(),
            });
        }
        let mut h = Self::matvec(self.hidden_dim, self.input_dim, &self.w1, x, &self.b1);
        for v in &mut h {
            *v = Self::relu(*v);
        }
        let logits = Self::matvec(self.categories, self.hidden_dim, &self.w2, &h, &self.b2);
        Ok(Self::softmax(&logits))
    }
}


use crate::features::FeatureState;
use ndarray::{Array1, Array2};
use serde::{Deserialize, Serialize};

/// Trait for a Categoriser Network (Section 3, Equation 14).
/// f_theta: R^d -> Delta^{K-1}
pub trait Categoriser {
    /// Maps a feature state to a probability distribution over K categories.
    fn forward(&self, features: &FeatureState) -> Result<Array1<f64>, String>;

    /// Returns the hard category assignment (Section 3, Equation 15).
    fn predict(&self, features: &FeatureState) -> Result<usize, String> {
        let probs = self.forward(features)?;
        probs
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
            .map(|(index, _)| index)
            .ok_or_else(|| "Empty probability vector".to_string())
    }
}

/// A simple MLP baseline categoriser (Section 4, Equation 20).
/// f(x) = softmax(W2 * sigma(W1 * x + b1) + b2)
#[derive(Debug, Serialize, Deserialize)]
pub struct MLPCategoriser {
    /// W1: Hidden layer weights (dim_hidden x dim_input)
    pub w1: Array2<f64>,
    /// b1: Hidden layer bias (dim_hidden)
    pub b1: Array1<f64>,
    /// W2: Output layer weights (dim_output x dim_hidden)
    pub w2: Array2<f64>,
    /// b2: Output layer bias (dim_output)
    pub b2: Array1<f64>,
}

impl MLPCategoriser {
    pub fn new(
        w1: Array2<f64>,
        b1: Array1<f64>,
        w2: Array2<f64>,
        b2: Array1<f64>,
    ) -> Self {
        Self { w1, b1, w2, b2 }
    }
}

fn sigmoid(x: &Array1<f64>) -> Array1<f64> {
    x.mapv(|v| 1.0 / (1.0 + (-v).exp()))
}

fn softmax(x: &Array1<f64>) -> Array1<f64> {
    let max = x.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
    let exp = x.mapv(|v| (v - max).exp());
    let sum = exp.sum();
    exp / sum
}

impl Categoriser for MLPCategoriser {
    fn forward(&self, features: &FeatureState) -> Result<Array1<f64>, String> {
        let x_vec = features.to_vector();
        // Convert Vec<f64> to Array1<f64>
        let x = Array1::from(x_vec);

        // Check dimensions
        if x.len() != self.w1.shape()[1] {
            return Err(format!(
                "Input dimension mismatch: expected {}, got {}",
                self.w1.shape()[1],
                x.len()
            ));
        }

        // Layer 1: z1 = W1 * x + b1
        let z1 = self.w1.dot(&x) + &self.b1;
        
        // Activation: a1 = sigma(z1)
        let a1 = sigmoid(&z1);

        // Layer 2: z2 = W2 * a1 + b2
        let z2 = self.w2.dot(&a1) + &self.b2;

        // Output: y = softmax(z2)
        let y = softmax(&z2);

        Ok(y)
    }
}

#[cfg(test)]
mod tests {
    use super::{sigmoid, softmax};
    use ndarray::array;

    #[test]
    fn sigmoid_handles_extreme_values() {
        let values = array![-1000.0, 0.0, 1000.0];
        let output = sigmoid(&values);

        assert!(output[0] < 1e-10);
        assert!((output[1] - 0.5).abs() < 1e-12);
        assert!((output[2] - 1.0).abs() < 1e-10);
    }

    #[test]
    fn softmax_is_stable_and_normalized() {
        let values = array![1000.0, 1001.0, 1002.0];
        let output = softmax(&values);

        assert!(output.iter().all(|value| value.is_finite() && *value > 0.0));
        assert!((output.sum() - 1.0).abs() < 1e-12);
        assert!(output[2] > output[1]);
        assert!(output[1] > output[0]);
    }
}

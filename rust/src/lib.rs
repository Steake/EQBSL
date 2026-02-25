pub mod opinion;
pub mod ebsl;
pub mod model;
pub mod embedding;

pub use opinion::Opinion;
pub use ebsl::{calculate_opinion, DEFAULT_K};
pub use model::*;
pub use embedding::{embed_nodes_basic, BasicEmbedding};

/// Re-export ndarray for convenience when using this crate
pub use ndarray::Array1;
pub use ndarray::array;

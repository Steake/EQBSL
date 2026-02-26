//! CATHEXIS: a trust-handle layer for EQBSL/EBSL networks.
//!
//! This crate implements the core inference-time pieces described in the CATHEXIS yellowpaper:
//! feature state construction `x_i(t)`, category inference `p_i(t)`, hard assignment `c_i(t)`,
//! category summaries, label metadata, drift checks, and batch/online query pipeline helpers.
//!
//! It is intentionally modular and does **not** implement a full EQBSL engine or LLM runtime.
//! Instead, it defines interfaces and reusable components to sit on top of an existing trust stack.

mod categorizer;
mod error;
mod extractor;
mod graph;
mod label;
mod pipeline;
mod summary;
mod types;

pub use categorizer::{Categorizer, MlpCategorizer};
pub use error::{CathexisError, Result};
pub use extractor::{
    CompositeFeatureExtractor, FeatureContext, FeatureExtractor, StaticFeatureExtractor,
};
pub use graph::{GraphSnapshot, Hyperedge};
pub use label::{
    CategoryLabel, DriftSignal, InMemoryLabelStore, LabelRecord, LabelStore, LabelUpdatePolicy,
};
pub use pipeline::{
    BatchInput, BatchOutput, CathexisEngine, HeuristicLabelProvider, LabelProvider,
    QueryAgentHandleResponse, QueryInput,
};
pub use summary::{CategorySummary, CategorySummaryCollection, CovarianceMode};
pub use types::{
    AgentAssignment, AgentFeatureState, AgentId, CategoryId, EqbslState, NodeState, ProbabilityVector,
};

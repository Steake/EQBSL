use core::fmt;

/// Category identifier. Defined here to avoid a circular dependency between
/// `error` and `types`, which imports this module.
pub type CategoryId = usize;

#[derive(Debug, Clone, PartialEq)]
pub enum CathexisError {
    DimensionMismatch {
        context: &'static str,
        expected: usize,
        got: usize,
    },
    InvalidCategoryCount,
    InvalidProbabilityVector,
    EmptyInput(&'static str),
    MissingNode(String),
    MissingLabel(CategoryId),
    /// `b + d + u ≠ 1`, values out of [0, 1], or base rate `a` out of [0, 1].
    InvalidOpinion { b: f64, d: f64, u: f64, a: f64 },
    /// Negative evidence counts or non-positive K.
    InvalidEvidence { r: f64, s: f64, k: f64 },
    /// Attempted to combine two `Evidence` values with different K constants.
    IncompatibleEvidence { k_self: f64, k_other: f64 },
}

pub type Result<T> = core::result::Result<T, CathexisError>;

impl fmt::Display for CathexisError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::DimensionMismatch {
                context,
                expected,
                got,
            } => write!(f, "{context} dimension mismatch: expected {expected}, got {got}"),
            Self::InvalidCategoryCount => write!(f, "invalid category count (must be > 0)"),
            Self::InvalidProbabilityVector => write!(f, "invalid probability vector"),
            Self::EmptyInput(context) => write!(f, "empty input: {context}"),
            Self::MissingNode(id) => write!(f, "missing node: {id}"),
            Self::MissingLabel(id) => write!(f, "missing label for category {id}"),
            Self::InvalidOpinion { b, d, u, a } => write!(
                f,
                "invalid opinion (b={b:.6}, d={d:.6}, u={u:.6}, a={a:.6}): \
                 b+d+u must equal 1 and all components (including base rate a) must be in [0,1]"
            ),
            Self::InvalidEvidence { r, s, k } => write!(
                f,
                "invalid evidence (r={r}, s={s}, k={k}): r and s must be ≥ 0, k must be > 0"
            ),
            Self::IncompatibleEvidence { k_self, k_other } => write!(
                f,
                "incompatible evidence: cannot combine evidence with k={k_self} and k={k_other} \
                 (K constants must match)"
            ),
        }
    }
}

impl std::error::Error for CathexisError {}


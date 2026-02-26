use core::fmt;

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
    MissingLabel(usize),
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
        }
    }
}

impl std::error::Error for CathexisError {}


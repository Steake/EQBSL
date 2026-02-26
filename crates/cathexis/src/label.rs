use std::collections::BTreeMap;

use crate::summary::CategorySummary;

#[derive(Debug, Clone, PartialEq)]
pub struct CategoryLabel {
    pub handle: String,
    pub gloss: String,
    pub guidance: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LabelRecord {
    pub label: CategoryLabel,
    pub snapshot_time: u64,
}

pub trait LabelStore {
    fn get(&self, category_id: usize) -> Option<&LabelRecord>;
    fn upsert(&mut self, category_id: usize, record: LabelRecord);
}

#[derive(Debug, Clone, Default)]
pub struct InMemoryLabelStore {
    records: BTreeMap<usize, LabelRecord>,
}

impl LabelStore for InMemoryLabelStore {
    fn get(&self, category_id: usize) -> Option<&LabelRecord> {
        self.records.get(&category_id)
    }

    fn upsert(&mut self, category_id: usize, record: LabelRecord) {
        self.records.insert(category_id, record);
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LabelUpdatePolicy {
    pub mean_l2_drift_threshold: f64,
    pub membership_change_ratio_threshold: f64,
}

impl Default for LabelUpdatePolicy {
    fn default() -> Self {
        Self {
            mean_l2_drift_threshold: 0.5,
            membership_change_ratio_threshold: 0.25,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct DriftSignal {
    pub mean_l2_drift: f64,
    pub membership_change_ratio: f64,
}

impl DriftSignal {
    pub fn should_relabel(&self, policy: LabelUpdatePolicy) -> bool {
        self.mean_l2_drift >= policy.mean_l2_drift_threshold
            || self.membership_change_ratio >= policy.membership_change_ratio_threshold
    }
}

impl InMemoryLabelStore {
    pub fn record_drift(
        previous: &CategorySummary,
        current: &CategorySummary,
    ) -> DriftSignal {
        let mean_l2_drift = l2_distance(&previous.mean, &current.mean);
        let membership_change_ratio =
            symmetric_membership_delta_ratio(&previous.members, &current.members);
        DriftSignal {
            mean_l2_drift,
            membership_change_ratio,
        }
    }
}

fn l2_distance(a: &[f64], b: &[f64]) -> f64 {
    let d = a.len().min(b.len());
    let mut acc = 0.0;
    for i in 0..d {
        let x = a[i] - b[i];
        acc += x * x;
    }
    acc.sqrt()
}

fn symmetric_membership_delta_ratio(prev: &[String], curr: &[String]) -> f64 {
    use std::collections::BTreeSet;
    let p: BTreeSet<&str> = prev.iter().map(String::as_str).collect();
    let c: BTreeSet<&str> = curr.iter().map(String::as_str).collect();
    let union = p.union(&c).count();
    if union == 0 {
        return 0.0;
    }
    let inter = p.intersection(&c).count();
    let symm_delta = union - inter;
    symm_delta as f64 / union as f64
}


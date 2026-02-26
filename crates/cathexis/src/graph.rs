use std::collections::{BTreeMap, BTreeSet};

pub type Hyperedge = Vec<String>;

/// Lightweight undirected graph/hypergraph snapshot used by CATHEXIS feature extractors.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct GraphSnapshot {
    nodes: BTreeSet<String>,
    adjacency: BTreeMap<String, BTreeSet<String>>,
    hyperedges: Vec<Hyperedge>,
}

impl GraphSnapshot {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn from_nodes_and_edges<N, E, A, B>(nodes: N, edges: E) -> Self
    where
        N: IntoIterator<Item = A>,
        A: Into<String>,
        E: IntoIterator<Item = (B, B)>,
        B: Into<String>,
    {
        let mut g = Self::new();
        for n in nodes {
            g.add_node(n);
        }
        for (a, b) in edges {
            g.add_edge(a, b);
        }
        g
    }

    pub fn add_node(&mut self, node: impl Into<String>) {
        let node = node.into();
        self.nodes.insert(node.clone());
        self.adjacency.entry(node).or_default();
    }

    pub fn add_edge(&mut self, a: impl Into<String>, b: impl Into<String>) {
        let a = a.into();
        let b = b.into();
        self.add_node(a.clone());
        self.add_node(b.clone());
        if a == b {
            return;
        }
        self.adjacency.entry(a.clone()).or_default().insert(b.clone());
        self.adjacency.entry(b).or_default().insert(a);
    }

    pub fn add_hyperedge<I, S>(&mut self, nodes: I)
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        let mut edge: Vec<String> = nodes.into_iter().map(Into::into).collect();
        edge.sort();
        edge.dedup();
        for n in &edge {
            self.add_node(n.clone());
        }
        if edge.len() >= 2 {
            self.hyperedges.push(edge);
        }
    }

    pub fn nodes(&self) -> impl Iterator<Item = &String> {
        self.nodes.iter()
    }

    pub fn neighbors(&self, node: &str) -> impl Iterator<Item = &String> {
        self.adjacency.get(node).into_iter().flat_map(|s| s.iter())
    }

    pub fn degree(&self, node: &str) -> usize {
        self.adjacency.get(node).map(|s| s.len()).unwrap_or(0)
    }

    pub fn hyperedge_count_for(&self, node: &str) -> usize {
        self.hyperedges
            .iter()
            .filter(|edge| edge.iter().any(|n| n == node))
            .count()
    }

    pub fn mean_hyperedge_size_for(&self, node: &str) -> f64 {
        let mut total = 0usize;
        let mut count = 0usize;
        for edge in &self.hyperedges {
            if edge.iter().any(|n| n == node) {
                total += edge.len();
                count += 1;
            }
        }
        if count == 0 {
            0.0
        } else {
            total as f64 / count as f64
        }
    }

    /// Undirected local clustering coefficient over pairwise edges.
    pub fn clustering_coefficient(&self, node: &str) -> f64 {
        let neighbors: Vec<&String> = self.neighbors(node).collect();
        let k = neighbors.len();
        if k < 2 {
            return 0.0;
        }
        let mut links = 0usize;
        for i in 0..k {
            for j in (i + 1)..k {
                let a = neighbors[i];
                let b = neighbors[j];
                if self
                    .adjacency
                    .get(a)
                    .map(|set| set.contains(b))
                    .unwrap_or(false)
                {
                    links += 1;
                }
            }
        }
        let possible = k * (k - 1) / 2;
        links as f64 / possible as f64
    }
}


# WF-HACP-STUDIO-G1-51 Graph Model

## Data Contracts
- `ConstraintGraph`:
  - `nodes`: Map<string, VectorNode>
  - `edges`: ReadonlyArray<VectorConstraintEdge>
  - `adjacencyList`: GraphAdjacencyList (Target -> [Dependents])
  - `reverseAdjacencyList`: GraphAdjacencyList (Source -> [Dependencies])

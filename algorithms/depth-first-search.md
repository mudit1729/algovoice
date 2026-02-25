---
title: Depth-First Search (Graph)
slug: depth-first-search
difficulty: medium
tags: [graphs, traversal, recursion]
estimated_minutes: 10
---

## Description

Depth-first search (DFS) is a graph traversal algorithm that explores as far as possible
along each branch before backtracking. It uses a stack (or recursion) to keep track of
which nodes to visit next. DFS is fundamental to many graph algorithms like cycle detection,
topological sorting, and finding connected components.

## Complexity

- **Time**: O(V + E) where V is vertices and E is edges
- **Space**: O(V) for the visited set and recursion stack

## Code

```python
def dfs(graph, start):
    visited = set()
    result = []

    def explore(node):
        if node in visited:
            return
        visited.add(node)
        result.append(node)

        for neighbor in graph[node]:
            explore(neighbor)

    explore(start)
    return result
```

## Walkthrough

### Step 1: Function Setup (lines 1-3)
We define the DFS function taking an adjacency list `graph` and a `start` node.
We initialize a `visited` set to track which nodes we have seen and a `result` list
to record the order in which we visit nodes.

### Step 2: Inner Explore Function (line 5)
We define a nested helper function `explore` that does the actual recursive traversal.
Using a closure lets it access `visited` and `result` from the outer scope.

### Step 3: Base Case - Already Visited (lines 6-7)
If the current node is already in our `visited` set, we return immediately. This prevents
infinite loops in graphs that have cycles.

### Step 4: Visit the Node (lines 8-9)
We mark the node as visited by adding it to the set, and append it to our result list.
This records that we have "discovered" this node.

### Step 5: Explore Neighbors (lines 11-12)
We iterate through all neighbors of the current node in the adjacency list. For each
unvisited neighbor, we recursively call `explore`. This is the "depth-first" part --
we go as deep as possible before backtracking.

### Step 6: Kick Off and Return (lines 14-15)
We start the traversal from the `start` node and return the result list containing
all reachable nodes in the order they were visited.

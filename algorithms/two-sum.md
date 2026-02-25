---
title: Two Sum (Hash Map)
slug: two-sum
difficulty: easy
tags: [hash-map, arrays]
estimated_minutes: 6
---

## Description

Given an array of integers and a target sum, find two numbers that add up to the target.
Return their indices. This is one of the most classic interview problems, and the hash map
approach solves it in a single pass through the array.

## Complexity

- **Time**: O(n) - single pass through the array
- **Space**: O(n) - hash map stores up to n elements

## Code

```python
def two_sum(nums, target):
    seen = {}

    for i, num in enumerate(nums):
        complement = target - num

        if complement in seen:
            return [seen[complement], i]

        seen[num] = i

    return []
```

## Walkthrough

### Step 1: Function Signature (line 1)
We take a list of numbers and a target sum. We need to find two numbers whose sum
equals the target and return their indices.

### Step 2: Hash Map Setup (line 2)
We create an empty dictionary called `seen`. This will map each number we have visited
to its index. It is our "memory" of what we have encountered so far.

### Step 3: Iterate Through Array (line 4)
We loop through the array using `enumerate` to get both the index `i` and the value `num`
at each position.

### Step 4: Calculate Complement (line 5)
For each number, we calculate what value we would need to add to it to reach the target.
This is simply `target - num`. For example, if the target is 9 and the current number is 4,
the complement is 5.

### Step 5: Check if Complement Exists (lines 7-8)
We look up the complement in our hash map. If it is there, we have found our pair!
We return the index of the complement (stored in the map) and the current index.

### Step 6: Store Current Number (line 10)
If the complement was not found, we store the current number and its index in the map.
This way, future iterations can find it as a complement.

### Step 7: No Solution (line 12)
If we finish the loop without finding a pair, we return an empty list to indicate
no solution exists.

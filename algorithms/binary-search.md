---
title: Binary Search
slug: binary-search
difficulty: easy
tags: [searching, divide-and-conquer]
estimated_minutes: 8
---

## Description

Binary search is an efficient algorithm for finding a target value within a sorted array.
It works by repeatedly dividing the search interval in half. If the target is less than the
middle element, we search the left half; otherwise, we search the right half.

## Complexity

- **Time**: O(log n) - we halve the search space each iteration
- **Space**: O(1) - only a few pointer variables

## Code

```python
def binary_search(arr, target):
    left = 0
    right = len(arr) - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1
```

## Walkthrough

### Step 1: Function Signature (line 1)
We define a function that takes a sorted array and a target value we want to find.
It will return the index of the target if found, or -1 if not present.

### Step 2: Initialize Pointers (lines 2-3)
We set up two pointers: `left` starts at the beginning of the array (index 0) and
`right` starts at the end. Together they define our current search range.

### Step 3: Main Loop (line 5)
The `while` loop continues as long as `left` has not crossed past `right`. If they
cross, it means our search range is empty and the target is not in the array.

### Step 4: Calculate Midpoint (line 6)
We find the middle index using integer division. This is the element we will compare
against our target. Think of it like opening a dictionary to the middle page.

### Step 5: Check for Match (lines 8-9)
If the middle element equals our target, we found it! We return the index immediately.

### Step 6: Target is Larger (lines 10-11)
If the middle element is smaller than our target, the target must be in the right half
of the array. So we move `left` to `mid + 1`, discarding the entire left half.

### Step 7: Target is Smaller (lines 12-13)
If the middle element is larger than our target, the target must be in the left half.
So we move `right` to `mid - 1`, discarding the entire right half.

### Step 8: Not Found (line 15)
If we exit the loop without finding the target, we return -1 to indicate the target
is not present in the array.

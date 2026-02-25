---
title: Quicksort
slug: quicksort
difficulty: medium
tags: [sorting, divide-and-conquer, recursion]
estimated_minutes: 12
---

## Description

Quicksort is a highly efficient, comparison-based sorting algorithm that uses a divide-and-conquer
strategy. It picks a "pivot" element, partitions the array so that elements smaller than the pivot
go to the left and larger elements go to the right, then recursively sorts each partition.

## Complexity

- **Time**: O(n log n) average, O(n^2) worst case (rare with good pivot selection)
- **Space**: O(log n) due to recursion stack

## Code

```python
def quicksort(arr, low, high):
    if low < high:
        pivot_idx = partition(arr, low, high)
        quicksort(arr, low, pivot_idx - 1)
        quicksort(arr, pivot_idx + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1

    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]

    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
```

## Walkthrough

### Step 1: Quicksort Entry Point (lines 1-2)
The main function takes an array and the low/high indices defining the range to sort.
The base case is when `low` is no longer less than `high`, meaning the sub-array has
0 or 1 elements and is already sorted.

### Step 2: Partition and Recurse (lines 3-5)
We call `partition` to rearrange elements around a pivot. After partitioning, the pivot
is in its final sorted position at `pivot_idx`. We then recursively sort the left portion
(everything before the pivot) and the right portion (everything after the pivot).

### Step 3: Partition Function Setup (lines 7-9)
The `partition` function picks the last element as the pivot. The variable `i` tracks where
the boundary between "small" and "large" elements will be. It starts one position before `low`.

### Step 4: Scanning and Swapping (lines 11-14)
We scan through each element from `low` to `high - 1`. When we find an element less than or
equal to the pivot, we increment `i` and swap that element into the "small" section.
Think of `i` as a bookmark for where the next small element should go.

### Step 5: Place the Pivot (lines 16-17)
After scanning, we swap the pivot (at `high`) into position `i + 1`. Now everything to the left
of `i + 1` is smaller than the pivot, and everything to the right is larger. We return `i + 1`
as the pivot's final index.

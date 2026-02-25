---
title: Merge Sort
slug: merge-sort
difficulty: medium
tags: [sorting, divide-and-conquer, recursion]
estimated_minutes: 12
---

## Description

Merge sort is a stable, comparison-based sorting algorithm that divides the array in half,
recursively sorts each half, and then merges the two sorted halves back together. It
guarantees O(n log n) time complexity in all cases, making it very predictable.

## Complexity

- **Time**: O(n log n) in all cases (best, average, worst)
- **Space**: O(n) for the temporary arrays during merging

## Code

```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0

    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

## Walkthrough

### Step 1: Base Case (lines 1-3)
The function takes an array and checks if it has 0 or 1 elements. If so, it is already
sorted, so we return it immediately. This is the base case that stops the recursion.

### Step 2: Divide (lines 5-7)
We find the midpoint and split the array into two halves. We recursively call `merge_sort`
on each half. The recursion keeps splitting until we reach single-element arrays.

### Step 3: Conquer (line 9)
Once both halves are sorted (by the recursive calls), we merge them back together into
a single sorted array using the `merge` helper function.

### Step 4: Merge Setup (lines 11-13)
The `merge` function takes two sorted arrays. We create an empty result list and two
pointers `i` and `j` starting at the beginning of each array.

### Step 5: Compare and Merge (lines 15-21)
We compare elements from both arrays one by one. The smaller element gets added to the
result, and we advance that pointer. This continues until one array is exhausted.
The `<=` comparison makes this a stable sort -- equal elements preserve their original order.

### Step 6: Append Remainder (lines 23-25)
After the while loop, one array may still have elements left. We extend the result with
whatever remains from both arrays (only one will have elements left). Then we return
the fully merged, sorted array.

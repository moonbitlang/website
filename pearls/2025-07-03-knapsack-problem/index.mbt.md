---
description: 01 Knapsack Problem
slug: knapsack-problem
image: cover.png
tags: [MoonBit, Pearls]
---

# 01 Knapsack Problem

![](./cover.png)

The 0/1 Knapsack Problem is a classic dynamic programming (DP) problem commonly found in **algorithm competitions.**
This article presents five versions of the solution, starting from a basic brute-force approach and gradually evolving into a DP-based implementation.

## Problem Definition

There are several items, each with a`weight`and a `value`:

```mbt
struct Item {
  weight : Int
  value : Int
}
```

Now, given a list of `items` (items) and a knapsack `capacity` (capacity), select a subset of the items such that the total weight does not exceed the knapsack capacity, and the total value is maximized.

```mbt
typealias @list.T as List

let items_1 : List[Item] = @list.of([
  { weight: 7, value: 20 },
  { weight: 4, value: 10 },
  { weight: 5, value: 11 },
])
```

Take `items_1` as an example. If the knapsack capacity is 10, the optimal solution is to select the last two items. Their combined weight is 4 + 5 = 9, and their total value is 10 + 11 = 21.

Note that items cannot be split. Therefore, greedily selecting the item with the highest value-to-weight ratio does not always yield the correct result.

For example, in the case above, if we pick only the first item (which has the highest ratio), we get 20 points in total, but the knapsack will be full and no other items can be added.

## Problem Modeling

First, we define some basic objects and operations.

```mbt
//A combination of items, referred to as "combination" throughout the article
struct Combination {
  items : List[Item]
  total_weight : Int
  total_value : Int
}

//An empty combination
let empty_combination : Combination = {
  items: @list.empty(),
  total_weight: 0,
  total_value: 0,
}

//Add an item to a combination and return a new combination
fn Combination::add(self : Combination, item : Item) -> Combination {
  {
    items: self.items.add(item),
    total_weight: self.total_weight + item.weight,
    total_value: self.total_value + item.value,
  }
}

//Two combinations are considered equal if they have the same total value
impl Eq for Combination with op_equal(self, other) {
  self.total_value == other.total_value
}

//Compare two combinations by their total value
impl Compare for Combination with compare(self, other) {
  self.total_value.compare(other.total_value)
}
```

Now, we can begin thinking about how to solve the problem.

## 1.Naive Enumeration

Enumeration is the most straightforward approach. By following the problem definition step by step, we can arrive at a solution:

1. Enumerate all possible combinations;
2. Filter out only the valid combinations-those that fit in the knapsack;
3. Select the one with the maximum total value.

Thanks to the two functions provided by our modeling, we can translate the three steps above directly into MoonBit code. The `all_combinations` function, which we'll implement later, has the type`(List[Item]) -> List[Combination]`.

```mbt
fn solve_v1(items : List[Item], capacity : Int) -> Combination {
  all_combinations(items)
  .filter(fn(comb) { comb.total_weight <= capacity })
  .unsafe_maximum()
}
```

Note that we use `unsafe_maximum` instead of `maximum` because we're taking the maximum of a non-empty list, and in this case, maximum will not return `None`.Since the problem guarantees that a solution exists (as long as `capacity` is non-negative), we can safely use `unsafe_maximum`. It skips the empty-list check but implicitly assumes the result will exist.

Now let's implement the enumeration step.Suppose `all_combinations` takes a list of items and returns a list of combinations, each representing a possible subset of those items.
If this seems unclear at first, we can begin by looking at the definition of the list structure, which looks roughly like this:

```moombit
enum List[A] {
  Empty
  More(A, tail~ : List[A])
}
```

In other words, a list has two possible forms:

1. An empty list, represented as `Empty`;
2. A non-empty list, represented as `More`, which contains the first element (`A`) and the rest of the list (`tail: List[A]`), which is itself also a list.

This structure gives us a hint for how to recursively build combinations:

- If the item list is empty, the only possible combination is the empty combination;
- Otherwise, there must be a first item `item1` and a remaining list `items_tail`. In this case, we can:
  1. Recursively compute all combinations of `items_tail`, which represent combinations that do **not** include `item1`;
  2. For each of those, add `item1` to form new combinations that **do** include it;
  3. Merge both sets to obtain all combinations of the original `items` list.

For example, if the item list is `a, b, c`, then the combinations can be divided into two parts:

| Without a  | With a (by adding a to the left side) |
| ---------- | ------------------------------------- |
| \{ \}      | \{ a \}                               |
| \{ b \}    | \{ a, b \}                            |
| \{ c \}    | \{ a, c \}                            |
| \{ b, c \} | \{ a, b, c \}                         |

```mbt
fn all_combinations(items : List[Item]) -> List[Combination] {
  match items {
    Empty => @list.singleton(empty_combination)
    More(item1, tail=items_tail) => {
      let combs_without_item1 = all_combinations(items_tail)
      let combs_with_item1 = combs_without_item1.map(_.add(item1))
      combs_with_item1 + combs_without_item1
    }
  }
}
```

By using pattern matching (`match`), we've translated the five lines of logic above into MoonBit code for the first time, line by line.

## 2.Early Filtering: Enumerate Only Valid Combinations

In the first version, generating all combinations and filtering out those that fit in the knapsack were two separate steps.During the enumeration process, many invalid combinations were generated-combinations that had already exceeded the knapsack capacity but were still extended with more items.If we filter them earlier, we can avoid generating many unnecessary combinations on top of invalid ones, which is clearly more efficient.Looking at the code, we see that invalid combinations are only produced during `.map(_.add(item1))`.So we can optimize by only adding `item1` to combinations that can still fit it.

We now rename `all_combinations` to `all_combinations_valid`, which returns only combinations that can actually fit in the knapsack. The generation and filtering processes are now interleaved.

```mbt
fn all_combinations_valid(
  items : List[Item],
  capacity : Int // Add capacity as a parameter because filtering requires it
) -> List[Combination] {
  match items {
    Empty => @list.singleton(empty_combination) // An empty combination is always valid
    More(item1, tail=items_tail) => {
      // Recursively obtain combinations without this item (by assumption, all valid)
      let valid_combs_without_item1 = all_combinations_valid(
        items_tail, capacity,
      )
      // Add item1 to valid combinations that can still hold it
      let valid_combs_with_item1 = valid_combs_without_item1
        .filter(fn(comb) { comb.total_weight + item1.weight <= capacity })
        .map(_.add(item1))
      // Both parts are valid, so we return their union
      valid_combs_with_item1 + valid_combs_without_item1
    }
  }
}
```

This structure naturally supports inductive reasoning, making it easy to prove the correctness of `all_combinations_valid`-it indeed returns only valid combinations.

Since `all_combinations_valid` already returns only valid combinations, we no longer need to filter in `solve`.We simply remove the `filter` from `solve`:

```mbt
fn solve_v2(items : List[Item], capacity : Int) -> Combination {
  all_combinations_valid(items, capacity).unsafe_maximum()
}
```

## 3.Maintain Order to Enable Early Termination

In the previous version, to construct new combinations, we needed to iterate over every combination in `valid_combs_without_item1`.

But we can observe: if `item1` cannot be added to a certain combination, then it definitely cannot be added to any combination with a greater total weight than that one.
In other words, if `valid_combs_without_item1` is sorted in ascending order of total weight, then we don't need to traverse it entirely during filtering.

During filtering, as soon as we encounter a combination that can't fit `item1`, we can immediately discard the remaining combinations.Since this logic is common, the standard library provides a function called `take_while`, which we use to replace `filter`.

To make `valid_combs_without_item1` sorted, we could use a sorting algorithm-but that would require traversing the entire list, which defeats the purpose.Therefore, we adopt a different approach: ensure that the list returned by `all_combinations_valid` is already sorted in ascending order.

This requires a leap of faith via recursion:

```mbt
fn all_combinations_valid_ordered(
  items : List[Item],
  capacity : Int
) -> List[Combination] {
  match items {
    Empty => @list.singleton(empty_combination) // A single-element list is naturally in ascending order.
    More(item1, tail=items_tail) => {
      // We assume that all_combinations_valid_ordered returns a list sorted in ascending order (inductive hypothesis).
      let valid_combs_without_item1 = all_combinations_valid_ordered(
        items_tail, capacity,
      )
      // Then valid_combs_with_item1 is also in ascending order, because taking a prefix of an ascending list and adding the same weight to each element still yields an ascending list by total weight.
      let valid_combs_with_item1 = valid_combs_without_item1
        .take_while(fn(comb) { comb.total_weight + item1.weight <= capacity })
        .map(_.add(item1))
      // Now, we only need to ensure that the merged result is also sorted in ascending order to maintain our initial assumption.
      merge_keep_order(valid_combs_with_item1, valid_combs_without_item1)
    }
  }
}
```

The final task is to implement the function `merge_keep_order`, which merges two ascending lists into one ascending list:

```mbt
fn merge_keep_order(
  a : List[Combination],
  b : List[Combination]
) -> List[Combination] {
  match (a, b) {
    (Empty, another) | (another, Empty) => another
    (More(a1, tail=a_tail), More(b1, tail=b_tail)) =>
      // If a1 is lighter than b1, and b1 is part of an ascending list, then:
      //   a1 is lighter than all combinations in b
      // Since list a is also in ascending order
      //   a1 is also lighter than all combinations in a_tail
      // Therefore, a1 is the smallest among all elements in a and b
      if a1.total_weight < b1.total_weight {
        // We first recursively merge the rest of the list, then prepend a1
        merge_keep_order(a_tail, b).add(a1)
      } else { //
        merge_keep_order(a, b_tail).add(b1)
      }
  }
}
```

Although it might seem a bit verbose, I still want to point this out: by following a case-based analysis aligned with the structure of the code, it's actually easy to prove the correctness of `all_combinations_valid_ordered` and `merge_keep_order` - they do return a sorted list.

For an ascending list, the maximum element is simply the last one. So we replaced `unsafe_maximum` with `unsafe_last`.

```mbt
fn solve_v3(items : List[Item], capacity : Int) -> Combination {
  all_combinations_valid_ordered(items, capacity).unsafe_last()
}
```

Looking back, this version of the optimization might not seem like a big win - after all, we still have to traverse the entire list during the merge. That was my initial impression too, but I later discovered something unexpected.

## 4.Removing Redundant Combinations with Equal Weights for Optimal Time Complexity

So far, the optimizations we've made haven't addressed time complexity, but they've laid the groundwork for this next step. Now let's consider the algorithm's time complexity.

In the worst case (e.g., when the knapsack is large enough to hold everything), the combination list returned by `all_combinations` can contain up to $2^{number of items}$ elements. This results in an exponential time complexity, especially since all_combinations is called multiple times, each time returning a potentially large list.

To reduce the time complexity, we need to limit the length of the candidate combination list. This is based on a simple observation: if two combinations have the same total weight, the one with the higher total value is always better. Therefore, we don't need to keep both in the list.

By eliminating these redundant combinations, the list length will never exceed the knapsack's capacity (thanks to the pigeonhole principle). This optimization reduces the algorithm's time complexity to $\mathcal{O}(number of items \times capacity)$. Upon reviewing the code, the only place where redundant combinations may still be introduced is the else branch of merge_keep_order. To prevent this, we just need to make a small modification to that section.

```mbt
fnalias @math.maximum

fn merge_keep_order_and_dedup(
  a : List[Combination],
  b : List[Combination]
) -> List[Combination] {
  match (a, b) {
    (Empty, another) | (another, Empty) => another
    (More(a1, tail=a_tail), More(b1, tail=b_tail)) =>
      if a1.total_weight < b1.total_weight {
        merge_keep_order_and_dedup(a_tail, b).add(a1)
      } else if a1.total_weight > b1.total_weight {
        merge_keep_order_and_dedup(a, b_tail).add(b1)
      } else { // "In this case, a1 and b1 have the same weight, creating a duplicate. We keep the one with the higher total value."
        let better = maximum(a1, b1)
        merge_keep_order_and_dedup(a_tail, b_tail).add(better)
      }
  }
}
```

Simply replace the corresponding parts with `all_combinations_valid_ordered_nodup` (arguably the longest function name I've ever written) and `solve_v4`.

```mbt
fn all_combinations_valid_ordered_nodup(
  items : List[Item],
  capacity : Int
) -> List[Combination] {
  match items {
    Empty => @list.singleton(empty_combination)
    More(item1, tail=items_tail) => {
      let combs_without_item1 = all_combinations_valid_ordered_nodup(
        items_tail, capacity,
      )
      let combs_with_item1 = combs_without_item1
        .take_while(fn(comb) { comb.total_weight + item1.weight <= capacity })
        .map(_.add(item1))
      merge_keep_order_and_dedup(combs_with_item1, combs_without_item1)
    }
  }
}

fn solve_v4(items : List[Item], capacity : Int) -> Combination {
  all_combinations_valid_ordered_nodup(items, capacity).unsafe_last()
}
```

At this point, we've essentially reinvented the dynamic programming solution for the 0/1 knapsack problem.

## Conclusion

This article's content came from a sudden idea I had one morning while lying in bed. From the first to the fourth version, all code was written entirely on my phone without any debugging-yet correctness was easily guaranteed. Compared to conventional solutions often seen in algorithm competitions, the functional programming style used here brings the following advantages:

1. **No loops, only recursion and structural decomposition.** To extract elements from a list, pattern matching (`match`) is required, which naturally prompts consideration of empty cases and expresses intent more clearly than initializing a DP array.
2. **Composition of higher-order functions.** Standard functions like `filter`, `take_while`, `map`, and `maximum` replace boilerplate loops (`for`, `while`), making the traversal purpose clearer at a glance.
3. **Declarative code.** The later versions of the solution are direct translations of the first one. Rather than just implementing a solution, the code _describes_ the problem itself. This ensures the correctness of the first version. Each subsequent improvement was made without affecting the correctness, allowing for a safe and iterative process.

Of course, this solution doesn't apply state space compression, so a tradeoff between readability and efficiency remains. The functional style is slightly idealistic but still leaves room for many optimizations. A future direction would be to convert the list structure into a tree, exploiting the fact that functions only pass two argument groups throughout execution-possibly even a single value. This could reduce space complexity to O(capacity), though it's beyond the scope of this article. We believe the approach here offers a beginner-friendly and understandable way to write correct code.

## Appendix

### Further Optimization Details

Given that the order of items does not affect the total value of the result, we can convert `all_combinations` into a tail-recursive version.

Additionally, since the list produced by `take_while` is immediately discarded after being passed to `map`, certain syntax-level techniques can be used to avoid creating this temporary list altogether.

```mbt
fn all_combinations_loop(
  items : List[Item],
  capacity : Int
) -> List[Combination] {
  loop items, @list.singleton(empty_combination) {
    Empty, combs_so_far => combs_so_far
    More(item1, tail=items_tail), combs_so_far => {
      let combs_without_item1 = combs_so_far
      let combs_with_item1 = combs_without_item1
        .iter()
        .take_while(fn(comb) { comb.total_weight + item1.weight <= capacity })
        .map(_.add(item1))
        |> @list.from_iter
      continue items_tail,
        merge_keep_order_and_dedup(combs_with_item1, combs_without_item1)
    }
  }
}

fn solve_v5(items : List[Item], capacity : Int) -> Combination {
  all_combinations_loop(items, capacity).unsafe_last()
}
```

### Side Notes

1. In the first version, the `Combination` generated by `all_combinations(items)` even contains one more node than `More`, making it a true master of linked list node reuse.
2. An ascending order can't be treated as "broken" order, so the corresponding `take_while` must be converted to `drop_while`. When using an array, we can directly cut segments via `binary_search` on indices.
3. If you're interested, consider how to generalize the above approach to [various other knapsack problems](https://oi-wiki.org/dp/knapsack/).
4. The original name of `all_combinations_loop` was: `generate_all_ordered_combination_that_fit_in_backpack_list_without_duplicates_using_loop`.

### Test

```mbt
test {
  for solve in [solve_v1, solve_v2, solve_v3, solve_v4, solve_v5] {
    assert_eq(solve(items_1, 10).total_value, 21)
  }
}
```

---
slug: intmap
description: 'Implementing IntMap in MoonBit'
image: cover.png
---

# Implementing IntMap in MoonBit

![](./cover.png)

Key-value containers are an essential part of the standard library in modern programming languages, and their widespread use means that the performance of their basic operations is very important. Most key-value containers in functional languages are implemented based on some kind of balanced binary search tree, which performs well in lookup and insertion operations, but poorly when merging two key-value containers. Hash tables, commonly used in imperative languages, are also not good at merging operations.

`IntMap` is an immutable key-value container specialized for integers. It can only use integers as keys, and by sacrificing some generality, it achieves efficient merge/intersection operations. This article will start from the simplest binary trie and gradually improve it to `IntMap`.

## Binary Trie

A binary trie is a binary tree that uses the binary representation of each key to determine its position. The binary representation of a key is a finite string of 0s and 1s. If the current bit is 0, it recurses to the left child; if the current bit is 1, it recurses to the right child.

```mbt
///|
enum BinTrie[T] {
  Empty
  Leaf(T)
  Branch(left~ : BinTrie[T], right~ : BinTrie[T])
}
```

To find the value corresponding to a key in a binary trie, you simply read the binary bits of the key one by one, moving left or right according to their value, until you reach a leaf node.

> Here, the order of reading binary bits is from the least significant bit to the most significant bit of the integer.

```mbt
fn[T] BinTrie::lookup(self : BinTrie[T], key : UInt) -> T? {
  match self {
    Empty => None
    Leaf(value) => Some(value)
    Branch(left~, right~) =>
      if key % 2U == 0 {
        left.lookup(key / 2)
      } else {
        right.lookup(key / 2)
      }
  }
}
```

To avoid creating too many empty trees, we don't directly call the value constructor, but instead use the `branch` method.

```mbt
fn[T] BinTrie::br(left : BinTrie[T], right : BinTrie[T]) -> BinTrie[T] {
  match (left, right) {
    (Empty, Empty) => Empty
    _ => Branch(left~, right~)
  }
}
```

## Patricia Tree

The Patricia Tree stores more information than a binary trie to speed up lookups. At each fork, it retains the _common prefix_ of all keys in the subtree (although here it's calculated from the least significant bit, we still use the term prefix) and marks the current branching bit with an unsigned integer. This greatly reduces the number of branches that need to be traversed during a lookup.

```mbt
///|
enum PatriciaTree[T] {
  Empty
  Leaf(key~ : Int, value~ : T)
  Branch(
    prefix~ : UInt,
    mask~ : UInt,
    left~ : PatriciaTree[T],
    right~ : PatriciaTree[T]
  )
}

///|
fn[T] PatriciaTree::lookup(self : PatriciaTree[T], key : Int) -> T? {
  match self {
    Empty => None
    Leaf(key=k, value~) => if k == key { Some(value) } else { None }
    Branch(prefix~, mask~, left~, right~) =>
      if !match_prefix(key=key.reinterpret_as_uint(), prefix~, mask~) {
        None
      } else if zero(key.reinterpret_as_uint(), mask~) {
        left.lookup(key)
      } else {
        right.lookup(key)
      }
  }
}

///|
fn get_prefix(key : UInt, mask~ : UInt) -> UInt {
  key & (mask - 1U)
}

///|
fn match_prefix(key~ : UInt, prefix~ : UInt, mask~ : UInt) -> Bool {
  get_prefix(key, mask~) == prefix
}

///|
fn zero(k : UInt, mask~ : UInt) -> Bool {
  (k & mask) == 0
}
```

Now the `branch` method can be further optimized to ensure that `Branch` nodes do not contain `Empty` subtrees.

```mbt
///|
fn[T] PatriciaTree::branch(
  prefix~ : UInt,
  mask~ : UInt,
  left~ : PatriciaTree[T],
  right~ : PatriciaTree[T],
) -> PatriciaTree[T] {
  match (left, right) {
    (Empty, right) => right
    (left, Empty) => left
    _ => Branch(prefix~, mask~, left~, right~)
  }
}
```

## Insertion and Merging

Now that the type definitions are established, the next step is to implement the insertion and merging operations. Since an insertion operation can also be viewed as merging a tree with only one leaf node into an existing tree, we will prioritize introducing the implementation of the merge operation.

We first discuss a shortcut: suppose we have two non-empty trees, t0 and t1, whose longest common prefixes are p0 and p1, respectively, and p0 and p1 do not contain each other. In this case, no matter how large t0 and t1 are, the cost of merging them is the same, because only a new `Branch` node needs to be created. We implement this using the helper function `join`.

The `gen_mask` function, which generates a mask, utilizes a property of two's complement representation of integers to find the lowest branching bit.

Assume the binary representation of the input `x` is

```
00100100000
```

Then, `x.lnot()` gives

```
11011011111
```

Adding one gives

```
11011100000
```

After a bitwise AND with the original `x`, we get:

```
00000100000
```

```mbt
///|
fn[T] join(
  p0 : UInt,
  t0 : PatriciaTree[T],
  p1 : UInt,
  t1 : PatriciaTree[T],
) -> PatriciaTree[T] {
  let mask = gen_mask(p0, p1)
  if zero(p0, mask~) {
    PatriciaTree::Branch(prefix=get_prefix(p0, mask~), mask~, left=t0, right=t1)
  } else {
    PatriciaTree::Branch(prefix=get_prefix(p0, mask~), mask~, left=t1, right=t0)
  }
}

///|
fn gen_mask(p0 : UInt, p1 : UInt) -> UInt {
  fn lowest_bit(x : UInt) -> UInt {
    x & (x.reinterpret_as_int().neg().reinterpret_as_uint())
  }

  lowest_bit(p0 ^ p1)
}
```

Everything is ready, and we can now start writing the `insert_with` function. The handling of `Empty` and `Leaf` branches is very straightforward, while for `Branch`, we call `join` when the prefixes do not contain each other, and otherwise, we recursively descend into one of the branches based on the branch bit.

```mbt
///|
fn[T] PatriciaTree::insert_with(
  self : PatriciaTree[T],
  k : Int,
  v : T,
  combine~ : (T, T) -> T,
) -> PatriciaTree[T] {
  fn go(tree : PatriciaTree[T]) -> PatriciaTree[T] {
    match tree {
      Empty => Leaf(key=k, value=v)
      Leaf(key~, value~) as tree =>
        if key == k {
          PatriciaTree::Leaf(key~, value=combine(v, value))
        } else {
          join(
            k.reinterpret_as_uint(),
            Leaf(key=k, value=v),
            key.reinterpret_as_uint(),
            tree,
          )
        }
      Branch(prefix~, mask~, left~, right~) as tree =>
        if match_prefix(key=k.reinterpret_as_uint(), prefix~, mask~) {
          if zero(k.reinterpret_as_uint(), mask~) {
            PatriciaTree::Branch(prefix~, mask~, left=go(left), right~)
          } else {
            PatriciaTree::Branch(prefix~, mask~, left~, right=go(right))
          }
        } else {
          join(k.reinterpret_as_uint(), Leaf(key=k, value=v), prefix, tree)
        }
    }
  }

  go(self)
}
```

Merge operations generally follow the same logic, with the slight difference that they also consider cases where the prefix and mask are identical.

```mbt
///|
fn[T] PatriciaTree::union_with(
  combine~ : (T, T) -> T,
  left : PatriciaTree[T],
  right : PatriciaTree[T],
) -> PatriciaTree[T] {
  fn go(left : PatriciaTree[T], right : PatriciaTree[T]) -> PatriciaTree[T] {
    match (left, right) {
      (Empty, t) | (t, Empty) => t
      (Leaf(key~, value~), t) => t.insert_with(key, value, combine~)
      (t, Leaf(key~, value~)) =>
        t.insert_with(key, value, combine=fn(x, y) { combine(y, x) })
      (
        Branch(prefix=p, mask=m, left=s0, right=s1) as s,
        Branch(prefix=q, mask=n, left=t0, right=t1) as t,
      ) =>
        if m == n && p == q {
          // The trees have the same prefix. Merge the subtrees
          PatriciaTree::Branch(
            prefix=p,
            mask=m,
            left=go(s0, t0),
            right=go(s1, t1),
          )
        } else if m < n && match_prefix(key=q, prefix=p, mask=m) {
          // q contains p. Merge t with a subtree of s
          if zero(q, mask=m) {
            Branch(prefix=p, mask=m, left=go(s0, t), right=s1)
          } else {
            Branch(prefix=p, mask=m, left=s0, right=go(s1, t))
          }
        } else if m > n && match_prefix(key=p, prefix=q, mask=n) {
          // p contains q. Merge s with a subtree of t.
          if zero(p, mask=n) {
            Branch(prefix=q, mask=n, left=go(s, t0), right=t1)
          } else {
            Branch(prefix=q, mask=n, left=t0, right=go(s, t1))
          }
        } else {
          join(p, s, q, t)
        }
    }
  }

  go(left, right)
}
```

## Big-endian Patricia Tree

The Big-endian Patricia Tree changes the order of calculating branching bits from the most significant bit to the least significant bit, building upon the Little-endian Patricia Tree.

What are the benefits of doing this?

- Better locality. In a Big-endian Patricia Tree, integer keys of similar size are placed close to each other.

- Facilitates efficient sequential traversal of keys, simply by implementing a standard pre-order/post-order traversal.

- Merging is often faster. In practice, integer keys in an intmap are usually contiguous. In this case, a Big-endian Patricia Tree will have longer common prefixes, making merge operations faster.

- In a Big-endian Patricia Tree, if keys are treated as unsigned integers, every key in the right subtree is greater than the key of the current node (conversely, the left subtree contains smaller keys). When writing a lookup function, you only need to use unsigned integer comparison to determine which branch to follow next. On most machines, this can be done with a single instruction, which is low-cost.

Since the final version of the `IntMap` implementation is not significantly different from the Little Endian Patricia Tree described earlier, it will not be elaborated on here. Readers who are interested can refer to the implementation in this repository: [https://github.com/moonbit-community/intmap](https://github.com/moonbit-community/intmap)

## A Bug in the Original Implementation

Although the idea behind IntMap's implementation is quite concise and clear, it is still possible to make some very subtle mistakes when writing the specific implementation code. Even the original paper's author was not immune when writing the SML implementation of `IntMap`, and this issue was later inherited by OCaml's `Ptset`/`Ptmap` modules. It wasn't until the paper _QuickChecking Patricia Trees_, published in 2018, that this problem was discovered.

Specifically, because SML and OCaml languages do not provide unsigned integer types, the masks in the `IntMap` type were stored as `int` in the implementations of these two languages. However, when comparing masks in the `union_with` function, they all forgot that unsigned integer comparison should be used.

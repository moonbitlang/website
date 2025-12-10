---
slug: intmap
description: '在MoonBit中实现IntMap'
image: cover.png
---

# 在MoonBit中实现IntMap

![](./cover.png)

键值对容器是现代编程语言必备的标准库成员之一，它应用广泛，所以其基本操作的性能非常重要。函数式语言的键值对容器实现大多基于某种平衡二叉搜索树，这样实现的键值对容器在查找和插入操作上表现优秀，但在需要合并两个键值对容器时表现不佳，命令式语言常用的哈希表也不擅长合并操作。

`IntMap`是一种为整数特化的不可变键值对容器，它只能以整数为键，通过牺牲一定的通用性，它实现了高效的合并/取交集操作。本文将从最朴素的二叉字典树开始，逐步改进到`IntMap`.

## 二叉字典树

二叉字典树是一种使用每个键的二进制表示决定其位置的二叉树，键的二进制表示是一长串有限的0和1，那么假如当前位是0，就向左子树递归，当前位为1则向右子树递归.

```mbt
///|
enum BinTrie[T] {
  Empty
  Leaf(T)
  Branch(left~ : BinTrie[T], right~ : BinTrie[T])
}
```

要在二叉字典树里查找某个键对应的值，只需要依次读取键的二进制位，根据其值选择向左或者向右移动，直到到达某个叶子节点

> 此处读取二进制位的顺序是从整数最小位到最高位

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

为了避免创建过多空树，我们不直接调用值构造子，而是使用branch方法

```mbt
fn[T] BinTrie::br(left : BinTrie[T], right : BinTrie[T]) -> BinTrie[T] {
  match (left, right) {
    (Empty, Empty) => Empty
    _ => Branch(left~, right~)
  }
}
```

## Patricia Tree

Patricia Tree在二叉字典树的基础上保存了更多信息以加速查找,在每个分叉的地方，它都保留子树中所有键的*公共前缀*(虽然此处是从最低位开始计算，但我们仍然使用前缀这种说法)，并用一个无符号整数标记当前的分支位(branching bit).这样一来，查找时需要经过的分支数量大大减少。

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

现在`branch`方法可以做更多优化, 保证`Branch`节点的子树不含`Empty`.

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

## 插入与合并

既然类型定义已经确定，接下来要做的就是实现插入和合并操作。由于插入操作也可以看作将一个只有一个叶节点的树与原本的树合并，所以我们优先介绍合并操作的实现。

我们首先讨论可以走捷径的情况：假设我们有两个非空树t0和t1，它们的最长公共前缀分别为p0和p1且p0和p1互不包含, 那么不管t0和t1有多大，合并它们的成本都是一样的，因为只需要创建一个新的`Branch`节点。我们通过辅助函数`join`来实现。

生成掩码的函数`gen_mask`利用了整数二进制补码的一个特性来寻找最低的分支位。

假设输入`x`的二进制表示为

```
00100100000
```

那么，`x.lnot()`得到

```
11011011111
```

加一得到

```
11011100000
```

跟原来的`x`进行按位与后，得到：

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

万事俱备，现在可以开始编写`insert_with`函数了。对`Empty`和`Leaf`分支的处理都非常直接，而对于`Branch`, 在前缀互不包含时调用join，其他情况则根据分支位选择一个分支递归下去。

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

合并操作基本遵循相同的逻辑，略有不同的是它还要考虑前缀与掩码完全相同的情况。

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

Big-endian Patricia Tree在Patricia Tree的基础上将计算分支位的顺序改成了从最高位到最低位，

这样做有什么好处呢？

- 更好的局部性。在Big-endian Patricia Tree中，大小相近的整数键会被放在邻近的地方。

- 便于高效地按顺序遍历键，只要普通地实现前序/后序遍历即可。

- 常见情况下合并速度更快。在实践中，intmap里的整数键一般是连续的，这种情况下Big-endian Patricia Tree会有更长的公共前缀，让合并操作更快。

- 在Big-endian Patricia Tree中，如果把键看作无符号整数，右子树的每个键都大于当前节点的键(反过来，左子树是小于)。在编写查找函数时，只要使用无符号整数的比较就可判断接下来往哪个分支走，在大多数机器上这只需要一条指令即可完成，成本较低。

由于最终版本`IntMap`的实现与前文所述的Little Endian Patricia Tree相差不大，此处不再赘述，有需要的读者可以参考此仓库中的实现：https://github.com/moonbit-community/intmap

## 原实现中的一处错误

虽然IntMap的实现思路相当简洁明了，但在编写具体的实现代码时还是可能犯一些非常隐蔽的错误，甚至原论文作者在编写`IntMap`的SML实现时也未能幸免，后来又被OCaml的`Ptset`/`Ptmap`模块继承，直到2018年发表的*QuickChecking Patricia Trees*一文中这个问题才被发现。

具体来说，由于SML和OCaml语言没有提供无符号整数类型，在这两种语言的实现中`IntMap`类型里的掩码都通过int存储，但在`union_with`函数中对掩码进行比较时，他们都忘记了应该使用无符号整数的比较。

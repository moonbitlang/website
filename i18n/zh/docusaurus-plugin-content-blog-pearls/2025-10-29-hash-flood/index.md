---
slug: hash-flood
author: Rynco Maekawa
description: '哈希表避坑指南'
image: cover.png
---

# 哈希表避坑指南

![](./cover.png)

> 本文介绍了哈希表的结构，演示了哈希表所面临的一个常见攻击手段——哈希洪泛攻击（hash flooding），以及如何在实践中消除这一攻击。

谁不喜欢哈希表呢？

它能以快如闪电的平均 $O(1)$ 访问速度<sup>\*</sup> 联系键值对，
而你只需要提供两样东西：一个比较相等的函数和一个哈希函数，就这么简单。
这一独特的性质使得哈希表在效率上常常优于其他关联性数据结构（如搜索树）。
因此，哈希表现已成为编程语言中使用最广泛的数据结构之一。

从 Python 中平平无奇的 `dict`，到数据库和分布式系统，
再到 JavaScript 对象，哈希表无处不在。
它们支撑着数据库的索引系统，实现了高效的缓存机制，
并构成了 Web 框架请求路由的骨干。
现代编译器用它们来管理符号表，操作系统靠它们来进行进程管理，
几乎每一个 Web 应用都用它们来维护用户状态。

无论你是在构建 Web 服务器、解析 JSON，
还是在处理配置文件，亦或只是统计词频，
你都很可能会用到哈希表。
它们已经变得如此基础，以至于许多开发者都将它们 $O(1)$ 的魔法视为理所当然——
_但你有没有想过，这个 $O(1)$ 的理所当然<sup>\*</sup>到底是什么呢？_

## 哈希表的内部构造

一个哈希表由两部分组成：
一个桶数组和一个哈希函数。

```mbt
struct MyHashMap[K, V] {
  buckets : Array[Bucket[K, V]]
  hash_fn : (K) -> UInt
}
```

**桶数组**包含了一系列所谓的"桶"。
每个桶都存储着我们插入的一些数据。

**哈希函数** `H` 会为每个键（key）关联一个整数。
这个整数被用来在桶数组中寻找一个索引位置，以存储我们的值。
这个索引通常是通过将该整数与桶数组的大小进行取模运算得出的，
即 `index = H(key) % bucket_array_size`。
哈希表期望这个函数满足两个重要性质：

1. 相同的键总是被转换成相同的数字。即，若 `a == b`，则 `H(a) == H(b)`。

   这个性质确保了，
   我们用某个键存入数据后，
   下次还能用同一个键准确地找到原来的位置。

2. 对于不同的键，哈希函数产生的结果会尽可能均匀地分布在所有可能的结果空间中。

   这个性质确保了不同的键会大概率被转换到不同的整数值，
   因此不太可能被映射到同一个桶中，
   从而保证了检索的效率。

现在你可能会问，如果两个键被映射到了同一个桶，会发生什么呢？
那我们就不得不提哈希冲突了。

## 哈希冲突

当两个键的哈希值相同时，
或者更广义地说，当两个键被映射到同一个桶时，
就发生了哈希冲突。

由于哈希表的一切决策都基于哈希值（或桶索引），
这两个键在哈希表看来就变得一模一样了——
它们应该被放在同一个地方，
但它们本身又并不相等，所以不能互相覆盖。

哈希表的设计者们有几种策略来处理冲突，
这些策略大致可分为两类：

- **链地址法**将这些冲突的键放在同一个桶里。
  现在，每个桶可能包含多个键的数据，而不仅仅是一个。
  当查找一个冲突的键时，
  需要遍历该桶中的所有键。

  ```mbt
  struct ChainingBucket[K, V] {
    values : Array[(K, V)]
  }
  ```

  Java 的 `HashMap` 就是这种方法的一个著名例子。

- **开放地址法**仍然坚持每个桶只放一个键，
  但当键发生冲突时，会使用一种独立的策略来选择另一个桶的索引。
  当查找一个键时，会按照这种策略的顺序进行搜索，
  直到可以确定没有更多可能的匹配项为止。

  ```mbt
  struct OpenAddressBucket[K, V] {
    hash: Int
    key: K
    value: V
  }
  ```

  MoonBit 标准库中的 `Map` 就是这种方法的一个例子。

无论哪种情况，当哈希冲突发生时，
我们都别无选择，只能遍历我们找到的那个桶对应的所有键值对，
来确定我们正在寻找的键是否存在。

为了简单起见，我们以一个使用链地址法的哈希表为例。哈希表的实现看起来大概是这样的：

```mbt
typealias ChainingBucket as Bucket

/// 搜索键存储的位置。
///
/// 返回 `(桶索引, 键在桶中的索引?, 完成的搜索次数)`
fn[K : Eq, V] MyHashMap::search(self : MyHashMap[K, V], key : K) -> (Int, Int?, Int) {
  let hash = (self.hash_fn)(key)
  let bucket = (hash % self.buckets.length().reinterpret_as_uint()).reinterpret_as_int()
  // 结果
  let mut found_index = None
  let mut n_searches = 0
  // 遍历桶中所有的键值对。
  for index, keyvalue in self.buckets[bucket].values {
    n_searches += 1
    if keyvalue.0 == key { // 检查键是否匹配。
      found_index = Some(index)
      break
    }
  }
  return (bucket, found_index, n_searches)
}

/// 插入一个新的键值对。
///
/// 返回完成的搜索次数。
fn[K : Eq, V] MyHashMap::insert(self : MyHashMap[K, V], key : K, value : V) -> Int {
  let (bucket, index, n_searches) = self.search(key)
  if index is Some(index) {
    self.buckets[bucket].values[index] = (key, value)
  } else {
    self.buckets[bucket].values.push((key, value))
  }
  n_searches
}
```

这就是 $O(1)$ 访问魔法背后所附带的条件——
如果我们运气不好，就必须遍历所有东西。
这使得哈希表在最坏情况下的复杂度变成了 $O(n)$，
其中 $n$ 是哈希表中的键的数量。

## 制造一场冲突

对于我们用于哈希表的大多数哈希函数来说，这种冲突的最坏情况是很罕见的。
这意味着我们通常不需要为最坏情况而烦恼，
并且在绝大多数时间里都能享受到 $O(1)$ 的速度。

除非有人，
~~也许是某个心怀恶意的黑客，~~
故意把你推入最坏情况。

一般来说，哈希函数都是确定性的，而且运算速度很快。
所以，即使不去对函数本身进行高级的密码学分析，
我们仍然可以通过暴力破解找到很多会相互冲突的键。[^brute-force]

[^brute-force]:
    顺便提一下，这也类似于比特币挖矿的工作原理：
    找到一个值添加到现有字符串中，
    使得整个内容的哈希值（逐位倒过来之后）模除某个给定值之后的结果等于零。

```mbt
fn find_collision(
  bucket_count : Int,
  target_bucket : Int,
  n_collision_want : Int,
  hash_fn : (String) -> UInt,
) -> Array[String] {
  let result = []
  let bucket_count = bucket_count.reinterpret_as_uint()
  let target_bucket = target_bucket.reinterpret_as_uint()
  for i = 0; ; i = i + 1 {
    // 生成一些字符串键。
    let s = i.to_string(radix=36)
    // 计算哈希值
    let hash = hash_fn(s)
    let bucket_index = hash % bucket_count
    let bucket_index = if bucket_index < 0 {
      bucket_index + bucket_count
    } else {
      bucket_index
    }
    // 检查它是否与我们的目标桶冲突。
    if bucket_index == target_bucket {
      result.push(s)
      if result.length() >= n_collision_want {
        break
      }
    }
  }
  result
}
```

## 哈希洪泛攻击

手握这些会冲突的键，（扮演恶意黑客的）我们现在就可以攻击哈希表，
持续利用其最坏情况下的复杂度。

考虑以下情况：你正在向同一个哈希表中插入键，
但每个键都被映射到同一个桶中。
每次插入时，哈希表都必须遍历桶中所有现有的键，
以确定新键是否已经存在。

第一次插入与 0 个键比较，
第二次与 1 个键比较，第三次与 2 个键比较，
被比较的键的数量随着每次插入线性增长。
对于 $n$ 次插入，被比较的键的总数是：

$$
0 + 1 + \dots + (n - 1) = \frac{n(n - 1)}{2} = \frac{n^2 + n}{2}
$$

这 $n$ 次插入操作总共需要 $O(n^2)$ 次比较才能完成[^acc-quad]，
而平均情况下只需要 $O(n)$ 次比较。
这个操作将比它本应花费的时间长得多。

这种攻击不仅限于插入操作。
每当一个被攻击的键被查找时，
都会比较相同数量的键，
因此每一个本应是 $O(1)$ 的操作现在都变成了 $O(n)$。
这些原本耗时可以忽略不计的哈希表操作现在会变得极其缓慢，
使得攻击者比以前更容易耗尽程序的资源。

[^acc-quad]:
    甚至有一个 Tumblr 博客专门记录编程语言中意料之外的二次方复杂度，
    叫做 [Accidentally Quadratic](https://accidentallyquadratic.tumblr.com/)。
    你甚至可以在
    [这里](https://accidentallyquadratic.tumblr.com/post/153545455987/rust-hash-iteration-reinsertion)
    找到一个与哈希表相关的例子——这个例子几乎算是一次手动引入的哈希洪泛攻击了。

这就是我们所说的**哈希洪泛攻击**（hash flooding attack），
得名于它用冲突的键 “淹没” 了哈希表的同一个桶。

我们可以用我们之前写的哈希表实现来演示这一点：

```mbt
/// 一个通过 Fowler-Noll-Vo 哈希函数实现的简单字符串哈希器。
/// https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
fn string_fnv_hash(s : String) -> UInt {
  // 现实中应该直接在 s 背后的数组上工作，这里为了演示使用了 encode
  let s_bytes = @encoding/utf16.encode(s)
  let mut acc : UInt = 0x811c9dc5
  for b in s_bytes {
    acc = (acc ^ b.to_uint()) * 0x01000193
  }
  acc
}

fn test_attack(
  n_buckets : Int,
  keys : Array[String],
  hash_fn : (String) -> UInt,
) -> Int {
  let map = { buckets: Array::makei(n_buckets, _ => { values: [] }), hash_fn }
  let mut total_searches = 0
  for key in keys {
    total_searches += map.insert(key, 0)
  }
  total_searches
}

test {
  println("演示哈希洪泛攻击")
  let bucket_count = 2048
  let target_bucket_id = 42
  let n_collision_want = 1000

  //
  println("首先，尝试插入不冲突的键。")
  let non_colliding_keys = Array::makei(n_collision_want,
    i => (i * 37).to_string(radix=36))
  let n_compares_nc = test_attack(
    bucket_count, non_colliding_keys, string_fnv_hash,
  )
  println(
    "1000个不冲突键的总比较次数：\{n_compares_nc}",
  )
  println("")

  //
  println("现在，我们希望所有键都冲突到 #\{target_bucket_id} 号桶。")
  let colliding_keys = find_collision(
    bucket_count, target_bucket_id, n_collision_want, string_fnv_hash,
  )
  println("找到了 \{colliding_keys.length()} 个冲突的键。")
  let n_compares_c = test_attack(bucket_count, colliding_keys, string_fnv_hash)
  println(
    "1000个冲突键的总比较次数：\{n_compares_c}",
  )

  //
  let increase = n_compares_c.to_double() / n_compares_nc.to_double()
  println("比较次数增加了 \{increase} 倍")
}
```

上面代码的输出是：

```
演示哈希洪泛攻击
首先，尝试插入不冲突的键。
1000个不冲突键的总比较次数：347

现在，使用冲突的键...
找到了 1000 个冲突的键。
1000个冲突键的总比较次数：499500
比较次数增加了 1439.4812680115274 倍
```

……可以直接看到，现在的插入操作慢了大约 1000 倍！

在现实中，尽管哈希表中的桶数不像我们的例子那样是固定的，
但它们通常遵循一定的增长序列，
比如翻倍或遵循一个预定义的素数列表。
这种增长模式使得桶的数量非常容易预测。
因此，即使攻击者不知道确切的桶数，也能发起哈希洪泛攻击。

## 缓解哈希洪泛攻击

哈希洪泛攻击之所以能奏效，是因为攻击者确切地知道哈希函数是如何工作的，
以及它是如何与键插入哈希表的位置相关联的。
如果我们改变其中任何一个，攻击就不再有效了。

### 带"种子"的哈希函数

到目前为止，最简单的方法是防止攻击者确切地知道哈希算法是如何工作的。
这听起来可能不可能，
但哈希函数的性质实际上**只需要在单个哈希表内部保持一致就行了**！

在哈希表中，我们其实不需要一个可以在任何地方使用的、全局统一的"哈希值"，
因为哈希表压根不在乎表以外洪水滔天，只要表本身保持一致就可以了。
所以，只要简单地在不同的哈希表之间切换哈希函数，
我们就能让攻击者无法预测其行为。

但你可能会说：“可现实世界中的哈希算法不是无限供应的啊！”

其实它可以是。
还记得我们说哈希函数需要将值尽可能均匀地分布在结果空间中吗？
这意味着，对于一个足够好的哈希函数，
输入的微小变化会导致输出的巨大变化（被称为雪崩效应）。
因此，为了给每个哈希表一个独一无二的哈希函数，
我们只需要在输入我们想要哈希的数据之前，
先给它 “喂” 一些该哈希表独有的数据。
这被称为哈希函数的“种子"（seed）。
这样，我们只要通过调整种子的值，就能获得无限供应的不同哈希函数了。

让我们用一个带种子的哈希函数和两个使用不同种子的哈希表来演示一下，哈希种子是如何解决这个问题的：

```mbt
/// FNV 哈希的修改版，允许使用种子。
fn string_fnv_hash_seeded(seed : UInt) -> (String) -> UInt {
  let seed_bytes = seed.to_le_bytes()
  fn string_fnv_hash(s : String) -> UInt {
    let s_bytes = @encoding/utf16.encode(s)
    let mut acc : UInt = 0x811c9dc5
    // 混入种子字节。
    for b in seed_bytes {
      acc = (acc ^ b.to_uint()) * 0x01000193
    }
    // 哈希字符串字节。
    for b in s_bytes {
      acc = (acc ^ b.to_uint()) * 0x01000193
    }
    acc
  }

  string_fnv_hash
}

test {
  println("演示洪水攻击的缓解措施")
  let bucket_count = 2048
  let target_bucket_id = 42
  let n_collision_want = 1000

  // 第一个表使用种子 42。
  let seed1 : UInt = 42
  println("我们使用种子 \{seed1} 来寻找冲突")
  let hash_fn1 = string_fnv_hash_seeded(seed1)
  let colliding_keys = find_collision(
    bucket_count, target_bucket_id, n_collision_want, hash_fn1,
  )
  let n_compares_c = test_attack(bucket_count, colliding_keys, hash_fn1)
  println(
    "使用种子 \{seed1} 时，1000个冲突键的总比较次数：\{n_compares_c}",
  )
  println("")

  // 第二个表使用不同的种子。这次我们用 100
  let seed2 : UInt = 100
  println(
    "现在我们为第二个表使用不同的种子，这次是 \{seed2}",
  )
  let hash_fn2 = string_fnv_hash_seeded(seed2)
  let n_compares_nc = test_attack(bucket_count, colliding_keys, hash_fn2)
  println(
    "对于那些本应在种子 \{seed1} 下冲突的1000个键，现在的总比较次数：\{n_compares_nc}",
  )
}
```

上面程序的输出是：

```
演示洪水攻击的缓解措施
我们使用种子 42 来寻找冲突
使用种子 42 时，1000个冲突键的总比较次数：499500

现在我们为第二个表使用不同的种子，这次是 100
对于那些本应在种子 42 下冲突的1000个键，现在的总比较次数：6342
```

我们可以看到，
在第一个表中冲突的键，在第二个表中不再冲突了。[^mitigation]
因此，我们通过这个简单的技巧成功地缓解了哈希洪泛攻击。

[^mitigation]:
    你可能会注意到，这个数字仍然比我们用随机生成的不冲突键得到的数字要高一些。
    这可能与 FNV 哈希函数的设计并非追求最高质量的输出有关。
    由于两个种子非常接近，结果可能仍然存在一些相似性。
    使用一个更好的哈希函数（甚至是像 [SipHash][] 这样的加密安全哈希函数）
    会大大减少这种影响。

[SipHash]: https://github.com/veorq/SipHash

至于那个让每个哈希表随机化的种子从哪里来……
对于能够访问外部随机源的程序（比如 Linux 的 `/dev/urandom`），
使用它通常是最佳选择。
对于无法访问这类源的程序（比如在 WebAssembly 沙箱中），
在同一个进程中使用相同的种子、不同进程使用不同的种子也是一个方案（Python 就是这么做的）。
甚至于，一个每次请求种子时就自增的简单计数器或许也已经足够了——
对于攻击者来说，猜测已经创建过多少个哈希表仍然是比较困难的一件事。

### 其他选择

Java 使用了另一种解决方案，
当太多的值占据同一个桶时，它会退而求其次，使用一棵二叉搜索树（红黑树）存储它们。
是，这要求键除了可哈希之外，还必须是可比较的，
但现在它保证了 $O(\log n)$ 的最坏情况复杂度，
这总比 $O(n)$ 要好得多。

## 这为什么对我们很重要？

由于哈希表在程序中无处不在，
在一个程序中找到一个你能控制其键的哈希表是极其容易的。
尤其是在 Web 程序中每，
请求头、Cookie、查询参数和 JSON 请求体都是键值对，
并且通常存储在哈希表中，这可能使它们容易受到哈希洪泛攻击。

一个对程序有足够了解（编程语言、框架等）的恶意攻击者，
可以尝试向 Web API 端点发送精心构造的请求负载。
这些请求需要更长的时间来处理，
所以如果一个常规的拒绝服务（DoS）攻击需要每秒 n 个请求才能使服务器瘫痪，
那么哈希洪泛攻击可能只需要小一个数量级的攻击次数就能达到相同的效果。
这使得它对攻击者来说效率高得多。
这种攻击被称为 **哈希拒绝服务（HashDoS）** 攻击。

幸运的是，通过在哈希表中引入一些哪怕是轻微的不可预测模式
（例如每个进程的随机性或带密钥的哈希），
我们就可以使这类攻击变得异常困难，以至于对攻击者不再可行。
此外，由于这种攻击高度依赖于对目标应用的语言、框架、架构和实现的了解，
构造一个攻击本身就已经相当困难了，
而现代的、配置良好的系统则更难被利用。

## 总结

哈希表为我们提供了强大的、平均时间复杂度为常数的访问方式——
然而，这个"常数"的成立，是建立在一些假设之上的，
而这些假设有时会被攻击者打破。
一次有针对性的哈希洪泛攻击会迫使许多键进入同一个桶，
将 $O(1)$ 的操作变成 $O(n)$，
能非常高效地耗尽系统资源。

好消息是，缓解措施既简单又实用：
为你的哈希表引入一些不可预测性，
当仅靠哈希还不够时使用旁路信息，或者当行为看起来不对劲时重新哈希。
有了这些，我们就可以让我们的哈希表既快速又安全。

---
description: 'MoonBit Pearls Vol.03：01背包问题'
slug: knapsack-problem
image: cover.png
tags: [MoonBit, Pearls]
---

# MoonBit Pearls Vol.03：01背包问题

![](./cover.png)

01背包问题是算法竞赛中经典的dp题目。文中总共包含五个版本的代码。从最朴素的枚举法开始，在不断的改进下，最终变成了dp解法。

## 问题定义

有若干个物品，每件物品的有重量`weight`和价值`value`：

```mbt
struct Item {
  weight : Int
  value : Int
}
```

现在，给定一个物品列表`items`，和背包的容量`capacity`。从中选出若干件物品，使得这些物品的总重量不超过背包的容量，且物品的总价值最大。

```mbt
typealias @list.T as List

let items_1 : List[Item] = @list.of([
  { weight: 7, value: 20 },
  { weight: 4, value: 10 },
  { weight: 5, value: 11 },
])
```

以上面的`items_1`为例，假设背包容量是$10$，那么最优的方案是选取后两个物品，占用$4+5=9$的容量，总共有$10+11=21$点价值。

注意，由于我们不能把物品切割，因此<u>优先挑选性价比最高的物品</u>并非正解。例如，在上面的例子中，若选取了性价比最高的物品1，则只有$20$点价值，而此时背包已经放不下其他物品了。

## 问题建模

我们先定义一些基础的对象与操作。

```mbt
//物品的组合，下文简称组合
struct Combination {
  items : List[Item]
  total_weight : Int
  total_value : Int
}

//空的组合
let empty_combination : Combination = {
  items: @list.empty(),
  total_weight: 0,
  total_value: 0,
}

//往组合中添加物品，得到新的组合
fn Combination::add(self : Combination, item : Item) -> Combination {
  {
    items: self.items.add(item),
    total_weight: self.total_weight + item.weight,
    total_value: self.total_value + item.value,
  }
}

//两个组合等效，意思是它们总价值一样
impl Eq for Combination with op_equal(self, other) {
  self.total_value == other.total_value
}

//比较两个组合的大小，就是比较它们总价值的大小
impl Compare for Combination with compare(self, other) {
  self.total_value.compare(other.total_value)
}
```

然后，我们就可以开始思考如何解决问题了。

## 一、朴素的枚举

枚举法是最朴素的方案，我们依照问题的定义，一步一步执行，就能得到答案：

1. 枚举出所有的组合；
2. 过滤出其中有效的组合，也就是那些能装入背包的；
3. 答案是其中总价值最大的那个。

得益于标准库提供的两个函数，我们可以将上面三行文字**一比一**地翻译为MoonBit代码。其中`all_combinations`是我们后续需要实现的函数，它的类型是`(List[Item]) -> List[Combination]`。

```mbt
fn solve_v1(items : List[Item], capacity : Int) -> Combination {
  all_combinations(items)
  .filter(fn(comb) { comb.total_weight <= capacity })
  .unsafe_maximum()
}
```

注意这里使用的是`unsafe_maximum`而不是`maximum`。这是因为空列表列表中没有最大值，`maximum`在这种情况下会返回一个`None`。但我们知道，题目保证答案存在（只要capacity不是负数），所以我们可以改用`unsafe_maximum`。它在输入空列表的情况下直接中断程序，其它情况返回列表中的最大值。

接下来我们去实现枚举的过程。函数`all_combinations`接受一个物品的列表，返回一个组合的列表，其中包含所有能由这些物品构造出的组合。也许你现在没有头绪，这时我们可以先查看一下列表的定义。它大概长这样：

```moonbit skip
enum List[A] {
  Empty
  More(A, tail~ : List[A])
}
```

也就是说，列表分为两种：

1. 第一种是空的列表，叫`Empty`；
2. 第二种是非空的列表，叫`More`，其中包含了第一个元素（`A`）和剩余的部分（`tail~ : T[A]`），剩余部分也是一个列表。

这启示我们按物品列表是否为空来分情况讨论：

- 如果物品列表为空，那么唯一的一种组合方式就是空的组合；
- 否则，一定存在第一个物品`item1`和剩余部分`items_tail`。这种情况下，我们可以：
  1. 先求出不含`item1`的那些组合。这其实就是`items_tail`能凑出的那些组合，可以递归地求出。
  2. 再求出包含`item1`的那些组合。它们与不含`item1`的组合一一对应，只差把`item1`加入其中。
  3. 将这两者合并起来，就是所有`items`能凑出的组合。

例如，当物品列表包含a,b,c三个元素时，答案分为以下两个部分：

| 不含a的部分 | 包含a的部分   |
| ----------- | ------------- |
| \{ \}       | \{ a \}       |
| \{ b \}     | \{ a, b \}    |
| \{ c \}     | \{ a, c \}    |
| \{ b, c \}  | \{ a, b, c \} |

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

通过使用模式匹配（`match`），我们再一次将上面的五行文字**一比一**地翻译成了MoonBit代码。

## 二、提前过滤，仅枚举有效的组合

在第一个版本中，<u>枚举所有组合</u>和<u>过滤出能放入背包的组合</u>是不相干的两个过程。在枚举的过程中，出现了很多无效的组合。这些组合早已放不进背包中，却还在后续的过程中被添加物品。不如早一点过滤它们，避免在它之上不断产生新的无效组合。观察代码，发现无效的组合只会在`.map(_.add(item1))`这一步产生。于是我们可以做出改进：仅向能再装下`item1`的组合添加`item1`。

我们将`all_combinations`改为`all_combinations_valid`，仅返回能装入这个背包的组合。现在枚举和过滤将交替进行。

```mbt
fn all_combinations_valid(
  items : List[Item],
  capacity : Int // 添加一个参数，因为过滤需要知道背包的容量
) -> List[Combination] {
  match items {
    Empty => @list.singleton(empty_combination) // 空的组合自然是有效的
    More(item1, tail=items_tail) => {
      // 我们假设 all_combinations_valid 返回的组合都是有效的（归纳假设）
      let valid_combs_without_item1 = all_combinations_valid(
        items_tail, capacity,
      )
      // 由于添加了过滤，所以它里面的组合都是有效的
      let valid_combs_with_item1 = valid_combs_without_item1
        .filter(fn(comb) { comb.total_weight + item1.weight <= capacity })
        .map(_.add(item1))
      // 两个部分都仅包含有效组合，所以合并后也仅包含有效组合
      valid_combs_with_item1 + valid_combs_without_item1
    }
  }
}
```

**遵循代码的结构进行分类讨论**，很容易证明`all_combinations_valid`的正确性——它返回的所有组合确实都是有效的。

由于`all_combinations_valid`返回的那些组合都是有效的，就不再需要在`solve`中过滤了。我们将`solve`中的`filter`删去。

```mbt
fn solve_v2(items : List[Item], capacity : Int) -> Combination {
  all_combinations_valid(items, capacity).unsafe_maximum()
}
```

## 三、维护升序性质，提前结束过滤

在上个版本中，为了过滤出那些能装下`item1`的组合，我们必须遍历`valid_combs_without_item1`中的每一个组合。

但我们可以发现：如果`item1`没法放入一个组合，那么`item1`一定都无法放入比这个组合总重量更大的那些组合。

这也就是说，如果`valid_combs_without_item1`能按总重量升序排列，那么过滤时就不需要完整地遍历它了。在过滤的过程中，一旦碰到一个放不下`item1`的组合，就可以立刻舍去后续的所有组合。由于这种逻辑很常见，标准库提供了一个叫`take_while`的函数，我们用它替换掉`filter`。

要想让`valid_combs_without_item1`升序排列，可以用排序算法，但这却要遍历整个列表，违背了初衷。因此，我们得采用另一种方案：想办法让`all_combinations_valid`返回的列表是升序的。这需要一次递归的信仰之跃：

```mbt
fn all_combinations_valid_ordered(
  items : List[Item],
  capacity : Int
) -> List[Combination] {
  match items {
    Empty => @list.singleton(empty_combination) // 单元素的列表，自然是升序的
    More(item1, tail=items_tail) => {
      // 我们假设 all_combinations_valid_ordered 返回的列表是升序的（归纳假设）
      let valid_combs_without_item1 = all_combinations_valid_ordered(
        items_tail, capacity,
      )
      // 那么它也是升序的，因为一个升序的列表先截取一部分，再往每个元素加上同样的重量，它们的总重量还是升序的
      let valid_combs_with_item1 = valid_combs_without_item1
        .take_while(fn(comb) { comb.total_weight + item1.weight <= capacity })
        .map(_.add(item1))
      // 现在我们只需要确保合并后也升序，就能衔接上最开始的假设
      merge_keep_order(valid_combs_with_item1, valid_combs_without_item1)
    }
  }
}
```

最后的任务是完成函数`merge_keep_order`，它将两个升序的列表合并为一个升序的列表：

```mbt
fn merge_keep_order(
  a : List[Combination],
  b : List[Combination]
) -> List[Combination] {
  match (a, b) {
    (Empty, another) | (another, Empty) => another
    (More(a1, tail=a_tail), More(b1, tail=b_tail)) =>
      // 如果 a1 比 b1 更轻，而 b 又是升序的，说明
      //   a1 比 b 里所有组合都轻
      // 由于 a 是升序的，所以
      //   a1 比 a_tail 里所有组合都轻
      // 所以 a1 是 a 和 b 中最小的那一个
      if a1.total_weight < b1.total_weight {
        // 我们先递归地合并出答案的剩余部分，再把 a1 加到开头
        merge_keep_order(a_tail, b).add(a1)
      } else { // 同理
        merge_keep_order(a, b_tail).add(b1)
      }
  }
}
```

虽然看起来有点啰嗦，但我还是想提一句：通过**遵循代码结构的分类讨论**，很容易证明`all_combinations_valid_ordered`和`merge_keep_order`的正确性——它确实返回的一个升序的列表。

对于一个升序的列表，它的最大值就是最后一个。于是我们将`unsafe_maximum`替换成`unsafe_last`。

```mbt
fn solve_v3(items : List[Item], capacity : Int) -> Combination {
  all_combinations_valid_ordered(items, capacity).unsafe_last()
}
```

回过头来看，在这一版的改进中，我们似乎并没有得到什么太大的好处，毕竟在合并列表的过程中，我们仍然需要遍历整个列表。最初我也是这么想的，但后来意外地发现`merge_keep_order`的真正作用在下一个版本。

## 四、去除等同重量的冗余组合，达到最优时间复杂度

目前为止，我们进行的都不是时间复杂度层面的优化，但这些优化恰恰为接下来的步骤铺平了道路。现在让我们来考察一下时间复杂度。

在最差情况下（背包很大，全都放得下），组合列表（`all_combinations`的返回值）将最多包含 $2^{物品数量}$ 个元素。这导致整个算法的时间复杂度也是指数级的，因为`all_combinations`会被调用 $物品数量$ 次，而每次都会遍历组合列表。

为了降低时间复杂度，我们就需要降低组合列表的长度。这基于一个观察：如果有两个组合，它们总重量相同，那么总价值更高的那个组合总是比另一个更好。因此，我们不需要在列表中同时保留两者。

如果能排除那些冗余的组合，组合列表的长度将不会超过背包容量（抽屉原理），进而将整个算法的时间复杂度降低到 $\mathcal{O}(物品数量 \times 背包容量)$。观察代码，现在唯一有可能会向列表中引入冗余组合的地方是`merge_keep_order`的`else`分支。为了避免这种情况出现，我们只需要对这个地方进行一点改动：

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
      } else { // 此时 a1 和 b1 一样重，出现冗余，保留总价值更高的那个
        let better = maximum(a1, b1)
        merge_keep_order_and_dedup(a_tail, b_tail).add(better)
      }
  }
}
```

`all_combinations_valid_ordered_nodup`（这是我这辈子写过的名字最长的函数了）和`solve_v4`替换相应部分即可。

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

至此，我们重新发明了01背包问题的dp解法。

## 总结

这篇文章的内容是我某天早上躺在床上的突发奇想，从第一版到第四版代码完全在手机上写成，没有经过任何调试，但却能轻松地保证了正确性。相比传统算法竞赛题解中常见的写法，本文中使用的函数式写法带来了以下优势：

1. 告别循环，使用递归分情况讨论。要想从列表中获取元素，必须使用模式匹配（`match`），这提醒我考虑<u>列表为空时的答案</u>。它相比<u>dp数组的初始值</u>拥有更加明确的含义。
2. 依赖库函数进行遍历。标准库中提供的高阶函数（`filter`、`take_while`、`map`、`maximum`）能替换掉样板化的循环（`for`、`while`），便于读者一眼看出遍历的目的。
3. 声明式编程。第一版的代码是想法的**一比一**地翻译。与其说是在描述一个算法，更像是在**描述这个问题本身**，这保证了第一版的正确性。而随后每次改进都在不影响结果的前提下进行，于是继承了第一版的正确性。

当然，从来就没有银弹。我们需要可读性和效率之间做取舍。函数式的风格固然好理解，但还是有许多优化余地的。进一步的优化方向是将列表替换成数组，再替换成从头到尾只使用两个滚动数组，甚至是只使用一个数组。这可以将空间复杂度优化成 $\mathcal{O}(背包容量)$，但不在本文的讨论范围内。我相信初学者更希望看到的是一个易于理解的代码。

## 附录

### 更多细节优化

利用<u>`items`中物品的顺序不影响结果的总价值</u>这个性质。可以把`all_combinations`转化成尾递归。

另外，`take_while`产生的列表在`map`后马上就被丢弃了，我们可以改用迭代器来避免产生这个一次性列表。

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

### 题外话

1. 在第一版中，`all_combinations(items)`产生的`Combination`甚至比其中的`More`还多一个，堪称链表节点复用大师。
2. 升序还可以换成降序，对应的`take_while`要换成`drop_while`。而改用`Array`后可以通过`binary_search`来寻找下标直接切分。
3. 如果你感兴趣，可以考虑一下怎么把上面的做法拓展到[各种其它的背包问题](https://oi-wiki.org/dp/knapsack/)。
4. `all_combinations_loop`原名：`generate_all_ordered_combination_that_fit_in_backpack_list_without_duplicates_using_loop`。

### 测试

```mbt
test {
  for solve in [solve_v1, solve_v2, solve_v3, solve_v4, solve_v5] {
    assert_eq(solve(items_1, 10).total_value, 21)
  }
}
```

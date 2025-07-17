---
description: 'MoonBit Pearls Vol.04: 用MoonBit探索协同式编程（下篇）'
slug: choreographic-programming-with-moonbit-2
image: cover.png
moonbit:
  deps:
    Milky2018/toolkit: 0.1.4
    Milky2018/moonchor: 0.15.0
  backend: wasm-gc
---

# MoonBit pearls vol.4 用 MoonBit 探索协同式编程（下篇）

![](./cover.png)

本文旨在使用 MoonBit 语言的协同式编程库 moonchor，用多个例子阐释协同式编程的核心思想和基本用法。[上篇文章](https://www.moonbitlang.cn/pearls/choreographic-programming-with-moonbit)中我们提到了如何通过一个书店应用展示moonbit在协同式编程里的实践。

## 案例研究：多副本 KVStore

在本节中，我们将探讨一个更复杂的案例，使用 moonchor 实现多副本的 KVStore。我们依然只使用 moonchor 的核心 API，但会充分利用 MoonBit 的泛型和一等公民函数这两个特性。我们的目的是探索 MoonBit 的强大表达能力可以为协同式编程的带来多大的可能性。

## 基本实现

首先做一些准备工作，定义客户端 Client 和服务器 Server 两个角色：

```moonbit
struct Server {} derive(Eq, Hash, Show)

struct Client {} derive(Eq, Hash, Show)

impl @moonchor.Location for Server with name(_) {
  "server"
}

impl @moonchor.Location for Client with name(_) {
  "client"
}

let server : Server = Server::{  }

let client : Client = Client::{  }
```

要实现一个 KVStore，例如 Redis，我们需要实现最基本的两个接口：get 和 put（对应 Redis 的 get 和 set）。最简单的实现就是用一个 Map 数据结构来存储键值对：

```moonbit
struct ServerState {
  db : Map[String, Int]
}

fn ServerState::new() -> ServerState {
  { db: {} }
}
```

对于 KVStore 而言，get 和 put 请求是客户端通过网络发送过来的，在接收到请求前，我们并不知道具体的请求是什么。所以我们需要定义一个请求类型 `Request`，它包含了请求的类型和参数：

```moonbit
enum Request {
  Get(String)
  Put(String, Int)
} derive(ToJson, FromJson)
```

为了方便，我们的 KVStore 只支持 `String` 类型的键和 `Int` 类型的值。接下来，我们定义一个 `Response` 类型，用于表示服务器对请求的响应：

```moonbit
typealias Int? as Response
```

响应是一个可选的整数。当请求是 `Put` 时，响应是 `None`；当请求是 `Get` 时，响应是键对应的值包裹上一个 `Some`，如果键不存在，则响应为 `None`。

```moonbit
fn handle_request(state : ServerState, request : Request) -> Response {
  match request {
    Request::Get(key) => state.db.get(key)
    Request::Put(key, value) => {
      state.db[key] = value
      None
    }
  }
}
```

我们的目标是定义两个函数 `put` 和 `get` 模拟客户端发起请求的过程。它们要做的事情分别是：

1. 在 Client 处生成请求，包装键值对；
2. 将请求发送给 Server；
3. Server 使用 `handle_request` 函数处理请求；
4. 将响应发送回 Client。

可以看到，`put` 和 `get` 函数的逻辑是相似的，我们可以把 2、3、4 三个过程抽象成一个函数，叫作 `access_server`。

```moonbit
async fn put_v1(
  ctx : @moonchor.ChoreoContext,
  state_at_server : @moonchor.Located[ServerState, Server],
  key : String,
  value : Int
) -> Unit {
  let request = ctx.locally(client, _unwrapper => Request::Put(key, value))
  access_server_v1(ctx, request, state_at_server) |> ignore
}

async fn get_v1(
  ctx : @moonchor.ChoreoContext,
  state_at_server : @moonchor.Located[ServerState, Server],
  key : String
) -> @moonchor.Located[Response, Client] {
  let request = ctx.locally(client, _unwrapper => Request::Get(key))
  access_server_v1(ctx, request, state_at_server)
}

async fn access_server_v1(
  ctx : @moonchor.ChoreoContext,
  request : @moonchor.Located[Request, Client],
  state_at_server : @moonchor.Located[ServerState, Server]
) -> @moonchor.Located[Response, Client] {
  let request_at_server = ctx.comm(client, server, request)
  let response = ctx.locally(server, fn(unwrapper) {
    let request = unwrapper.unwrap(request_at_server)
    let state = unwrapper.unwrap(state_at_server)
    handle_request(state, request)
  })
  ctx.comm(server, client, response)
}
```

这样我们的 KVStore 就完成了。我们可以写一个简单的 choreography 来测试它：

```moonbit
async fn kvstore_v1(ctx : @moonchor.ChoreoContext) -> Unit {
  let state_at_server = ctx.locally(server, _unwrapper => ServerState::new())
  put_v1(ctx, state_at_server, "key1", 42)
  put_v1(ctx, state_at_server, "key2", 41)
  let v1_at_client = get_v1(ctx, state_at_server, "key1")
  let v2_at_client = get_v1(ctx, state_at_server, "key2")
  ctx.locally(client, fn(unwrapper) {
    let v1 = unwrapper.unwrap(v1_at_client).unwrap()
    let v2 = unwrapper.unwrap(v2_at_client).unwrap()
    if v1 + v2 == 83 {
      println("The server is working correctly")
    } else {
      panic()
    }
  })
  |> ignore
}

test "kvstore v1" {
  let backend = @moonchor.make_local_backend([server, client])
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v1, server))
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v1, client))
}
```

这个程序的含义是，分别在 "key1" 和 "key2" 存储两个数字 42 和 41，然后从服务器获取这两个值并检查它们的和是否等于 83。如果有任何一个请求返回 None 或者计算结果不是 83，程序就会 panic。

## 双副本

现在，考虑为 KVStore 增加容错功能。最简单的容错就是构建一个从副本，它与主副本存有相同的数据，并在处理 `Get` 请求时检查主从数据的一致性。

我们为从副本构建一个新的角色：

```moonbit
struct Backup {} derive(Eq, Hash, Show)

impl @moonchor.Location for Backup with name(_) {
  "backup"
}

let backup : Backup = Backup::{  }
```

定义一个函数用于检查一致性：这个函数会检查所有副本的响应是否一致，如果不一致，则 panic。

```moonbit
fn check_consistency(responses : Array[Response]) -> Unit {
  match responses.pop() {
    None => return
    Some(f) =>
      for res in responses {
        if res != f {
          panic()
        }
      }
  }
}
```

其余的大部分内容都不需要修改，只要在 `access_server` 函数中增加对副本的处理即可。新的 `access_server_v2` 的逻辑是，Server 接收到请求后，将请求转发给 Backup；然后 Server 和 Backup 分别处理请求；Backup 处理完请求后发回给 Server，Server 对两个结果进行一致性检验。

```moonbit
async fn put_v2(
  ctx : @moonchor.ChoreoContext,
  state_at_server : @moonchor.Located[ServerState, Server],
  state_at_backup : @moonchor.Located[ServerState, Backup],
  key : String,
  value : Int
) -> Unit {
  let request = ctx.locally(client, _unwrapper => Request::Put(key, value))
  access_server_v2(ctx, request, state_at_server, state_at_backup) |> ignore
}

async fn get_v2(
  ctx : @moonchor.ChoreoContext,
  state_at_server : @moonchor.Located[ServerState, Server],
  state_at_backup : @moonchor.Located[ServerState, Backup],
  key : String
) -> @moonchor.Located[Response, Client] {
  let request = ctx.locally(client, _unwrapper => Request::Get(key))
  access_server_v2(ctx, request, state_at_server, state_at_backup)
}

async fn access_server_v2(
  ctx : @moonchor.ChoreoContext,
  request : @moonchor.Located[Request, Client],
  state_at_server : @moonchor.Located[ServerState, Server],
  state_at_backup : @moonchor.Located[ServerState, Backup]
) -> @moonchor.Located[Response, Client] {
  let request_at_server = ctx.comm(client, server, request)
  let request_at_backup = ctx.comm(server, backup, request_at_server)
  let response_at_backup = ctx.locally(backup, fn(unwrapper) {
    let request = unwrapper.unwrap(request_at_backup)
    let state = unwrapper.unwrap(state_at_backup)
    handle_request(state, request)
  })
  let backup_response_at_server = ctx.comm(backup, server, response_at_backup)
  let response_at_server = ctx.locally(server, fn(unwrapper) {
    let request = unwrapper.unwrap(request_at_server)
    let state = unwrapper.unwrap(state_at_server)
    let response = handle_request(state, request)
    let backup_response = unwrapper.unwrap(backup_response_at_server)
    check_consistency([response, backup_response])
    response
  })
  ctx.comm(server, client, response_at_server)
}
```

和刚才一样，我们可以写一个简单的 choreography 来测试它：

```moonbit
async fn kvstore_v2(ctx : @moonchor.ChoreoContext) -> Unit {
  let state_at_server = ctx.locally(server, _unwrapper => ServerState::new())
  let state_at_backup = ctx.locally(backup, _unwrapper => ServerState::new())
  put_v2(ctx, state_at_server, state_at_backup, "key1", 42)
  put_v2(ctx, state_at_server, state_at_backup, "key2", 41)
  let v1_at_client = get_v2(ctx, state_at_server, state_at_backup, "key1")
  let v2_at_client = get_v2(ctx, state_at_server, state_at_backup, "key2")
  ctx.locally(client, fn(unwrapper) {
    let v1 = unwrapper.unwrap(v1_at_client).unwrap()
    let v2 = unwrapper.unwrap(v2_at_client).unwrap()
    if v1 + v2 == 83 {
      println("The server is working correctly")
    } else {
      panic()
    }
  })
  |> ignore
}

test "kvstore 2.0" {
  let backend = @moonchor.make_local_backend([server, client, backup])
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v2, server) )
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v2, client) )
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v2, backup) )
}
```

## 利用高阶函数抽象复制策略

在双副本实现过程中，出现了一些**耦合的代码**：Server 处理请求、备份请求、检查结果一致性的代码放在了一起。

利用 MoonBit 的高阶函数特性，我们可以把复制策略从具体处理过程中抽象出来。我们分析一下什么是复制策略。复制策略应该包含一个过程，即服务器拿到请求后如何利用各个副本处理它的方式。关键在于，复制策略本身是和请求无关的，应该被从具体请求处理过程中剥离出来。这样的话，我们就能让复制策略成为可替换的部分，便于日后能轻易地在不同的复制策略之间进行切换，或者实现新的复制策略。

当然，真实世界的复制策略是非常复杂的，往往很难清晰地从处理流程中剥离出来。在这个例子中，我们为了简化问题，专注于 moonchor 的编程能力，直接将复制策略定义为 Server 在接收到请求后决定如何处理请求的函数。我们可以用一个类型别名来定义它：

```moonbit
typealias async (@moonchor.ChoreoContext, @moonchor.Located[Request, Server]) -> @moonchor.Located[
  Response,
  Server,
] as ReplicationStrategy
```

接下来，我们就可以简化 `access_server` 的实现了。我们将策略作为参数传递进去：

```moonbit
async fn access_server_v3(
  ctx : @moonchor.ChoreoContext,
  request : @moonchor.Located[Request, Client],
  strategy : ReplicationStrategy
) -> @moonchor.Located[Response, Client] {
  let request_at_server = ctx.comm(client, server, request)
  let response = strategy(ctx, request_at_server)
  ctx.comm(server, client, response)
}

async fn put_v3(
  ctx : @moonchor.ChoreoContext,
  strategy : ReplicationStrategy,
  key : String,
  value : Int
) -> Unit {
  let request = ctx.locally(client, _unwrapper => Request::Put(key, value))
  access_server_v3(ctx, request, strategy) |> ignore
}

async fn get_v3(
  ctx : @moonchor.ChoreoContext,
  strategy : ReplicationStrategy,
  key : String
) -> @moonchor.Located[Response, Client] {
  let request = ctx.locally(client, _unwrapper => Request::Get(key))
  access_server_v3(ctx, request, strategy)
}
```

这样一来，复制策略被成功从处理请求的逻辑中抽象出来了。下面，我们重新实现一遍双副本的复制策略：

```moonbit
async fn double_replication_strategy(
  state_at_server : @moonchor.Located[ServerState, Server],
  state_at_backup : @moonchor.Located[ServerState, Backup],
) -> ReplicationStrategy {
  fn(
    ctx : @moonchor.ChoreoContext,
    request_at_server : @moonchor.Located[Request, Server]
  ) {
    let request_at_backup = ctx.comm(server, backup, request_at_server)
    let response_at_backup = ctx.locally(backup, fn(unwrapper) {
      let request = unwrapper.unwrap(request_at_backup)
      let state = unwrapper.unwrap(state_at_backup)
      handle_request(state, request)
    })
    let backup_response = ctx.comm(backup, server, response_at_backup)
    ctx.locally(server, fn(unwrapper) {
      let request = unwrapper.unwrap(request_at_server)
      let state = unwrapper.unwrap(state_at_server)
      let res = handle_request(state, request)
      check_consistency([unwrapper.unwrap(backup_response), res])
      res
    })
  }
}
```

注意看 `double_replication_strategy` 的函数签名，它返回一个 `ReplicationStrategy` 类型的函数。只要提供两个参数，`double_replication_strategy` 就能构造出一个新的复制策略。至此，我们成功利用高阶函数抽象出了复制策略，这个特性在协同式编程中叫作高阶 choreography。

同样的，我们可以写一个简单的 choreography 来测试它：

```moonbit
async fn kvstore_v3(ctx : @moonchor.ChoreoContext) -> Unit {
  let state_at_server = ctx.locally(server, _unwrapper => ServerState::new())
  let state_at_backup = ctx.locally(backup, _unwrapper => ServerState::new())
  let strategy = double_replication_strategy(state_at_server, state_at_backup)
  put_v3(ctx, strategy, "key1", 42)
  put_v3(ctx, strategy, "key2", 41)
  let v1_at_client = get_v3(ctx, strategy, "key1")
  let v2_at_client = get_v3(ctx, strategy, "key2")
  ctx.locally(client, fn(unwrapper) {
    let v1 = unwrapper.unwrap(v1_at_client).unwrap()
    let v2 = unwrapper.unwrap(v2_at_client).unwrap()
    if v1 + v2 == 83 {
      println("The server is working correctly")
    } else {
      panic()
    }
  })
  |> ignore
}

test "kvstore 3.0" {
  let backend = @moonchor.make_local_backend([server, client, backup])
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v2, server))
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v2, client))
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v2, backup))
}
```

## 利用参数化多态实现角色多态

如果要进一步实现新的复制策略，例如三副本，我们需要定义两个新的 Backup 类型以做区分：

```moonbit
struct Backup1 {} derive(Eq, Hash, Show)

impl @moonchor.Location for Backup1 with name(_) {
  "backup1"
}

let backup1 : Backup1 = Backup1::{  }

struct Backup2 {} derive(Eq, Hash, Show)

impl @moonchor.Location for Backup2 with name(_) {
  "backup2"
}

let backup2 : Backup2 = Backup2::{  }
```

接下来需要修改 `access_server` 的核心逻辑。我们立刻发现了问题，为了让 Backup1 和 Backup2 都处理一遍请求并且得到响应，需要将以下几条语句重复：`let request = unwrapper.unwrap(request_at_backup); let state = unwrapper.unwrap(state_at_backup); handle_request(state, request)`。重复代码是坏味道，应当被抽象出来。此时，moonchor 的「角色作为类型」优势就体现出来了，我们可以利用 MoonBit 的参数化多态，将从副本处理逻辑抽象成一个多态函数 `do_backup`，它接收一个角色类型参数 `B`，表示从副本的角色：

```moonbit
async fn[B : @moonchor.Location] do_backup(
  ctx : @moonchor.ChoreoContext,
  request_at_server : @moonchor.Located[Request, Server],
  backup : B,
  state_at_backup : @moonchor.Located[ServerState, B]
) -> @moonchor.Located[Response, Server] {
  let request_at_backup = ctx.comm(server, backup, request_at_server)
  let response_at_backup = ctx.locally(backup, fn(unwrapper) {
    let request = unwrapper.unwrap(request_at_backup)
    let state = unwrapper.unwrap(state_at_backup)
    handle_request(state, request)
  })
  ctx.comm(backup, server, response_at_backup)
}
```

如此一来，我们就能随心所欲地实现双副本或者三副本的复制策略了。对于三副本策略，只需在 `triple_replication_strategy` 返回的函数内调用 `do_backup` 两次即可：

```moonbit
async fn triple_replication_strategy(
  state_at_server : @moonchor.Located[ServerState, Server],
  state_at_backup1 : @moonchor.Located[ServerState, Backup1],
  state_at_backup2 : @moonchor.Located[ServerState, Backup2]
) -> ReplicationStrategy {
  fn(
    ctx : @moonchor.ChoreoContext,
    request_at_server : @moonchor.Located[Request, Server]
  ) {
    let backup_response1 = do_backup(
      ctx, request_at_server, backup1, state_at_backup1,
    )
    let backup_response2 = do_backup(
      ctx, request_at_server, backup2, state_at_backup2,
    )
    ctx.locally(server, fn(unwrapper) {
      let request = unwrapper.unwrap(request_at_server)
      let state = unwrapper.unwrap(state_at_server)
      let res = handle_request(state, request)
      check_consistency([
        unwrapper.unwrap(backup_response1),
        unwrapper.unwrap(backup_response2),
        res,
      ])
      res
    })
  }
}
```

由于我们成功完成了复制策略和访问过程的分离，`access_server`、`put`、`get` 函数不需要任何修改。让我们对最终的 KVStore 进行测试：

```moonbit
async fn kvstore_v4(ctx : @moonchor.ChoreoContext) -> Unit {
  let state_at_server = ctx.locally(server, _unwrapper => ServerState::new())
  let state_at_backup1 = ctx.locally(backup1, _unwrapper => ServerState::new())
  let state_at_backup2 = ctx.locally(backup2, _unwrapper => ServerState::new())
  let strategy = triple_replication_strategy(
    state_at_server, state_at_backup1, state_at_backup2,
  )
  put_v3(ctx, strategy, "key1", 42)
  put_v3(ctx, strategy, "key2", 41)
  let v1_at_client = get_v3(ctx, strategy, "key1")
  let v2_at_client = get_v3(ctx, strategy, "key2")
  ctx.locally(client, fn(unwrapper) {
    let v1 = unwrapper.unwrap(v1_at_client).unwrap()
    let v2 = unwrapper.unwrap(v2_at_client).unwrap()
    if v1 + v2 == 83 {
      println("The server is working correctly")
    } else {
      panic()
    }
  })
  |> ignore
}

test "kvstore 4.0" {
  let backend = @moonchor.make_local_backend([server, client, backup1, backup2])
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v4, server))
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v4, client))
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v4, backup1))
  @toolkit.run_async(() => @moonchor.run_choreo(backend, kvstore_v4, backup2))
}
```

至此，我们完成了多副本 KVStore 的构建。在这个例子中，我们没有手动使用任何 `send` 和 `recv` 来表达分布式节点间的交互，而是通过 moonchor 的协同式编程能力实现了所有通信和同步过程，避免可能的类型错误、死锁和显式同步问题。

# 结语

在这篇文章中，我们借助 moonchor 体验了协同式编程的魅力，还见识了 MoonBit 强大的表达能力。关于协同式编程的更多细节，可以参考 Haskell 的库 [HasChor](https://github.com/gshen42/HasChor)、[Choral 语言](https://www.choral-lang.org)、[moonchor 的源码](https://github.com/Milky2018/moonchor)。想要自己尝试使用 moonchor，可以通过 `moon add Milky2018/moonchor@0.15.0` 命令安装。

---
description: 'MoonBit Pearls: Choreographic Programming with Moonchor'
slug: choreographic-programming-with-moonbit
image: cover.png
moonbit:
  deps:
    Milky2018/toolkit: 0.1.4
    Milky2018/moonchor: 0.15.0
  backend: wasm-gc
---

# MoonBit Pearls Vol 4: Choreographic Programming with Moonchor

![](./cover.png)

Traditional distributed programming is notoriously painful, primarily because we need to reason about the implicit global behavior while writing the explicit local programs that actually run on each node. This fragmented implementation makes programs difficult to debug, understand, and deprives them of type-checking provided by programming languages. **Choreographic Programming** makes the global behavior explicit by allowing developers to write a single program that requires communication across multiple participants, which is then projected onto each participant to achieve global behavior.

Choreographic programming is implemented in two distinct approaches:

- As a completely new programming language (e.g., Choral), where developers write Choral programs that will be compiled into participant-specific Java programs.
- As a library (e.g., HasChor), leveraging Haskell's type system to ensure static properties of choreographic programming while seamlessly integrating with Haskell's ecosystem.

MoonBit's ​**​functional programming features**​​ and ​​**powerful type system**​​ make it particularly suitable for building choreographic programming libraries.

This article demonstrates the core concepts and basic usage of choreographic programming using MoonBit's moonchor library through several examples.

# Guided Tour: Bookstore Application

Let's examine a bookstore application involving two roles: Buyer and Seller. The core logic is as follows:

1. The buyer sends the desired book title to the seller.
2. The seller queries the database and informs the buyer of the price.
3. The buyer decides whether to purchase the book.
4. If the buyer decides to purchase, the seller deducts the book from inventory and sends the estimated delivery date to the buyer.
5. Otherwise, the interaction terminates.

## Traditional Implementation

Here, we focus on core logic rather than implementation details, using `send` and `recv` functions to represent message passing. In the traditional approach, we need to develop two separate applications for buyer and seller. We assume the following helper functions and types exist:

```moonbit
fn get_title() -> String {
  "Homotopy Type Theory"
}

fn get_price(title : String) -> Int {
  50
}

fn get_budget() -> Int {
  100
}

fn get_delivery_date(title : String) -> String {
  "2025-10-01"
}

enum Role {
  Buyer
  Seller
}

async fn[T] send(msg : T, target : Role) -> Unit {
  ...
}

async fn[T] recv(source : Role) -> T {
  ...
}
```

The buyer's application:

```moonbit
async fn book_buyer() -> Unit {
  let title = get_title()
  send(title, Seller)
  let price = recv(Seller)
  if price <= get_budget() {
    send(true, Seller)
    let delivery_date = recv(Seller)
    println("The book will be delivered on: \{delivery_date}")
  } else {
    send(false, Seller)
  }
}
```

The seller's application:

```moonbit
async fn book_seller() -> Unit {
  let title = recv(Buyer)
  let price = get_price(title)
  send(price, Buyer)
  let decision = recv(Buyer)
  if decision {
    let delivery_date = get_delivery_date(title)
    send(delivery_date, Buyer)
  }
}
```

These two implementations suffer from at least the following issues:

1. **No type safety guarantee**: Note that both `send` and `recv` are generic functions. Type safety is only ensured when the types of sending and receiving messages match; otherwise, runtime errors may occur during (de)serialization. The compiler cannot verify type safety at compile time because it cannot determine which `send` corresponds to which `recv`. Type safety is dependent on the developer not making mistakes.

2. **Potential deadlocks**: If the developer accidentally forgets to write some `send` in the buyer's program, both buyer and seller may wait indefinitely for each other's messages and be stuck. Alternatively, if a buyer's connection is temporarily interrupted during network communication, the seller will keep waiting for the buyer's message. Both scenarios lead to deadlocks.

3. **Explicit synchronization required**: To communicate the purchase decision, the buyer must explicitly send a `Bool` message. Subsequent coordination requires ensuring both buyer and seller follow the same execution path at the `if price <= get_budget()` and `if decision` branches - a property that cannot be guaranteed at compile time.

The root cause of these problems lies in splitting what should be a unified coordination logic into two separate implementations based on implementation requirements. Next, we'll examine how choreographic programming addresses these issues.

## moonchor Implementation

With choreographic programming, we can write the buyer's and seller's logic in **the same function**, which then exhibits **different behaviors** with different parameters when called. We use moonchor's API to define the buyer and seller roles. In moonchor, roles are defined as `trait Location`. To provide better static properties, roles are not only values but also unique types that need to implement the `Location` trait.

```moonbit
struct Buyer {} derive(Show, Hash)

impl @moonchor.Location for Buyer with name(_) {
  "buyer"
}

struct Seller {} derive(Show, Hash)

impl @moonchor.Location for Seller with name(_) {
  "seller"
}

let buyer : Buyer = Buyer::{  }

let seller : Seller = Seller::{  }
```

`Buyer` and `Seller` types don't contain any fields. Types implementing the `Location` trait only need to provide a `name` method that returns a string as the role's identifier. This `name` method is critically important - it serves as the definitive identity marker for roles and provides a final verification mechanism when type checking cannot guarantee type safety. Never assign the same name to different roles, as this will lead to unexpected runtime errors. Later we'll examine how types provide a certain level of safety and why relying solely on types is insufficient.

Next, we define the core logic of the bookstore application, which is referred to as a choreography:

```moonbit
async fn bookshop(ctx : @moonchor.ChoreoContext) -> Unit {
  let title_at_buyer = ctx.locally(buyer, _unwrapper => get_title())
  let title_at_seller = ctx.comm(buyer, seller, title_at_buyer)
  let price_at_seller = ctx.locally(seller, fn(unwrapper) {
    let title = unwrapper.unwrap(title_at_seller)
    get_price(title)
  })
  let price_at_buyer = ctx.comm(seller, buyer, price_at_seller)
  let decision_at_buyer = ctx.locally(buyer, fn(unwrapper) {
    let price = unwrapper.unwrap(price_at_buyer)
    price < get_budget()
  })
  if ctx.broadcast(buyer, decision_at_buyer) {
    let delivery_date_at_seller = ctx.locally(seller, unwrapper => get_delivery_date(
      unwrapper.unwrap(title_at_seller),
    ))
    let delivery_date_at_buyer = ctx.comm(
      seller, buyer, delivery_date_at_seller,
    )
    ctx.locally(buyer, fn(unwrapper) {
      let delivery_date = unwrapper.unwrap(delivery_date_at_buyer)
      println("The book will be delivered on \{delivery_date}")
    })
    |> ignore
  }
}
```

This program is somewhat lengthy, so let's analyze it line by line.

The function parameter `ctx: @moonchor.ChoreoContext` is the context object provided by moonchor to applications, containing all interfaces for choreographic programming on the application side. First, we use `ctx.locally` to execute an operation `get_title()` that only needs to run at the buyer role. The first parameter of `ctx.locally` is the role. The second parameter is a closure where the content is the operation to execute, with the return value being wrapped as the return value of `ctx.locally`. Here, `get_title()` returns a `String`, while `title_at_buyer` has type `@moonchor.Located[String, Buyer]`, indicating this value exists at the buyer role and cannot be used by other roles. If you attempt to use `title_at_buyer` at the seller role, the compiler will report an error stating that Buyer and Seller are not the same type.

Next, the buyer needs to send the book title to the seller, which we implement using `ctx.comm`. The first parameter of `ctx.comm` is the sender role, the second is the receiver role, and the third is the message to send. Here, the return value `title_at_seller` has type `@moonchor.Located[String, Seller]`, indicating this value exists at the seller role. As you might have guessed, `ctx.comm` corresponds precisely to the `send` and `recv` operations. However, here type safety is guaranteed: `ctx.comm` is a generic function that ensures (1) the sent and received messages have the same type, and (2) the sender and receiver roles correspond to the type parameters of the parameter and return types, namely `@moonchor.Located[T, Sender]` and `@moonchor.Located[T, Receiver]`.

Moving forward, the seller queries the database to get the book price. At this step we use the `unwrapper` parameter passed to the `ctx.locally` closure. This parameter is an object for unpacking Located types, whose type signature also includes a role type parameter. We can understand how it works by examining the signature of `Unwrapper::unwrap`: `fn[T, L] Unwrapper::unwrap(_ : Unwrapper[L], v : Located[T, L]) -> T`. This means in `ctx.locally(buyer, unwrapper => ...)`, `unwrapper` has type `Unwrapper[Buyer]`, while `title_at_seller` has type `Located[String, Seller]`, so `unwrapper.unwrap(title_at_seller)` yields a result of type `String`. This explains why we can use `title_at_seller` in the closure but not `title_at_buyer`.

## Knowledge of Choice

Explicit synchronization in the subsequent process is critical. We need a dedicated section to explain that. In choreographic programming, this synchronization is referred to as Knowledge of Choice. In the example above, the buyer needs to know whether to purchase the book, and the seller needs to know the buyer's decision. We use `ctx.broadcast` to implement this functionality.

The first parameter of `ctx.broadcast` is the sender's role, and the second parameter is the message to be shared with all other roles. In this example, both buyer and seller need to know the purchase decision, so the buyer broadcasts this decision `decision_at_buyer` to all participants (here only the seller) via `ctx.broadcast`. Interestingly, the return value of `broadcast` is a plain type rather than a `Located` type, meaning it can be used by all roles directly at the top level without needing to be unwrapped with `unwrapper` in `locally`. This allows us to use MoonBit's native `if` conditional statements for subsequent flows, ensuring both buyer and seller follow the same branch.

As the name suggests, `ctx.broadcast` serves to broadcast a value throughout the entire choreography. It can broadcast not just `Bool` types but any other type as well. Its results can be applied not only to `if` conditions but also to `while` loops or any other scenarios requiring common knowledge.

## Launch Code

How does such a choreography run? moonchor provides the `run_choreo` function to launch a choreography. Currently, due to MoonBit's multi-backend feature, providing stable, portable TCP servers and cross-process communication interfaces presents challenges. Therefore, we'll use coroutines and channels to explore the actual execution process of choreographies. The complete launch code is as follows:

```moonbit
test "Blog: bookshop" {
  let backend = @moonchor.make_local_backend([buyer, seller])
  @toolkit.run_async(() => @moonchor.run_choreo(backend, bookshop, buyer) )
  @toolkit.run_async(() => @moonchor.run_choreo(backend, bookshop, seller) )
}
```

The above code launches two coroutines that execute the same choreography at the buyer and seller respectively. This can also be understood as the `bookshop` function being projected (also called _EPP_, endpoint projection) into two completely different versions: the "buyer version" and "seller version". In this example, the first parameter of `run_choreo` is a `Backend` type object that provides the underlying communication mechanism required for choreographic programming. We use the `make_local_backend` function to create a local backend (not to be confused with MoonBit's multi-backend mentioned earlier), which can run in local processes using the channel API provided by `peter-jerry-ye/async/channel` as the communication foundation. In the future, moonchor will provide more backend implementations, such as HTTP.

# API and Partial Principles

We have gained a preliminary understanding of choreographic programming and moonchor. Next, we will formally introduce the APIs we've used along with some unused ones, while explaining some of their underlying principles.

## Roles

In moonchor, we define roles by implementing the `Location` trait. The trait is declared as follows:

```moonbit
pub(open) trait Location: Show + Hash {
  name(Self) -> String
}
```

The `Location` trait object implements `Eq`:

```moonbit
impl Eq for &Location with op_equal(self, other) {
  self.name() == other.name()
}
```

If two roles' `name` methods return the same string, they are considered the same role; otherwise, they are not. When determining whether a value belongs to a certain role, the `name` method serves as the definitive arbiter. This means values can have the same type but actually represent different roles. This feature is particularly important when handling dynamically generated roles. For example, in the bookstore scenario, there might be multiple buyers, and the seller needs to handle multiple buyer requests simultaneously, dynamically generating buyer roles based on server connections. In this case, the buyer type would be defined as:

```moonbit
struct DynamicBuyer {
  id : String
} derive(Show, Hash)

impl @moonchor.Location for DynamicBuyer with name(self) {
  "buyer-\{self.id}"
}
```

## Located Values

Since values located at different roles may coexist in a choreography, we need a way to distinguish which role each value is located at. In moonchor, this is represented by the `Located[T, L]` type, indicating a value of type `T` located at role `L`.

```moonbit
type Located[T, L]

type Unwrapper[L]
```

`Located Values` are constructed via `ChoreoContext::locally` or `ChoreoContext::comm`. Both functions return a `Located` value.

To use a `Located Value`, we employ the `unwrap` method of the `Unwrapper` object. These concepts have already been demonstrated in the bookstore application example and won't be elaborated further here.

## Local Computation

The most common API we've seen in examples is `ChoreoContext::locally`, which is used to perform a local computation at a specific role. Its signature is as follows:

```moonbit
type ChoreoContext

fn[T, L : Location] locally(
  self : ChoreoContext,
  location : L,
  computation : (Unwrapper[L]) -> T
) -> Located[T, L] {
  ...
}
```

This API executes the `computation` closure at the specified `location` role and wraps the result as a `Located Value`. The `computation` closure takes a single parameter - an unwrapper object of type `Unwrapper[L]`, which is used within the closure to unpack `Located[T, L]` values into `T` types. This API binds computation results to specific roles, ensuring values can only be used at their designated roles. Attempting to use a value at another role or process values from different roles with this unwrapper will trigger compiler errors.

## Communication

The `ChoreoContext::comm` API handles value transmission between roles. Its declaration is as follows:

```moonbit
trait Message: ToJson + @json.FromJson {}

async fn[T : Message, From : Location, To : Location] comm(
  self : ChoreoContext,
  from : From,
  to : To,
  value : Located[T, From]
) -> Located[T, To] {
  ...
}
```

Sending and receiving typically require serialization and deserialization. In moonchor's current implementation, `Json` is the message carrier for convenience. In the future, byte streams may be adopted as a more efficient and universal carrier.

`ChoreoContext::comm` has three type parameters: the message type to send, plus the sender and receiver role types `From` and `To`. These two role types correspond exactly to the method's `from` parameter, `to` parameter, as well as the `value` parameter and return value type. This ensures type safety during message (de)serialization between sender and receiver, and guarantees send/receive operations are properly paired, preventing accidental deadlocks.

## Broadcast

When needing to share a value among multiple roles, we use the `ChoreoContext::broadcast` API to have a role broadcast a value to all other roles. Its signature is as follows:

```moonbit
async fn[T : Message, L : Location] ChoreoContext::broadcast(
  self : ChoreoContext,
  loc : L,
  value : Located[T, L]
) -> T {
  ...
}
```

The broadcast API is similar to the communication API, with two key differences:

1. Broadcast doesn't require specifying receiver roles - it defaults to all roles in the choreography;
2. The broadcast return value isn't a `Located Value`, but rather the message's type.

These characteristics reveal broadcast's purpose: enabling all roles to access the same value, allowing operations on this value at the choreography's top level rather than being confined within `ChoreoContext::locally`. For example, in the bookstore case, both buyer and seller need consensus on the purchase decision to ensure subsequent processes remain synchronized.

## Backend and Execution

The API for running a choreography is as follows:

```moonbit
type Backend

typealias async (ChoreoContext) -> T as Choreo[T]

async fn[T, L : Location] run_choreo(
  backend : Backend,
  choreography : Choreo[T],
  role : L
) -> T {
  ...
}
```

It takes three parameters: a backend, a user-written choreography, and the role to execute. The backend contains the concrete implementation of the communication mechanism, while the execution role specifies where this choreography should run. For example, in previous cases, the buyer's program needs to pass a value of type `Buyer` here, while the seller needs to pass a value of type `Seller`.

moonchor provides a local backend based on coroutines and channels:

```moonbit
fn make_local_backend(locations: Array[&Location]) -> Backend {
  ...
}
```

This function establishes communication channels between all roles specified in the parameters, providing concrete communication implementations - namely the `send` and `recv` methods. The local backend can only be used for monolithic concurrent programs rather than true distributed applications. Well, the backend is pluggable: With other backends implemented based on stable network communication APIs, moonchor can easily be used to build distributed programs.

# (Optional Reading) Case Study: Multi-Replica KVStore

In this section, we'll explore a more complicated case study - implementing a multi-replica KVStore using moonchor. We'll still only use moonchor's core APIs while fully leveraging MoonBit's generics and first-class functions. Our goal is to explore how MoonBit's powerful expressiveness can enhance choreographic programming functionalities.

## Basic Implementation

First, let's prepare by defining two roles: Client and Server:

```moonbit
struct Server {} derive(Hash, Show)

struct Client {} derive(Hash, Show)

impl @moonchor.Location for Server with name(_) {
  "server"
}

impl @moonchor.Location for Client with name(_) {
  "client"
}

let server : Server = Server::{  }

let client : Client = Client::{  }
```

To implement a KVStore like Redis, we need to implement two basic interfaces: get and put (corresponding to Redis's get and set). The simplest implementation uses a Map data structure to store key-value pairs:

```moonbit
struct ServerState {
  db: Map[String, Int]
}

fn ServerState::new() -> ServerState {
  { db: {} }
}
```

For the KVStore, get and put requests are sent by clients over the network. Before receiving requests, we don't know their specific content. Therefore, we need to define a request type `Request` that includes the request type and parameters:

```moonbit
enum Request {
  Get(String)
  Put(String, Int)
} derive(ToJson, FromJson)
```

For convenience, our KVStore only supports `String` keys and `Int` values. Next, we define a `Response` type to represent the server's response to requests:

```moonbit
typealias Int? as Response
```

The response is an optional integer. For `Put` requests, the response is `None`; for `Get` requests, the response is the corresponding value wrapped in `Some`, or `None` if the key doesn't exist.

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

Our goal is to define two functions, `put` and `get`, to simulate the client's request initiation process. Their respective tasks are:

1. Generate the request at the `Client`, wrapping the key-value pair;
2. Send the request to the `Server`;
3. The `Server` processes the request using the `handle_request` function;
4. Send the response back to the `Client`.

As we can see, the logic of `put` and `get` functions is similar. We can abstract the three processes (2, 3, and 4) into a single function called `access_server`.

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

With this, our KVStore implementation is complete. We can write a simple choreography to test it:

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

This program stores two numbers 42 and 41 under "key1" and "key2" respectively, then retrieves these values from the server and verifies their sum equals 83. If any request returns None or the calculation result isn't 83, the program will panic.

## Double Replication

Now, let's enhance the KVStore with fault tolerance. The simplest approach is to create a backup replica that maintains identical data to the primary replica, while performing consistency checks during `Get` requests.

We'll create a new role for the backup replica:

```moonbit
struct Backup {} derive(Hash, Show)

impl @moonchor.Location for Backup with name(_) {
  "backup"
}

let backup : Backup = Backup::{  }
```

Define a function to check consistency: this function verifies whether all replica responses are identical, and panics if inconsistencies are found.

```moonbit
fn check_consistency(responses: Array[Response]) -> Unit {
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

Most other components remain unchanged. We only need to add replica handling in the `access_server` function. The new `access_server_v2` logic works as follows: after receiving a request, the `Server` forwards it to `Backup`; then `Server` and `Backup` process the request separately; after processing, `Backup` sends the response back to `Server`, where `Server` performs consistency checks on both results.

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

As before, we can write a simple choreography to test it:

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

## Abstracting Replication Strategy with Higher-Order Functions

During the double replication implementation, we encountered **coupled code** where server request processing, backup requests, and consistency checking were intertwined.

Using MoonBit's higher-order functions, we can abstract the replication strategy away from the concrete processing logic. Let's analyze what constitutes a replication strategy. It should encapsulate how the server processes requests using replicas after receiving them. The key insight is that the replication strategy itself is request-agnostic and should be decoupled from the actual request handling. This makes the strategy swappable, allowing easy switching between different strategies or implementing new ones in the future.

Of course, real-world replication strategies are far more complicated and often resist clean separation. For this example, we simplify the problem to focus on moonchor's programming capabilities, directly defining the replication strategy as a function determining how the server processes requests after receiving them. We can define it with a type alias:

```moonbit
typealias async (@moonchor.ChoreoContext, @moonchor.Located[Request, Server]) -> @moonchor.Located[
  Response,
  Server,
] as ReplicationStrategy
```

Now we can simplify the `access_server` implementation by passing the strategy as a parameter:

```moonbit
async fn access_server_v3(
  ctx: @moonchor.ChoreoContext,
  request: @moonchor.Located[Request, Client],
  strategy: ReplicationStrategy
) -> @moonchor.Located[Response, Client] {
  let request_at_server = ctx.comm(client, server, request)
  let response = strategy(ctx, request_at_server)
  ctx.comm(server, client, response)
}

async fn put_v3(
  ctx: @moonchor.ChoreoContext,
  strategy: ReplicationStrategy,
  key: String,
  value: Int
) -> Unit {
  let request = ctx.locally(client, _unwrapper => Request::Put(key, value))
  access_server_v3(ctx, request, strategy) |> ignore
}

async fn get_v3(
  ctx: @moonchor.ChoreoContext,
  strategy: ReplicationStrategy,
  key: String
) -> @moonchor.Located[Response, Client] {
  let request = ctx.locally(client, _unwrapper => Request::Get(key))
  access_server_v3(ctx, request, strategy)
}
```

This successfully abstracts the replication strategy from the request handling logic. Below, we reimplement the double replication strategy:

```moonbit
async fn double_replication_strategy(
  state_at_server: @moonchor.Located[ServerState, Server],
  state_at_backup: @moonchor.Located[ServerState, Backup],
) -> ReplicationStrategy {
  fn(
    ctx: @moonchor.ChoreoContext,
    request_at_server: @moonchor.Located[Request, Server]
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

Note the function signature of `double_replication_strategy` - it returns a function of type `ReplicationStrategy`. Given two parameters, it constructs a new replication strategy. This demonstrates using higher-order functions to abstract replication strategies, known as higher-order choreography in choreographic programming.

We can test it with a simple choreography:

```moonbit
async fn kvstore_v3(ctx: @moonchor.ChoreoContext) -> Unit {
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

## Implementing Role-Polymorphism Through Parametric Polymorphism

To implement new replication strategies like triple replication, we need to define two new `Backup` types for differentiation:

```moonbit
struct Backup1 {} derive(Hash, Show)

impl @moonchor.Location for Backup1 with name(_) {
  "backup1"
}

let backup1: Backup1 = Backup1::{}

struct Backup2 {} derive(Hash, Show)

impl @moonchor.Location for Backup2 with name(_) {
  "backup2"
}

let backup2: Backup2 = Backup2::{}
```

Next, we need to modify the core logic of `access_server`. An immediate problem emerges: to have both `Backup1` and `Backup2` process the request and return responses, we'd need to repeat these statements: `let request = unwrapper.unwrap(request_at_backup); let state = unwrapper.unwrap(state_at_backup); handle_request(state, request)`. Code duplication is a code smell that should be abstracted away. Here, moonchor's "roles as types" advantage becomes apparent - we can use MoonBit's parametric polymorphism to abstract the backup processing logic into a polymorphic function `do_backup`, which takes a role type parameter `B` representing the backup role:

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

This enables us to freely implement either double or triple replication strategies. For the triple replication strategy, we simply need to call `do_backup` twice within the function returned by `triple_replication_strategy`:

```moonbit
async fn triple_replication_strategy(
  state_at_server: @moonchor.Located[ServerState, Server],
  state_at_backup1: @moonchor.Located[ServerState, Backup1],
  state_at_backup2: @moonchor.Located[ServerState, Backup2]
) -> ReplicationStrategy {
  fn(
    ctx: @moonchor.ChoreoContext,
    request_at_server: @moonchor.Located[Request, Server]
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

Since we've successfully separated the replication strategy from the access process, the `access_server`, `put`, and `get` functions require no modifications. Let's test the final KVStore implementation:

```moonbit
async fn kvstore_v4(ctx: @moonchor.ChoreoContext) -> Unit {
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

With this, we've completed the multi-replica KVStore implementation. Throughout this example, we never manually used any `send` or `recv` to express distributed node interactions. Instead, we leveraged moonchor's choreographic programming capabilities to handle all communication and synchronization processes, avoiding potential type errors, deadlocks, and explicit synchronization issues.

# Conclusion

In this article, we've explored the elegance of choreographic programming through moonchor while witnessing MoonBit's powerful expressiveness. For deeper insights into choreographic programming, you may refer to Haskell's library [HasChor](https://github.com/gshen42/HasChor), the [Choral language](https://www.choral-lang.org), or [moonchor 的源码](https://github.com/Milky2018/moonchor). To try moonchor yourself, simply install it via the command `moon add Milky2018/moonchor@0.15.0`.

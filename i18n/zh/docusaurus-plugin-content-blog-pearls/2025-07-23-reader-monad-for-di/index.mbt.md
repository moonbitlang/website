---
description: '函数式里的依赖注入：Reader Monad'
slug: reader-monad-for-di
image: cover.png
moonbit:
  deps:
    colmugx/reader: 0.2.1
---

# 函数式里的依赖注入：Reader Monad

经常搞六边形架构的人也知道，为了保持核心业务逻辑的纯粹和独立，我们会把像数据库、外部 API 调用这些“副作用”放在“端口”和“适配器”里，然后通过 DI 的方式注入到应用层。可以说，经典的面向对象和分层架构，离不开 DI。

然后，当我想在 MoonBit 里做点事情的时候，我发现我不能呼吸了。

我们也想讲究一个入乡随俗，但是在 moonbit 这种函数味儿很浓郁的场地，没有类，没有接口，更没有我们熟悉的那一套 DI 容器。那我怎么做 DI？

我当时就在想，软件工程发展到至今已经约 57 年，真的没有在函数式编程里解决 DI 的方法吗？

有的兄弟，有的。只是它在函数式编程里也属于一种 monad：Reader Monad

## 什么是 Monad

普通的函数就像一个流水线，你丢进去一袋面粉，然后直接跑到生产线末端，等着方便面出来。但这条流水线需要自动处理中间的所有复杂情况：

- 没放面粉/“没有下单，期待发货”（null）
- 面团含水量不够把压面机干卡了（抛出异常）
- 配料机需要读取今天的生产配方，比如是红烧牛肉味还是香菇炖鸡味（读取外部配置）
- 流水线末端的打包机需要记录今天打包了多少包（更新计数器）

Monad 就是专门管理这条复杂流水线的“总控制系统”。它把你的数据和处理流程的上下文一起打包，确保整个流程能顺畅、安全地进行下去。

在软件开发中，Monad 这一家子有几个常见的成员：

- Option：处理“可能没有”的情况。盒子里要么有东西，要么是空的
- Result：处理“可能会失败”的情况。盒子要么是绿的（成功），里面装着结果；要么是红的（失败），里面装着错误信息
- State Monad：处理“需要修改状态”的情况。这个盒子在产出结果的同时，还会更新盒子侧面的一个计数器。或者说就是 React 里的 `useState`
- Future(Promise)：处理“未来才有”的情况。这个盒子给你一张“提货单”，承诺未来会把货给你
- **Reader Monad**: **盒子可以随时查阅“环境”，但不能修改它**

## Reader Monad

Reader Monad 的思想，最早可以追溯到上世纪90年代，在 Haskell 这种纯函数式编程语言的圈子里流行起来。当时大家为了坚守“函数纯度”这个铁律（即函数不能有副作用），就必须找到一种优雅的方式来让多个函数共享同一个配置环境，Reader Monad 就是为了解决这个矛盾而诞生的。

如今，它的应用场景已经非常广泛：

- 应用配置管理：用来传递数据库连接池、API密钥、功能开关等全局配置
- 请求上下文注入：在 Web 服务中，把当前登录的用户信息等打包成一个环境，供请求处理链上的所有函数使用
- 实现六边形架构：在六边形（或端口与适配器）架构中，它被用来在核心业务逻辑（Domain/Application Layer）和外部基础设施（Infrastructure Layer）之间建立一道防火墙

简单来说，Reader Monad 就是一个专门处理只读环境依赖的工具。它要解决的就是这些问题：

- 参数钻孔 (Parameter Drilling)：我们不想把一个 Properties 层层传递
- 逻辑与配置解耦：业务代码只关心“做什么”，而不用关心“配置从哪来”。这使得代码非常干净，且极易测试

### 核心方法

一个 Reader 库通常包含以下几个核心部分。

#### Reader::pure

就像是把一颗糖直接放进一个标准的午餐盒里。它把一个普通的值，包装成一个最简单的、不依赖任何东西的 Reader 计算。

`pure` 通常是流水线的打包机，它把你计算出的最终结果（一个普通值）重新放回 Reader “流水线”上，所谓“移除副作用”。

```mbt
typealias @reader.Reader

// `pure` 创建一个不依赖环境的计算
let pure_reader : Reader[String, Int] = Reader::pure(100)

test {
  // 无论环境是什么 (比如 "hello")，结果都是 100
  assert_eq(pure_reader.run("hello"), 100)
}
```

#### Reader::bind

这是流水线的“连接器”。例如把“和面”这一步和“压面”这一步连接起来，并确保它们能连成一条“生产线”。

为什么需要它？ **为了自动化！** 。`bind` 让这个过程全自动，你只管定义好每个步骤，它负责传递。

```mbt
fnalias @reader.ask

// 步骤1: 定义一个 Reader，它的工作是从环境（一个Int）中读取值
let step1 : Reader[Int, Int] = ask()

// 步骤2: 定义一个函数，它接收一个数字，然后返回一个新的 Reader 计算
fn step2_func(n : Int) -> Reader[Int, Int] {
  Reader::pure(n * 2)
}

// 使用 bind 将两个步骤连接起来
let computation : Reader[Int, Int] = step1.bind(step2_func)

test {
  // 运行整个计算，环境是 5
  // 流程: step1 从环境得到 5 -> bind 把 5 交给 step2_func -> step2_func 计算 5*2=10 -> pure(10)
  assert_eq(computation.run(5), 10)
}
```

#### Reader::map

就像是给午餐盒里的三明治换个标签。它只改变盒子里的东西（比如把薄荷塘换成酒心巧克力），但不动午餐盒本身。

很多时候我们只是想对结果做个简单转换，用 `map` 比用 `bind` 更直接，意图更清晰。

```mbt
// `map` 只转换结果，不改变依赖
let reader_int : Reader[Unit, Int] = Reader::pure(5)

let reader_string : Reader[Unit, String] = reader_int.map(n => "Value is \{n}")

test {
  assert_eq(reader_string.run(()), "Value is 5")
}
```

#### ask

`ask` 就像是流水线上的一个工人，随时可以抬头看一眼挂在墙上的“生产配方”。这是我们真正读取环境的唯一手段。

`bind` 只负责在幕后传递，但当你想知道“配方”里到底写了什么时，就必须用 `ask` 把它“问”出来。

```mbt
// `ask` 直接获取环境
let ask_reader : Reader[String, String] = ask()

let result : String = ask_reader.run("This is the environment")

test {
  assert_eq(result, "This is the environment")
}
```

而我们接下来会经常用到的 `asks`，只是对 `ask().map()` 的封装。

## DI 对比 Reader Monad

搞个经典例子：开发一个 `UserService`，它需要一个 `Logger` 来记录日志，还需要一个 `Database` 来获取数据。

普通的 DI 我这里用我第二喜欢的 `TypeScript` 举例：

```typescript
interface Logger {
  info(message: string): void
}
interface Database {
  getUserById(id: number): { name: string } | undefined
}

// 业务类通过构造函数声明其依赖
class UserService {
  constructor(
    private logger: Logger,
    private db: Database
  ) {}

  getUserName(id: number): string | undefined {
    this.logger.info(`Querying user with id: ${id}`)
    const user = this.db.getUserById(id)
    return user?.name
  }
}

// 创建依赖实例并注入
const myLogger: Logger = { info: (msg) => console.log(`[LOG] ${msg}`) }
const myDb: Database = {
  getUserById: (id) => (id === 1 ? { name: 'MoonbitLang' } : undefined)
}

const userService = new UserService(myLogger, myDb)
const userName = userService.getUserName(1) // "MoonbitLang"

// 一般来说我们会用一些库管理注入，不会手动实例化。例如 InversifyJS 亦或者是……Angular
```

而 `Reader Monad` 呢

```mbt
fnalias @reader.asks

struct User {
  name : String
}

trait Logger {
  info(Self, String) -> Unit
}

trait Database {
  getUserById(Self, Int) -> User?
}

struct AppConfig {
  logger : &Logger
  db : &Database
}

fn getUserName(id : Int) -> Reader[AppConfig, String?] {
  asks(config => {
    config.logger.info("Querying user with id: \{id}")
    let user = config.db.getUserById(id)
    user.map(obj => obj.name)
  })
}

struct LocalDB {}

impl Database for LocalDB with getUserById(_, id) {
  if id == 1 {
    Some({ name: "MoonbitLang" })
  } else {
    None
  }
}

struct LocalLogger {}

impl Logger for LocalLogger with info(_, content) {
  println("\{content}")
}

test "Test UserName" {
  let appConfig = AppConfig::{ db: LocalDB::{  }, logger: LocalLogger::{  } }
  assert_eq(getUserName(1).run(appConfig).unwrap(), "MoonbitLang")
}
```

可以发现，`getUserName` 函数同样不持有任何依赖，它只是一个“计算描述”。

这个特性让 Reader Monad 成为了实现六边形架构的天作之合。在六边形架构里，核心原则是 **“依赖倒置”** ——核心业务逻辑不应该依赖具体的基础设施。

`getUserName` 的例子就是最好的体现。`AppConfig` 就是一个 Ports 集合

而 `getUserName` 这个核心业务逻辑，它只依赖 `AppConfig` 这个抽象，完全不知道背后到底是 MySQL 还是 PostgreSQL，还是一个假实现：一个 Mock DB

但它不能解决什么问题？**状态修改。**

Reader Monad 的环境永远是“只读”的。一旦注入，它在整个计算过程中都不能被改变。

如果你需要一个可变的状态，找它的兄弟 State Monad 吧。

也就是说，它的好处很明显：它可以在任意地方**读取**配置；

当然它的坏处也很明显：**它只会读取。**

## 简单的 i18n 工具库

经常搞前端的人都知道，我们如果要搞 i18n，大概率会用上 i18next 这类库。它的核心玩法，通常是把一个 i18n 实例通过 React Context 注入到整个应用里，任何组件想用翻译，直接从 Context 里拿就行。所以这其实也可以是一种依赖注入。

回归初心了属于是，本来寻找 DI(Context) 的目的就是为了给 cli 工具支持 i18n。当然这里只是一个简单的演示。

首先，先安装依赖

```bash
moon add colmugx/reader
```

接着，我们来定义 i18n 库需要的环境和字典类型。

```mbt
typealias String as Locale

typealias String as TranslationKey

typealias String as TranslationValue

typealias Map[TranslationKey, TranslationValue] as Translations

typealias Map[Locale, Translations] as Dict

struct I18nConfig {
  // 这里只是方便演示添加了 mut
  mut lang : Locale
  dict : Dict
}
```

接下来是翻译函数 `t`

```mbt
fn t(key : TranslationKey) -> Reader[I18nConfig, TranslationValue] {
  asks(config => config.dict
    .get(config.lang)
    .map(lang_map => lang_map.get(key).unwrap_or(key))
    .unwrap_or(key))
}
```

完事了，看起来很简单是不是

接下来，假设我们的 CLI 工具需要根据操作系统的 LANG 环境变量来显示不同语言的欢迎信息。

```mbt
fn welcome_message(content : String) -> Reader[I18nConfig, String] {
  t("welcome").bind(welcome_text => Reader::pure("\{welcome_text} \{content}"))
}

test {
  let dict : Dict = {
    "en_US": { "welcome": "Welcome To" },
    "zh_CN": { "welcome": "欢迎来到" },
  }

  // 假设你的系统语言 LANG 是 zh_CN
  let app_config = I18nConfig::{ lang: "zh_CN", dict }
  let msg = welcome_message("MoonbitLang")
  assert_eq(msg.run(app_config), "欢迎来到 MoonbitLang")

  // 切换语言
  app_config.lang = "en_US"
  assert_eq(msg.run(app_config), "Welcome To MoonbitLang")
}
```

欢迎来到 MoonbitLang

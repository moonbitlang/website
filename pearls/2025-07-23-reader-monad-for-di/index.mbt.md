---
description: 'Dependency Injection in FP: The Reader Monad'
slug: reader-monad-for-di
image: cover.png
moonbit:
  deps:
    colmugx/reader: 0.2.1
---

# Dependency Injection in FP: The Reader Monad

Developers familiar with hexagonal architecture know that to keep core business logic pure and independent, we place "side effects" like database calls and external API interactions into "ports" and "adapters." These are then injected into the application layer using Dependency Injection (DI). It's safe to say that classic object-oriented and layered architectures rely heavily on DI.

But when I started building things in MoonBit, I had no idea.

I wanted to follow best practices in a functionally-oriented environment like MoonBit, but with no classes, no interfaces, and no DI containers, how was I supposed to implement DI?

This led me to a crucial question: In a field as mature as software engineering, was there truly no established, functional-native solution for something as fundamental as dependency injection?

The answer is a resounding yes. In the functional world, this solution is a monad: the **Reader Monad**.

## First, What is a Monad?

A Monad can be understood as a "wrapper" or a "context."

Think of a normal function as an assembly line. You put a bag of flour in at one end and expect instant noodles to come out the other. But this simple picture hides the complexities the assembly line has to handle:

- What if there's no flour? (null)
- What if the dough is too dry and jams the machine? (Throwing exceptions)
- The ingredient machine needs to read today's recipe is it beef or chicken flavor? (Reading external configuration)
- The packaging machine at the end needs to log how many packages it has processed today. (Updating a counter)

Monad is the master control system for this complex assembly line. It bundles your data together with the context of the processing flow, ensuring the entire process runs smoothly and safely.

In software development, the Monad family has several common members:

- **Option(Maybe)**: Handles cases where a value might be missing. The box either has something in it or it's empty.
- **Result(Either)**: Handles operations that might fail. The box is either green (success) and contains a result, or it's red (failure) and contains an error.
- **State Monad**: Manages situations that require modifying state. This box produces a result while also updating a counter on its side. Think of React's `useState`.
- **Future (or Promise)**: Deals with values that will exist in the future. This box gives you a "pickup slip," promising to deliver the goods later.
- **Reader Monad**: **The box can consult an "environment" at any time, but it cannot modify it.**

## The Reader Monad

The idea behind the Reader Monad dates back to the 1990s, gaining popularity in purely functional languages like Haskell. To uphold the strict rule of "purity" (i.e., functions cannot have side effects), developers needed an elegant way for multiple functions to share a common configuration environment. The Reader Monad was born to resolve this tension.

And today, its applications are widespread:

- **Application Configuration Management**: Passing around global configurations like database connection pools, API keys, or feature flags.
- **Request Context Injection**: In web services, bundling information like the currently logged-in user into an environment that can be accessed by all functions in the request handling chain.
- **Hexagonal Architecture**: It's used to create a firewall between the core business logic (Domain/Application Layer) and external infrastructure (Infrastructure Layer).

In short, the Reader Monad is a specialized tool for handling read-only environmental dependencies. It solves two key problems:

- **Parameter Drilling**: It saves us from passing a configuration object down through many layers of functions.
- **Decoupling Logic and Configuration**: Business logic cares about _what_ to do, not where the configuration comes from. This keeps the code clean and extremely easy to test.

### The Core API

A Reader library typically includes a few core functions.

#### Reader::pure

This is like placing a value directly into a standard container. It takes an ordinary value and wraps it into the simplest possible Reader computation—one that doesn't depend on any environment. `pure` is often the last step in a pipeline, taking your final calculated result and putting it back into the Reader context, effectively "packaging" it.

```mbt
typealias @reader.Reader

// `pure` creates a computation that ignores the environment.
let pure_reader : Reader[String, Int] = Reader::pure(100)

test {
  // No matter what the environment is (e.g., "hello"), the result is always 100.
  assert_eq(pure_reader.run("hello"), 100)
}
```

#### Reader::bind

This is the "connector" of the assembly line. It links different processing steps together, like connecting the "kneading" step to the "rolling" step to form a complete production line. Its purpose is **sequencing**. `bind` handles the plumbing behind the scenes; you define the steps, and it ensures the output of one computation is passed as the input to the next.

```mbt
fnalias @reader.ask

// Step 1: Define a Reader that reads a value from the environment (an Int).
let step1 : Reader[Int, Int] = ask()

// Step 2: Define a function that takes the result of Step 1
// and returns a new Reader computation.
fn step2_func(n : Int) -> Reader[Int, Int] {
  Reader::pure(n * 2)
}

// Use `bind` to chain the two steps together.
let computation : Reader[Int, Int] = step1.bind(step2_func)

test {
  // Run the entire computation with an environment of 5.
  // Flow: `ask()` gets 5 from the environment -> `bind` passes 5 to `step2_func`
  // -> `step2_func` calculates 5*2=10 -> the result is `pure(10)`.
  assert_eq(computation.run(5), 10)
}
```

#### Reader::map

This is like changing the value inside the container without touching the container itself. It simply transforms the result. Often, we just want to perform a simple conversion on a result, and using `map` is more direct and expresses intent more clearly than using the more powerful `bind`.

```mbt
// `map` transforms the result without affecting the dependency.
let reader_int : Reader[Unit, Int] = Reader::pure(5)

let reader_string : Reader[Unit, String] = reader_int.map(fn(n) {
  "Value is \{n}"
})

test {
  assert_eq(reader_string.run(()), "Value is 5")
}
```

#### ask

`ask` is like a worker on the assembly line who can, at any moment, look up at the "production recipe" hanging on the wall. This is our primary means of actually reading from the environment. While `bind` passes the environment along implicitly, `ask` is what you use when you need to explicitly find out what's written in that recipe.

```mbt
// `ask` retrieves the entire environment.
let ask_reader : Reader[String, String] = ask()
let result: String = ask_reader.run("This is the environment")

test {
  assert_eq(result, "This is the environment")
}
```

A common helper, `asks`, is just a convenient shorthand for chaining `ask` and `map`.

## DI vs. Reader Monad

Let's consider a classic example: developing a `UserService` that needs a `Logger` to record logs and a `Database` to fetch data.

In a traditional DI setup, you might have a `UserService` class that declares its `Logger` and `Database` dependencies in its constructor. At runtime, you create instances of the logger and database and "inject" them when creating the `UserService` instance.

```typescript
interface Logger {
  info(message: string): void
}
interface Database {
  getUserById(id: number): { name: string } | undefined
}

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

const myLogger: Logger = { info: (msg) => console.log(`[LOG] ${msg}`) }
const myDb: Database = {
  getUserById: (id) => (id === 1 ? { name: 'MoonbitLang' } : undefined)
}

const userService = new UserService(myLogger, myDb)
const userName = userService.getUserName(1) // "MoonbitLang"
```

With the Reader Monad, the approach is different. The `getUserName` function doesn't hold any dependencies itself. Instead, it's defined as a "computation description." It declares that it needs an `AppConfig` environment (which contains the logger and database) to run. This function is completely decoupled from the concrete implementations of its dependencies.

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

This characteristic makes the Reader Monad a perfect match for hexagonal architecture. The core principle of this architecture is **Dependency Inversion** — the core business logic should not depend on concrete infrastructure.

The `getUserName` function is a prime example. It only depends on the `AppConfig` abstraction (the "port"), with no knowledge of whether the underlying implementation is MySQL, PostgreSQL, or a mock database for testing.

But what problem can't it solve? **State modification.**

The environment in a Reader Monad is always "read-only." Once injected, it cannot be changed throughout the computation. If you need a mutable state, you'll have to turn to its sibling, the State Monad.

So, the benefit is clear: you can **read** configuration from anywhere in your computation. The drawback is just as clear too: **it can _only_ read.**

## A Simple i18n Utility

Frontend developers are likely familiar with libraries like i18next for internationalization (i18n). The core pattern involves injecting an i18n instance into the entire application using something like React Context. Any component can then access translation functions from this context. This is, in essence, a form of dependency injection.

This brings us back to our original goal: finding a DI pattern to support i18n in a CLI tool. Here’s a simple demonstration.

So first, let's install the dependencies.

```bash
moon add colmugx/reader
```

And then, we define the environment and dictionary types our i18n library will need. The environment, which we can call `I18nConfig`, would hold the current language (e.g., "en_US") and a dictionary. The dictionary would be a map of locales to their respective translation maps, where each translation map holds key-value pairs of translation keys and their translated strings.

```mbt
typealias String as Locale

typealias String as TranslationKey

typealias String as TranslationValue

typealias Map[TranslationKey, TranslationValue] as Translations

typealias Map[Locale, Translations] as Dict

struct I18nConfig {
  // 'mut' is used here for demonstration purposes to easily change the language.
  mut lang : Locale
  dict : Dict
}
```

Next, we create our translation function, `t`. This function takes a translation key as input and returns a `Reader`. This `Reader` describes a computation that, when run, will use `asks` to access the `I18nConfig` from the environment. It will look up the current language, find the corresponding dictionary, and then find the translation for the given key. If anything is not found, it gracefully defaults to returning the original key.

```mbt
fn t(key : TranslationKey) -> Reader[I18nConfig, TranslationValue] {
  asks(config => config.dict
    .get(config.lang)
    .map(lang_map => lang_map.get(key).unwrap_or(key))
    .unwrap_or(key))
}
```

And that's it. The core logic is surprisingly simple.

Now, let's imagine our CLI tool needs to display a welcome message in the language specified by the operating system's `LANG` environment variable.

We can define a `welcome_message` function that takes some content as input. It uses our `t` function to get the translation for the "welcome" key and then uses `bind` to chain another `Reader` computation that combines the translated text with the provided content.

RUN IT

```mbt
fn welcome_message(content : String) -> Reader[I18nConfig, String] {
  t("welcome").bind(welcome_text => Reader::pure("\{welcome_text} \{content}"))
}

test {
  let dict : Dict = {
    "en_US": { "welcome": "Welcome To" },
    "zh_CN": { "welcome": "欢迎来到" },
  }

  // Assuming your system language (LANG) is zh_CN
  let app_config = I18nConfig::{ lang: "zh_CN", dict }
  let msg = welcome_message("MoonbitLang")
  assert_eq(msg.run(app_config), "欢迎来到 MoonbitLang")

  // Switch the language
  app_config.lang = "en_US"
  assert_eq(msg.run(app_config), "Welcome To MoonbitLang")
}
```

And with that, I'd like to say: Welcome to MoonbitLang.

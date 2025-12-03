---
description: "使用 `moonbitlang/async` 编写一个简单的代码智能体"
slug: moonbit-async-code-agent
image: /img/blogs/zh/2025-12-03-moonbit-async-code-agent/cover.png
tags: [MoonBit]
---

# 使用 `moonbitlang/async` 编写一个简单的代码智能体

![](./cover.png)

随着 `moonbitlang/async` 库的发展，我们正在积极探索其应用，例如使用该库实现一个智能体框架 [maria](https://github.com/moonbitlang/maria)。今天我们将演示使用 `moonbitlang/async` 构建一个非常简单的代码智能体。

代码智能体的核心思想非常简单：不断将工具结果发送回 LLM，直到 LLM 停止生成工具调用。下面的伪代码说明了智能体的主循环：

```plaintext
消息队列 <- 用户输入
while 消息队列非空:
    消息 <- 消息队列
    回复 <- 向 LLM 发送消息
    for 回复中的工具调用:
        消息队列 <- 工具调用的结果
```

我们将使用 `moonbitlang/async` 在以下章节中实现这段伪代码。具体来说，

1. 我们将使用 `@http.post` 发送消息到 LLM 接口。
2. 我们将使用 `@fs.read_file` 从文件读取内容。
3. 我们将使用 `@process.collect_output_merged` 来执行外部程序并收集其输出。

## 前置条件

许多 LLM 接口需要身份验证。在本示例中，我们将从环境变量 `MOONBIT_BASE_URL`、`MOONBIT_API_KEY` 和 `MOONBIT_MODEL` 中读取基准 URL、API 密钥和模型名称：

```moonbit check
///|
let env : Map[String, String] = @sys.get_env_vars()

///|
fn get_env_var(name : String) -> String {
  guard env.get(name) is Some(value) else {
    println("Please set \{name} environment variable")
    panic()
  }
  value
}

///|
let api_key : String = get_env_var("MOONBIT_API_KEY")

///|
let base_url : String = get_env_var("MOONBIT_BASE_URL")

///|
let model : String = get_env_var("MOONBIT_MODEL")
```

要以 `.mbt.md` 文件运行本演示，你可以在 shell 中这样设置环境变量：

```sh
export MOONBIT_BASE_URL="https://api.your-llm.com"
export MOONBIT_API_KEY="sk-..."
export MOONBIT_MODEL="anthropic/claude-sonnet-4"
moon test [该文件].mbt.md
```

## MoonBit 异步编程基础

在深入实现代码智能体之前，我们先简要回顾 MoonBit 中的异步编程基础：

1. 所有异步函数调用默认会被隐式 `await`。
2. `moonbitlang/async` 实现 [结构化并发（Structured Concurrency）](https://en.wikipedia.org/wiki/Structured_concurrency) ，这意味着在同一个任务组中启动的所有任务会在任务组退出前完成。

上述两点使得 MoonBit 的异步程序几乎不可能产生僵尸后台任务，并且程序员能够更加容易地理解并分析异步代码的行为。

## 向 LLM 接口发起请求

将消息发送到 LLM 接口并获取响应是实现智能体的第一步。为了实现类型安全的 LLM 请求，我们需要定义 LLM 接口的请求与响应类型。得益于 MoonBit 编译器内置的 derive 功能，我们可以轻松的为这些类型实现 JSON 的序列化与反序列化函数。

```moonbit check
///|
struct Function {
  name : String
  arguments : String
} derive(Show, ToJson, @json.FromJson)

///|
struct ToolCall {
  id : String
  function : Function
} derive(Show, ToJson, @json.FromJson)

///|
struct Request {
  model : String
  messages : Array[Json]
  tools : Array[Tool] // 在下一节中定义
} derive(ToJson)

///|
struct Choice {
  message : Json
} derive(ToJson, @json.FromJson)

///|
struct Response {
  choices : Array[Choice]
} derive(ToJson, @json.FromJson)
```

`moonbitlang/async` 提供了 `@http.post` 用于发送 HTTP POST 请求。我们可以简单地将其包装一下，用来更方便地发送消息到 LLM：

```moonbit check
///|
async fn generate(request : Request) -> Response {
  let (response, body) = @http.post(
    "\{base_url}/chat/completions",
    request.to_json(),
    headers={
      "Authorization": "Bearer \{api_key}",
      "Content-Type": "application/json",
      "Connection": "close",
    },
  )
  guard response.code is (200..=299) else {
    fail("HTTP request failed: \{response.code} \{response.reason}")
  }
  body.json() |> @json.from_json()
}
```

现在，我们可以向 LLM 发送一条简单消息，来测试 `generate` 函数：

```moonbit test(async)
let request = Request::{
  model,
  messages: [{ "role": "user", "content": "你好!" }],
  tools: [],
}
println(generate(request).to_json().stringify(indent=2))
```

运行上面的测试，你应该能看到来自 LLM 的响应，例如：

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "你好！很高兴和你交流。有什么我可以帮助你的吗？",
        "refusal": null,
        "reasoning": null
      }
    }
  ]
}
```

现在，我们已经成功地向 LLM 发送了请求并获取了响应。接下来，我们将展示如何让 LLM 使用工具。

## 定义工具

为了让代码智能体更有用，我们需要通过工具扩展它与外部世界交互的能力。请求体中的 `"tools"` 字段描述了我们向 LLM 提供的工具。一个典型的工具描述包含以下字段：

- `name`：工具名称，将在工具调用中使用。
- `description`：对工具的简短描述。
- `parameters`：描述工具参数的 JSON Schema。本示例中为简化处理，我们只使用 `type`、`properties` 和 `required` 字段。

例如，下面的 JSON 描述了一个名为 `read_file` 的工具：

```json
{
  "name": "read_file",
  "description": "Read a file from local disk",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "The path of the file to read"
      }
    },
    "required": ["path"]
  }
}
```

我们在 MoonBit 中将该工具描述建模为如下结构：

```moonbit check
///|
struct Tool {
  name : String
  description : String
  parameters : Json
  /// 执行工具的函数，不被包含在送给 LLM 的工具描述中
  execute : async (String) -> String
}
```

我们需要手动实现 `Tool` 的 `ToJson` trait，以便将其序列化为 JSON：

```moonbit check
///|
impl ToJson for Tool with to_json(self : Tool) -> Json {
  {
    "type": "function",
    "function": {
      "name": self.name,
      "description": self.description,
      "parameters": self.parameters,
    },
  }
}
```

在本演示中，我们将定义两个简单工具：

- `read_file`：从本地磁盘读取文件。
- `execute_command`：执行一个外部程序。

### `read_file` 工具

使用 `moonbitlang/async` 与文件系统交互非常简单。可以直接使用 `@fs.read_file`/`@fs.write_file` 来进行对文件的读取/写入。对于更加灵活的需求，`moonbitlang/async` 也提供了 `@fs.open` 函数，用户可以传入路径和一些自定义的选项，并在后续调用 `read` / `write` 方法进行 I/O 操作。

我们可以将 `read_file` 工具实现为：

```moonbit check
///|
let read_file_tool : Tool = {
  name: "read_file",
  description: "Read a file from local disk",
  parameters: {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "The path of the file to read",
      },
    },
    "required": ["path"],
  },
  execute: args => {
    guard @json.parse(args) is { "path": String(path), .. } else {
      fail("Invalid arguments for read_file, expected {\"path\": String}")
    }
    @moonbitlang/async/fs.read_file(path).text()
  },
}
```

### `execute_command` 工具

在 `moonbitlang/async` 中实现 `execute_command` 工具也非常简单。我们可以使用 `@process.collect_output_merged` 来执行一个外部程序，并收集其 stdout 和 stderr 输出。对于更高级的需求，我们可以使用 `@process.run` 来启动一个进程，并通过管道（pipe）与其交互。

`execute_command` 工具实现如下：

```moonbit check
///|
let execute_command_tool : Tool = {
  name: "execute_command",
  description: "Execute an external program",
  parameters: {
    "type": "object",
    "properties": {
      "command": { "type": "string", "description": "The command to execute" },
      "arguments": {
        "type": "array",
        "items": { "type": "string" },
        "description": "The arguments to pass to the command",
      },
    },
    "required": ["command", "arguments"],
  },
  execute: arguments => {
    guard @json.parse(arguments)
      is { "command": String(command), "arguments": arguments, .. } else {
      fail(
        "Invalid arguments for execute_command, expected {\"command\": String, \"args\": Array[String]}",
      )
    }
    let arguments : Array[String] = @json.from_json(arguments)
    let (status, output) = @process.collect_output_merged(
      command,
      arguments.map(argument => argument),
    )
    let output = output.text()
    (
      $|Exit status: \{status}
      $|Output:
      $|\{output}
    )
  },
}
```

## 处理工具调用与智能体主循环

在请求中提供工具以后，LLM 通常会在返回的响应中包含工具调用（tool call）：

```mbt test(async)
let request = Request::{
  model,
  messages: [
    { "role": "user", "content": "你能帮我概括一下当前项目吗？" },
  ],
  tools: [read_file_tool, execute_command_tool],
}
println(generate(request).to_json().stringify(indent=2))
```

你可能会看到如下响应：

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "我需要先查看当前项目的文件结构和内容来为您提供概括。让我先查看一下项目目录。",
        "refusal": null,
        "reasoning": null,
        "tool_calls": [
          {
            "id": "toolu_vrtx_01N2tbT57zt6pa4LcSiP58p5",
            "index": 0,
            "type": "function",
            "function": {
              "name": "execute_command",
              "arguments": "{\"command\": \"ls\", \"arguments\": [\"-la\"]}"
            }
          }
        ]
      }
    }
  ]
}
```

如上所示，一个工具调用包含以下字段：

- `id`：工具调用的唯一标识符。
- `index`：工具调用在原始请求中的索引。
- `type`：工具调用的类型（几乎总是 "function"）。
- `function` （仅当 `type` 是 "function" 时存在）：表示要调用的函数的对象，包括其名称和参数。

我们可以使用这些信息来处理工具调用。注意，在把工具调用的结果送给 LLM 之前，应该使用 `tool_call_id` 字段将工具调用与其结果关联起来。

```moonbit check
///|
async fn handle_tool_call(
  tools : Map[String, Tool],
  tool_call : ToolCall,
) -> Json {
  guard tools.get(tool_call.function.name) is Some(tool) else {
    return {
      "role": "tool",
      "content": "Tool not found: \{tool_call.function.name}",
      "tool_call_id": tool_call.id,
    }
  }
  return {
    "role": "tool",
    "content": (tool.execute)(tool_call.function.arguments),
    "tool_call_id": tool_call.id,
  } catch {
    error =>
      {
        "role": "user",
        "content": "Error executing tool \{tool_call.function.name}: \{error}",
      }
  }
}
```

有了处理工具调用的能力后，我们就可以实现智能体的主循环了。我们定义了一个 `Agent` 结构来保存智能体状态，包括工具集合、对话历史和消息队列：

```moonbit check
///|
struct Agent {
  tools : Map[String, Tool]
  conversation : Array[Json]
  mut message_queue : Array[Json]
}
```

然后我们为 `Agent` 实现 `run` 方法，持续处理消息队列中的消息，直到队列为空：

```moonbit check
///|
async fn Agent::run(self : Agent) -> Unit {
  while !self.message_queue.is_empty() {
    // Take all messages from the message queue
    let messages = self.message_queue
    self.message_queue = []

    // Send the messages to LLM endpoint
    let response = generate({
      model,
      messages: [..self.conversation, ..messages],
      tools: self.tools.values().collect(),
    })
    let response = response.choices[0].message

    // Save the response to the conversation history
    self.conversation.push(response)
    if response is { "content": String(content), .. } {
      // Print the assistant's response
      println("Assistant: \{content}")
    }
    let tool_calls : Array[ToolCall] = if response
      is { "tool_calls": tool_calls, .. } {
      @json.from_json(tool_calls)
    } else {
      []
    }

    // Handle tool calls
    for tool_call in tool_calls {
      let message = handle_tool_call(self.tools, tool_call)
      self.message_queue.push(message)
      println("Tool: \{tool_call.function.name}")
      println("Response: \{message.stringify(indent=2)}")
    }
  }
}
```

接下来，我们可以让这个智能体获取当前时间，并把结果告诉我们：

```moonbit test(async)
let agent = Agent::{
  tools: {
    "read_file": read_file_tool,
    "execute_command": execute_command_tool,
  },
  conversation: [],
  message_queue: [],
}
agent.message_queue.push({
  "role": "user",
  "content": "Can you please tell me what time is it now by executing `date`?",
})
agent.run()
```

## 结论

在这篇文档中，我们展示了如何使用 `moonbitlang/async` 构建一个简单的代码智能体。该智能体可以通过调用工具从本地磁盘读取文件并执行外部程序。当然，这只是一个基础示例，市面上的智能体通常会更加复杂，例如会添加更多工具、更优雅地处理错误、实现更复杂的对话流程等。

如果你想了解 `moonbitlang/async` 的更多信息，请参阅[其文档](https://mooncakes.io/docs/moonbitlang/async)。你也可以查看 [maria 项目源码](https://github.com/moonbitlang/maria/tree/main)，了解我们是如何基于 `moonbitlang/async` 构建代码智能体的。

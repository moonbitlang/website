---
description: "Write a Simple Code Agent using moonbitlang/async"
slug: moonbit-async-code-agent
image: /img/blogs/2025-12-03-moonbit-async-code-agent/cover.png
tags: [MoonBit]
---

# Write a Simple Code Agent using moonbitlang/async

As the development of `moonbitlang/async` library, we are actively exploring its
application by developing a agent framework
[maria](https://github.com/moonbitlang/maria). Today, we will demonstrate how to
build a very simple code agent using `moonbitlang/async`.

The core idea of code agents is extremely simple: send tool results back to LLM
until the LLM stops generating tool calls. The following pseudo code illustrates
the main loop for such code agent:

```plaintext
message_queue <- user input
while message_queue is not empty:
    messages <- message_queue
    response <- send the messages to LLM endpoint
    for each tool call in the response:
        message_queue <- response of the tool call
```

We will implement this pseudo code using `moonbitlang/async` library in the
following sections. Specifically,

1. We will use `@http.post` to send messages to LLM endpoint.
2. We will use `@fs.read_file` to read content from files as `String`.
3. We will use `@process.collect_output_merged` to execute external programs and
   collect their output.

## Prerequisites

LLM endpoints often require authentication. In this demonstration, we will use
OpenAI-compatible API, and read the base URL, API key, and model name from
environment variable `MOONBIT_BASE_URL`, `MOONBIT_API_KEY`, and `MOONBIT_MODEL`.

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

To run this demonstration as a `.mbt.md` file, you can set the environment
variables in your shell like this:

```sh
export MOONBIT_BASE_URL="https://api.your-llm.com"
export MOONBIT_API_KEY="sk-..."
export MOONBIT_MODEL="anthropic/claude-sonnet-4"
moon test [this-file].mbt.md
```

## Basics of Async Programming in MoonBit

Before we dive into the implementation of the code agent, let's briefly review
the basics of async programming in MoonBit:

1. All async function call are `await`ed implicitly by default.
2. The `moonbitlang/async` library implements structural concurrency, which
   means all tasks spawned with-in a task group will completed before the task
   group exits.

The two features above makes it almost impossible to create zombie tasks in
background, and make it easier to reason about the code.

## Requesting to LLM Endpoint

The first step of our code agent is to send messages to LLM endpoint and get the
response. To make a type-safe request to LLM endpoint, we need to define the
request and response types. We can easily derive the `ToJson` and `FromJson`
traits for these types to serialize and deserialize them to/from JSON.

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
  tools : Array[Tool] // Defined in the next section
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

`moonbitlang/async` provides `@http.post` to send HTTP POST requests, and we can
build a simple wrapper function to easily send messages to LLM endpoint:

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

We can now test our `generate` function by sending a simple message to LLM
endpoint:

```moonbit test(async)
let request = Request::{
  model,
  messages: [{ "role": "user", "content": "Hello!" }],
  tools: [],
}
println(generate(request).to_json().stringify(indent=2))
```

By running the test block above, you should see a response from the LLM endpoint
like this:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! Is there anything I can help you with?",
      }
    }
  ]
}
```

You will notice that the response contains no `tool_calls` field, as we have not
yet asked LLM to use any tools. In the next section, we will demonstrate how to
ask LLM to use tools.

## Defining Tools

For a code agent to be useful, we need to extend its capabilities by providing
tools for it to interact with the external world. The `"tools"` field in the
request body describes the tools we provide to LLM. A typical tool description
features the following fields:

- `name`: the name of the tool, which will be used in the tool calls
- `description`: a brief description of the tool
- `parameters`: a JSON Schema describing the parameters of the tool. For
  simplicity, we will only use `type`, `properties` and `required` fields in
  this demonstration.

For example, the following JSON describes a tool named `read_file`:

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

which can be modeled in MoonBit as:

```moonbit check
///|
struct Tool {
  name : String
  description : String
  parameters : Json
  /// Functions to execute the tool, not included in the tool description sent
  /// to LLM
  execute : async (String) -> String
}
```

We need to manually implement `ToJson` for `Tool` struct to serialize it to JSON:

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

In this demonstration, we will define two simple tools using the `Tool` struct
defined above:

- `read_file`: read a file from local disk
- `execute_command`: execute an external program

### `read_file` Tool

Interacting with the file system is straightforward using `moonbitlang/async`.
We can just use `@fs.read_text_file` to read a file from local disk, and
`@fs.write_text_file` to write a file to local disk. For advance usage, one can
also use `@fs.open` to supply custom options when opening a file and use `read`
and `write` methods to perform file I/O.

The `read_file` tool can be easily implemented using `@fs.read_text_file`:

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

### `execute_command` Tool

Spawning subprocesses using `moonbitlang/async` is also straightforward. We can
use utilities functions like `@process.collect_output_merged` to conveniently
capture and merge the output of an external program. For advanced usage, one can
also use `@process.run` to manually manage the stdin, stdout and stderr of the
spawned subprocess.

We can easily build our `execute_command` tool using
`@process.collect_output_merged`:

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

## Handling Tool Calls and Agent Loop

If we provide tools in the request, LLM can call these tools by generating tool
calls. We can test this by sending a request with tools to LLM endpoint:

```moonbit test(async)
let request = Request::{
  model,
  messages: [
    { "role": "user", "content": "Can you please summarize current project?" },
  ],
  tools: [read_file_tool, execute_command_tool],
}
println(generate(request).to_json().stringify(indent=2))
```

You might see a response like this:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "I'd be happy to help summarize the current project! To do that, I'll need to explore the project directory to understand its structure and contents. Let me start by checking what files and directories are present.",
        "refusal": null,
        "reasoning": null,
        "tool_calls": [
          {
            "id": "toolu_vrtx_01WKLtRMr8XnR3vkEUabkKFZ",
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

As you can see, the tool call contains the following fields:

- `id`: A unique identifier for the tool call.
- `index`: The index of the tool call in the original request.
- `type`: The type of the tool call (e.g., `"function"`).
- `function` (exists only if `type` is `"function"`): An object representing the function to call, including its name and arguments.

We can use this information to handle tool calls. Note that the response
of a tool call should be mapped back to the original tool call using the `id`
field.

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

With the ability to handle tool calls, we can now implement the main loop of our
agent. We will define an `Agent` struct to hold the state of the agent, including
the tools, the conversation history, and the message queue:

```moonbit check
///|
struct Agent {
  tools : Map[String, Tool]
  conversation : Array[Json]
  mut message_queue : Array[Json]
}
```

Then we can implement the `run` method for the `Agent` struct, which
continuously processes messages in the message queue until it is empty:

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

We can now test our agent by asking it to summarize a file and tell the current
time:

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
  "content": "Can you please tell me what time is it now?",
})
agent.run()
```

## Conclusion

In this demonstration, we have shown how to build a simple Code Agent using
`moonbitlang/async`. The agent can read files from local disk and execute
external programs by calling tools defined in the code. This is just a basic
example, and there are many ways to extend and improve the agent, such as adding
more tools, handling errors more gracefully, and implementing more complex
conversation flows.

For more information about `moonbitlang/async`, please refer to [their
documentation](https://mooncakes.io/docs/moonbitlang/async). You can also check
out the [source code of the maria
project](https://github.com/moonbitlang/maria/tree/main) to see a more advanced
code agent built upon top of `moonbitlang/async`.

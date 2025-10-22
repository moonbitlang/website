---
moonbit:
  deps:
    moonbitlang/async: 0.10.0
  backend:
    native
---

# Write a HTTP file server in MoonBit

![](./cover.png)

In this article, I will introduce MoonBit's async programming support and the `moonbitlang/async` library by writing a simple HTTP file server.
If you have experience with the Python language before,
you may know that Python has a very convenient builtin HTTP server module.
You can launch a HTTP file server sharing current directory by
running `python -m http.server` from the command line, which is useful for LAN file sharing.
In this article, we will write a program with similar functionality in MoonBit,
and learn about MoonBit's async programming support.
We will implement an extra useful functionality absent in `python -m http.server`:
downloading the whole directory as a `.zip` file.

## A brief history of async programming
Async programming enables programs to perform multiple tasks at the same time.
For example, for a file server, there may be many users accessing the server at the same time.
The server needs to serve all users at the same time
while making the experience of every user as fluent as possible.
In a typical async program, such as a server,
most time is spent on waiting for IO operations in a single task,
and only a small portion of time is spent on actual computation.
So, we don't really need a lot of computation power to handle a lot of tasks.
The key here is to switch frequently between tasks:
if a task starts waiting for IO, don't process it anymore,
switch to a task that is immediately ready instead.

In the past, async programming is usually implemented via multi-threading.
Every task in the program corresponds to a operating system thread.
However, OS threads are resource heavy, the context switch between OS threads is expensive, too.
So, today, async programming is usually implemented via *event loops*.
In an event loop based async program, the whole is structured as a big loop.
In every iteration of the loop, the program check for a list of completed IO operations,
and resume the tasks blocked on these IO operations,
until they issue another IO request and enter waiting state again.
In this programming paradigm,
the context switch between tasks happens in the user space, on a single OS thread.
So the cost of switching between tasks is very cheap.

Although event loop solves the performance problem,
it is very painful to code event loop based program manually.
The code of a single task need to be splitted into multiple iterations of the event loop,
damaging the readability of program logic significantly.
Fortunately, like most other modern programming languages,
MoonBit provides native async programming support.
Users can write async code just like normal, synchronous code.
The MoonBit compiler will automatically split async code into multiple parts,
while the `moonbitlang/async` library provides the event loop, various IO primitives,
and a scheduler that actually runs the async code.

## Async programming in MoonBit

In MoonBit, you can declare an async function using the `async fn` syntax.
Async functions look exactly the same as normal, synchronous functions,
except that thay may be interrupted in the middle at run time,
so that the program can switch between multiple tasks.

Unlike most other languages,
MoonBit doesn't need special marks such as `await` when calling async functions.
The compiler will automatically infer which function calls are async.
However, if you read async MoonBit code in a IDE or text editor that supports MoonBit,
you can see async function calls rendered in *italic* style,
and function calls that may raise error rendered with underline.
So, you can still easily find out all async function calls when reading code.

For async programming, it is also necessary to have an event loop,
a task scheduler and various IO primitives.
In MoonBit, these are implemented via the `moonbitlang/async` library.
`moonbitlang/async` provides support for async primitives such as network IO, file IO and process creation,
as well as a lot of useful task management facilities.
In the following parts,
We will learn about various features of `moonbitlang/async` while writing the HTTP file server.

## The structure of a HTTP server

The structure of a typical HTTP server is:

- the server listen on a TCP socket, waiting for incoming connections from users
- after accepting a TCP connection from a user,
  the server read the user's request from the TCP connection,
  process it, and send the result back to the user.

Every task described above must be performed asynchronously:
when performing the request from the first user,
the server should still keep waiting for new connections,
and react to the connection request of the next user.
If many users connect to the server at the same time,
the server should handle the requests from all users in parallel.
When handling user requests, all time consuming operations,
such as network IO and file IO, should be asynchronous:
they should not block the program and affect the handling of other tasks.

`moonbitlang/async` provides a helper function `@http.run_server`,
which automatically setup a HTTP server and run it:

```moonbit
async fn server_main(path~ : String, port~ : Int) -> Unit {
  @http.run_server(@socket.Addr::parse("[::]:\{port}"), fn (conn, addr) {
    @pipe.stderr.write("received new connection from \{addr}\n")
    handle_connection(path, conn)
  })
}
```

`server_main` accepts two parameters.
`path` is the directory to serve, and `port` is the port to listen on.
In `moonbitlang/async`, all async code are cancellable,
and cancellation is performed by raising an error in cancelled code.
So, MoonBit assumes all `async fn` may raise error by default,
eliminating the need for explicitly marking `async fn` with `raise`.

In `server_main`, we use `@http.run_server` to create a HTTP server and run it.
`@http` is the default alias for `moonbitlang/async/http`,
which provides HTTP support for `moonbitlang/async`.
The first parameter of `@http.run_server` is the address to listen,
here we ask the server to listen on `[::]:port`,
which means listening on `port` on any network interface.
`moonbitlang/async` provides native IPv4/IPv6 dual stack support,
so the server here can accept both IPv4 connections and IPv6 connections.
The second parameter of `@http.run_server` is a callback function used for handling client request.
The callback function receives two parameters,
the first one is the connection from the user,
represented using the type `@http.ServerConnection`.
The connection is created automatically by `@http.run_server`.
The second parameter of the callback function is the network address of the user.
Here, we use a function `handle_connection` to handle the request,
the implementation of `handle_connection` will be given later.
`@http.run_server` will automatically create a new task,
and run `handle_connection` in the new task.
So, the server may run multiple instances `handle_connection` in parallel,
handling multiple user connections at the same time.

## Handle user request

Now, let's implement the `handle_connection` function.
`handle_connection` accepts two parameters:
`base_path` is the directory being served, and `conn` is the connection from the user.
The implementation of `handle_connection` is as follows:

```moonbit
async fn handle_connection(
  base_path : String,
  conn : @http.ServerConnection,
) -> Unit {
  for {
    let request = conn.read_request()
    conn.skip_request_body()
    guard request.meth is Get else {
      conn
      ..send_response(501, "Not Implemented")
      ..write("This request is not implemented")
      ..end_response()
    }
    let (path, download_zip) = match request.path {
      [ ..path, .."?download_zip" ] => (path.to_string(), true)
      path => (path, false)
    }
    if download_zip {
      serve_zip(conn, base_path + path)
    } else {
      let file = @fs.open(base_path + path, mode=ReadOnly) catch {
        _ => {
          conn
          ..send_response(404, "NotFound")
          ..write("File not found")
          ..end_response()
          continue
        }
      }
      defer file.close()
      if file.kind() is Directory {
        if download_zip {
        } else {
          serve_directory(conn, file.as_dir(), path~)
        }
      } else {
        server_file(conn, file, path~)
      }
    }
  }
}
```

In `handle_connection`,
the program read requests from the user connection and handle them in a big loop.
In every iteration,
we first read the next request from the user via `conn.read_request()`.
`conn.read_request()` will only read the header part of a HTTP request,
in order to allow streaming read for large body in user request.
Since our file server only handles `GET` request, the body of requests is irrelevant.
So, we use `conn.skip_body()` to skip the body of user request,
so that the content of the next request can be processed normally.

If we meet a request that is not `GET`, the `else` block of `guard` statement will be executed.
Code after the `guard` statement will be skipped, and the program will enter the next iteration directly and handle the next request.
In the `else` block, we use `conn.send_response(..)` to send a "NotImplemented" response back to the user.
`conn.send_response(..)` will only send the header part of the response.
After `send_response`, we use `conn.write(..)` to write the body of the response to the connection.
After writing all desired contents,
we use `conn.end_response()` to tell the library that the response body has completed.

Here, we want to implement a useful feature absent in `python -m http.server`:
download the whole directory as a zip file.
If the requested URL has the shape `/path/to/directory?download_zip`,
we package `/path/to/directory` into a `.zip` file and send it to the user.
This feature is implemented using the `serve_zip` function to be given later.

Since we are implementing a file server,
the requested path in users' `GET` request will map to file system path under `base_path` directly.
`@fs` is the default alias of `moonbitlang/async/fs`,
the package for file system IO support in `moonbitlang/async`.
Here, we use `@fs.open` to open the requested file.
In the `@fs.open` operation fails, we send the user a 404 response, notifying the user that the requested file does not exist.

If the requested file is successfully opened, we need to send its content to the user.
Before that, we use `defer file.close()` to ensure that the opened file will be closed correctly.
We can obtain the kind of the file via `file.kind()`.
In a file server, directories need some special handling.
Since we cannot send a directory over network, we need to serve a HTML page for the user,
which contains the contents of the directory,
and links that jump to the corresponding page of each file in the directory.
This part of the server is implemented in the `serve_directory` function,
whose definition will be provided later.

If the requested file is a regular file,
we simply send the content of the file to the user.
This is implemented via the `serve_file` function:

```moonbit
async fn server_file(
  conn : @http.ServerConnection,
  file : @fs.File,
  path~ : String,
) -> Unit {
  let content_type = match path {
    [.., .. ".png"] => "image/png"
    [.., .. ".jpg"] | "jpeg" => "image/jpeg"
    [.., .. ".html"] => "text/html"
    [.., .. ".css"] => "text/css"
    [.., .. ".js"] => "text/javascript"
    [.., .. ".mp4"] => "video/mp4"
    [.., .. ".mpv"] => "video/mpv"
    [.., .. ".mpeg"] => "video/mpeg"
    [.., .. ".mkv"] => "video/x-matroska"
    _ => "appliaction/octet-stream"
  }
  conn
  ..send_response(200, "OK", extra_headers={ "Content-Type": content_type })
  ..write_reader(file)
  ..end_response()
}
```

In the HTTP response header,
we fill in different values for the `Content-Type` field based on the suffix of the requested file.
With correct `Content-Type`, the users can view the content of image/video/HTML file in the browser directly.
For other files, the value of `Content-Type` is set to `application/octet-stream`,
which tells the browser to download the file automatically.

As before, we use `conn.send_response` to send the response header.
The `extra_headers` field allows us to set extra header fields for the response.
The body of the response is the content of the file.
Here, `conn.write_reader(..)` will send the content of `file` to the user streamingly.
Assume the user requests for a video file and plays it in the browser,
if we read the whole video file in memory first before sending it to the user,
the user can only see response from the server after the whole video file has been loaded,
resulting in poor latency.
It is also a huge waste of memory to load the whole video file.
`write_reader`, on the other hand,
automatically split the file into small chunks, and send the content of the file chunk-by-chunk.
This way, users can start playing the video immediately, and the server can save up a lot of memory.

Next, let's implement the `serve_directory` function:

```moonbit
async fn serve_directory(
  conn : @http.ServerConnection,
  dir : @fs.Directory,
  path~ : String,
) -> Unit {
  let files = dir.read_all()
  files.sort()
  conn
  ..send_response(200, "OK", extra_headers={ "Content-Type": "text/html" })
  ..write("<!DOCTYPE html><html><head></head><body>")
  ..write("<h1>\{path}</h1>\n")
  ..write("<div style=\"margin: 1em; font-size: 15pt\">\n")
  ..write("<a href=\"\{path}?download_zip\">download as zip</a><br/><br/>\n")
  if path[:-1].rev_find("/") is Some(index) {
    let parent = if index == 0 { "/" } else { path[:index].to_string() }
    conn.write("<a href=\"\{parent}\">..</a><br/><br/>\n")
  }
  for file in files {
    let file_url = if path[path.length() - 1] != '/' {
      "\{path}/\{file}"
    } else {
      "\{path}\{file}"
    }
    conn.write("<a href=\"\{file_url}\">\{file}</a><br/>\n")
  }
  conn
  ..write("</div></body></html>")
  ..end_response()
}
```

Here, we first read the list of files in the directory and sort them.
Next, we build a HTML page based on the content of the directory.
The body of the HTML page is the list of files in the directory,
each file corresponds to a `<a>` HTML link showing the name of the file.
Users can jump to the page of the file by clicking the link.
If the requested directory is not the root directory,
we add a special link `..` at the beginning of the page,
which jumps to the parent directory of current directory.
Finally, the page also contains a `download as zip` link,
which jumps to the zip download URL for current directory.

## Implement the download as zip feature
Finally, let's implement the "download as zip" feature.
Here, for simplicity, we use the `zip` command for compression.
The implementation of `serve_zip` is as follows:

```moonbit
async fn serve_zip(
  conn : @http.ServerConnection,
  path : String,
) -> Unit {
  let full_path = @fs.realpath(path)
  let zip_name = if full_path[:].rev_find("/") is Some(i) {
    full_path[i+1:].to_string()
  } else {
    path
  }
  @async.with_task_group(fn(group) {
    let (we_read_from_zip, zip_write_to_us) = @process.read_from_process()
    defer we_read_from_zip.close()
    group.spawn_bg(fn() {
      let exit_code = @process.run(
        "zip",
        [ "-q", "-r", "-", path ],
        stdout=zip_write_to_us,
      )
      if exit_code != 0 {
        fail("zip failed with exit code \{exit_code}")
      }
    })
    conn
    ..send_response(200, "OK", extra_headers={
      "Content-Type": "application/octet-stream",
      "Content-Disposition": "filename=\{zip_name}.zip",
    })
    ..write_reader(we_read_from_zip)
    ..end_response()
  })
}
```

At the beginning of `serve_zip`, we first compute the file name for the `.zip` file.
Next, we create a new *task group* using `@async.with_task_group`.
Task group is the core construct for task management in `moonbitlang/async`,
all tasks must be spawned in a task group.
But before we get into the details of `with_task_group`,
let's first check out the remaining content of `serve_zip`.
First, we use `@process.read_from_process` to create a temporary pipe.
Data written to one end of the pipe can be read from the other end,
so the pipe can be used to obtain the output of a system command.
We will pass the write end of the pipe, `zip_write_to_us` to the `zip` command,
and let `zip` write the result of compression to `zip_write_to_us`.
Meanwhile, we will read the output of the `zip` command
from the read end of the pipe, `we_read_from_zip`, and send the result to the user.

To accomplish the above job,
we first spawn a new task in the task group using `growp.spawn_bg(..)`.
`group.spawn_bg(..)` accepts a function as argument,
and run the function in a new background task, in parallel with other code in the program.
Within the new task, we wse `@process.run` to launch the `zip` command.
`@process` is the default alias of `moonbitlang/async/process`,
which provides process spawning and manipulation support for `moonbitlang/async`.
The meaning of the arguments of `zip` is:

- `-q`: do not output log
- `-r`: recursively compress the whole directory
- `-`: write the result of compression to `stdout`
- `path`: the directory to compress

When launching `zip` with `@process.run`, the `stdout=zip_write_to_us` part
redirects the `stdout` of `zip` to `zip_write_to_us`,
so that we can obtain the output of `zip`.
Compared to creating a temporary `.zip` file to store the result,
using a pipe is more efficient because:

- the data exchange with `zip` is completely in-memory,
  which is more efficient than disk IO
- we can send partial compression result on-the-fly while `zip` is still working,
  reducing latency

`@process.run` will wait until `zip` finishes and return the exit code of `zip`.
If the `zip` command fail with a non-zero exit code, we raise an error.

Outside the new task in `spawn_bg`,
we use `conn.send_response(..)` to initiate a response to the user,
and send the output of `zip` to the user via `conn.write_reader(we_read_from_zip)`.
The `Content-Disposition` HTTP header allows us to specify the file name for the `.zip` file.
This part of code will be run in parallel with the `@process.run` task.

So far everything looks reasonable.
But why do we need to create a new task group here?
Why doesn't `moonbitlang/async` just provide a global task-spawning API,
like many other languages do?
There is a phenomenon in async programming:
it is relatively easy to write an async program that works correctly when everything goes well,
but much harder to write an async program that behaves correctly when things go wrong.
For the `serve_zip` example:

- what should we do if the `zip` command fails?
- what should we do if some network error occurs, or the user closes the connection?

If the `zip` command fails, the whole `serve_zip` function should fail too.
Since the user already received some incomplete data,
it is hard to recover the connection back to normal state,
so we have to close the whole connection.
If network error occurs when sending data,
we should stop the `zip` command immediately,
because its result is no longer useful.
Keep the `zip` command running is just a waste of resource.
In the worst case, the pipe for communication with `zip` may get filled up since we are no longer reading from it,
and `zip` may get blocked forever on writing to the pipe and become a zombie process.

In the code above, we did not perform any explicit error handling.
However, when the aforementioned error cases occur,
our program *can* behave correctly and handle all edge cases.
The magic lies in the `@async.with_task_group` function,
and the *structured concurrency* paradigm behind it.
The semantic of `@async.with_task_group(f)` is as follows:

- it will create a new task group `group`, and run `f(group)` inside the new group
- `f` can spawn new tasks in the group via `group.spawn_bg(..)`
- `with_task_group` will only return after **all tasks inside the group terminates**
- **if any task inside the group fails,** `with_task_group` **will fail as well,**
  **and all other remaining tasks in the group is automatically cancelled**

The last point here is the key to ensure correct error handling behavior:

- if the `zip` command fails,
  the task that calls `@process.run` will raise an error, failing the whole task.
  The error will be propagated to the whole task group since no one is catching it.
  `with_task_group` will automatically cancel the response-sending task,
  propagate the error upwards and close the connection.
- if network error occurs, the main response-sending task will fail.
  The error will also get propagated to the whole task group,
  and the `zip` task will be cancelled.
  When `@process.run` is cancelled,
  it automatically terminates the `zip` command by sending a `SIGTERM` signal

So, when writing async program using `moonbitlang/async`,
users only need to insert task groups at appropriate places based on the structure of the program,
all the remaining error handling details are automatically handled by `with_task_group`.
This is the power of the *structured concurrency* paradigm of `moonbitlang/async`:
it guides users to write async programs with clearer structure,
and makes program behave correctly even when things go wrong.

## Run the server

We have implemented all features of the HTTP file server,
now we can actually run the server.
MoonBit provides native support for async code,
users can use `async fn main` to define entry point to async program,
or use `async test` to test async code directly.
Here, we let the HTTP server serve the content of current working directory,
and let it listen on port `8000`:

```moonbit
async test {
  server_main(path=".", port=8000)
}
```

To use the file server,
just run the source code of this document via `moon test /path/to/this/document.mbt.md`,
and open the address `http://127.0.0.1:8000` in your browser.

Other features of `moonbitlang/async` can be found in its
[API document](https://mooncakes.io/docs/moonbitlang/async)
and [GitHub repo](https://github.com/moonbitlang/async).

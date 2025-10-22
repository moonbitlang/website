---
moonbit:
  deps:
    moonbitlang/async: 0.10.0
  backend:
    native
---

# 使用 MoonBit 开发一个 HTTP 文件服务器

![](./cover.png)

在这篇文章中，我将会介绍如何使用 MoonBit 的异步编程功能和 `moonbitlang/async` 库，编写一个简单的 HTTP 文件服务器。如果你之前接触过 Python 语言，那么你可能知道，Python 有一个非常方便的内建 HTTP 服务器模块。只需要运行 `python -m http.server`，就能在当期文件夹启动一个文件服务器，用于局域网文件共享等用途。
在这篇文章中，我们将用 MoonBit 实现一个类似功能的程序，并借此了解 MoonBit 的异步编程支持。我们还将额外支持一个 `python -m http.server` 没有的实用功能：把整个文件夹打包成 `zip` 文件下载。

## 异步编程简史
异步编程，能让程序具有同时处理多项任务的能力。例如，对于一个文件服务器来说，可能会有多个用户同时访问这个服务器，而服务器需要同时服务所有用户，让它们的体验尽可能流畅、低延时。在典型的异步程序，例如服务器中，每项任务的大部分时间都花在等待 IO 上，实际的计算时间占比较低。因此，我们并不需要很多的计算资源，也能同时处理大量任务。而这其中的诀窍，就是频繁地在多个任务之间切换：
如果某项任务开始等待 IO，那么就不要继续处理它，而是马上切换到不需要等待的任务上。

过去，异步程序往往是通过多线程的方式实现的：每项任务对应一个操作系统的线程。
然而，操作系统线程需要占用较多资源，而且在线程之间切换开销较大。
因此，进入 21 世纪后，实现异步程序的主要方式变成了*事件循环*。
整个异步程序的形态是一个巨大的循环，每次循环中，
程序检查哪些 IO 操作已经完成，然后运行那些等待着这些已完成的 IO 操作的任务，
直到它们发起下一次 IO 请求，重新进入等待状态。
在这种编程范式中，任务间的切换发生在同一个用户态的线程里，因此开销极低。

然而，手写事件循环是一件非常痛苦的事情。
因为同一个任务的代码会被拆散到多次不同的循环中执行，程序的逻辑变得不连贯了。
因此，基于事件循环的程序非常难编写和调试。
幸运的是，就像大部分其他现代编程语言一样，MoonBit 提供了原生的异步编程支持。
用户可以像写同步程序一样写异步代码，MoonBit 会自动把异步代码切分成不同的部分。
而 `moonbitlang/async` 库则提供了事件循环和各种 IO 原语的实现，负责把异步代码运行起来。

## MoonBit 中的异步编程

在 MoonBit 中，可以用 `async fn` 语法来声明一个异步函数。
异步函数看上去和同步函数完全一样，只不过它们在运行时可能在中途被打断，
一段时间后才继续恢复运行，从而实现多个任务间的切换。
在异步函数中可以正常使用循环等控制流构造，MoonBit 编译器会自动将它们变成异步的样子。

和许多其他语言不同，在调用异步函数时，MoonBit 不需要用 `await` 之类的特殊语法标记，
编译器会自动推断出哪些函数调用是异步的。
不过，如果你使用带有 MoonBit 支持的 IDE 或文本编辑器查看代码，
就会看到异步函数调用被渲染成了斜体、可能抛出错误的函数调用带有下划线。
因此，阅读代码时，依然可以一眼就找到所有异步的函数调用。

对于异步程序来说，另一个必不可少的组件是事件循环、任务调度和各种 IO 原语的实现。
这一点在 MoonBit 中是通过 `moonbitlang/async` 库实现的。
`moonbitlang/async` 库中提供了网络IO、文件IO、进程创建等异步操作的支持，
以及一系列管理异步编程任务的 API。
接下来，我们将会在编写 HTTP 文件服务器的途中介绍 `moonbitlang/async` 的各种功能。

## HTTP 服务器的骨架

典型的 HTTP 服务器的结构是：

- 服务器监听一个 TCP 端口，等待来自用户的连接请求
- 接受来自用户的 TCP 连接后，服务器从 TCP 连接中读取用户的请求，处理用户的请求并将结果发回给用户

这里的每一项任务，都应该异步地进行：
在处理第一个用户的请求时，服务器仍应不断等待新的连接，并第一时间响应下一个用户的连接请求。
如果有多个用户同时连接到服务器，服务器应该同时处理所有用户的请求。
在这个过程中，所有可能耗费较多时间的操作，例如网络 IO 和文件 IO，都应该是异步的，
它们不应该阻塞程序、影响其他任务的处理。

在 `moonbitlang/async` 中，有一个辅助函数 `@http.run_server`，
能够绑我们自动完成上述工作，搭建一个 HTTP 服务器并运行它：

```moonbit
async fn server_main(path~ : String, port~ : Int) -> Unit {
  @http.run_server(@socket.Addr::parse("[::]:\{port}"), fn (conn, addr) {
    @pipe.stderr.write("received new connection from \{addr}\n")
    handle_connection(path, conn)
  })
}
```

`server_main` 接受两个参数，其中，
`path` 是文件服务器工作的路径，`port` 是服务器监听的端口。
在 `moonbitlang/async` 中，一切异步代码都是可以取消的，
而异步代码被取消时会抛出错误，所以所有异步函数都会抛出错误。
因此，在 MoonBit 中，`async fn` 默认就会抛出错误，无需再显式标注 `raise`。

在 `server_main` 中，我们使用 `@http.run_server` 创建了一个 HTTP 服务器并运行它。
`@http` 是 `moonbitlang/async` 中提供 HTTP 解析等支持的包 `moonbitlang/async/http` 的别名，
`@http.run_server` 的第一个参数是服务器要监听的地址。
这里我们提供的地址是 `[::]:port`，
这表示监听端口 `port`、接受来自任何网络接口的连接请求。
`moonbitlang/async` 有原生的 IPv4/IPv6 双栈支持，因此这里的服务器可以同时接受 IPv4 连接和 IPv6 连接。
`@http.run_server` 的第二个参数是一个回调函数，用于处理来自用户的连接。
回调函数会接受两个参数，第一个是来自用户的连接，
类型是 `@http.ServerConnection`，由 `@http.run_server` 自动获取并创建。
第二个参数是用户的网络地址。
这里，我们使用 `handle_connection` 函数来处理用户的请求，这个函数的实现将在稍后给出。
`@http.run_server` 会自动创建一个并行的任务，并在其中运行 `handle_connection`。
因此，服务器可以同时运行多份 `handle_connection`、处理多个连接。

## 处理用户来自用户的请求

接下来，我们开始实现实际处理用户请求的 `handle_connection` 函数。
`handle_connection` 接受两个参数，`base_path` 是文件服务器处理的路径，
而 `conn` 是来自用户的连接。

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

在 `handle_connection` 中，程序通过一个大循环来不断从连接中读取用户请求并处理。
每次循环中，我们首先通过 `conn.read_request()` 读取一个来自用户的请求。
`conn.read_request()` 只会读取 HTTP 请求的头部，这是为了允许用户流式地读取较大的 body。
由于我们的文件服务器只处理 `Get` 请求，我们不需要请求的 body 中包含任何信息。
因此，我们通过 `conn.skip_body()` 跳过用户请求的 body，以保证下一个请求的内容可以被正确读取。

接下来，如果遇到不是 `Get` 的请求，`guard` 语句的 `else` 块会被执行，
此时，`guard` 语句后面的代码会被跳过，我们可以进入下一次循环、处理下一个请求。
在 `else` 块中，通过 `conn.send_response(..)` 向用户发送一个 “不支持该请求” 的回复。
`conn.send_response(..)` 会发送回复的头部，这之后，我们用 `conn.write(..)` 向连接写入回复的主体内容。
在写完所有内容后，我们需要用 `conn.end_response()` 来表明已经写完了回复的所有内容。

这里，我们希望实现一个 `python -m http.server` 中没有的实用功能：
以 zip 的形式下载整个文件夹。
如果用户请求的 URL 的形式是 `/path/to/directory?download_zip`，
我们就把 `/path/to/directory` 打包成 `.zip` 文件发送给用户。
这一功能是通过 `serve_zip` 函数来实现的。

由于我们实现的是一个文件服务器，
用户的 `GET` 请求中指定的路径会直接映射到 `base_path` 下对应的路径。
`@fs` 是 `moonbitlang/async` 中提供文件 IO 支持的包 `moonbitlang/async/fs` 的别名。
这里我们使用 `@fs.open` 打开对应的文件。
如果打开文件失败了，我们向用户发送一个 404 回复，告诉用户这个文件不存在。

如果用户请求的文件是存在的，那么我们需要把文件发送给用户。
当然，在此之前，别忘了用 `defer file.close()` 保证 `file` 占用的资源被及时释放。
通过 `file.kind()`，我们可以获得文件的种类。
在文件服务器中，如果用户请求的路径是一个文件夹，我们需要进行特殊的处理。
因为文件夹不能直接被发送给用户，我们需要根据文件夹的内容，
向用户返回一个 HTML 页面，让用户可以从页面看到文件夹里有哪些文件，并通过点击跳转到对应的页面。
这部分功能通过函数 `serve_directory` 提供。
如果用户请求的是一个普通文件，那么直接将文件的内容传输给用户即可。
这部分功能通过函数 `serve_file` 来实现。

向用户发送一个普通文件的代码如下：

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

这里，在 HTTP 回复中，我们根据文件的后缀名填入了不同的 `Content-Type` 字段。
这样一来，用户在浏览器中打开图片/视频/HTML 文件时，就可以直接预览文件的内容，
而不需要先下载文件再在本地打开。
对于其他文件，`Content-Type` 字段的值会是 `application/octet-stream`，
这会让浏览器自动将文件下载到本地。

我们依然使用 `conn.send_response` 来用户发送回复。
通过 `extra_headers` 字段我们可以在回复中加入额外的 HTTP header。
回复的主体则是文件的内容。
这里，`conn.write_reader` 会自动流式地把 `file` 的内容发送给用户。
假设用户请求了一个视频文件并在浏览器中播放，
如果我们先把整个视频文件读到内存中再发送给用户，
那么用户需要等服务器读入整个视频文件之后才能收到回复，服务器的响应速度会变慢。
而且，读入整个视频文件会浪费大量的内存。
而通过使用 `write_reader`，`@http.ServerConnection` 会自动把文件内容切成小块分段发送，
用户马上就能看到视频开始播放，占用的内存也会大大减少。

接下来，让我们实现显示文件夹的函数 `serve_directory`：

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

这里，我们首先读入文件夹中的文件列表并对它们进行排序。
接下来，我们根据文件夹的内容，拼出一段 HTML 页面。
HTML 页面的主体内容是文件夹中的文件，
每个文件对应一个链接，上面显示着文件名，点击链接就能跳转到对应的文件。
这里，我们通过 HTML 的 `<a>` 元素来实现这一点。
如果文件夹不是根目录，那么我们在页面开头放上一个特殊的链接 `..`，点击它会跳转到上一级目录。
此外，页面里还有一个 `download as zip` 的链接，
点击这个链接就能把当前文件夹打包成 `zip` 后下载。

## 实现将文件夹打包成 zip 的功能

接下来，我们实现将文件夹打包成 `zip` 提供给用户的功能。
这里，简单起见，我们使用系统的 `zip` 命令。
`serve_zip` 函数的实现如下：

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

在 `serve_zip` 函数的开头，我们首先计算了用户下载的 `.zip` 文件的文件名。
接下来，我们使用 `@async.with_task_group` 创建了一个新的任务组。
任务组是 `moonbitlang/async` 中用于管理异步任务的核心构造，
所有异步任务都必须在一个任务组中创建。
在介绍 `with_task_group` 之前，让我们先看看 `serve_zip` 剩下的内容。
首先，我们使用 `@process.read_from_process()` 创建了一个临时管道，
从管道的一端写入的数据可以从另一侧读出，因此它可以用于读取一个进程的输出。
这里我们把管道的写入端 `zip_write_to_us` 会被提供给 `zip` 命令，用于写入压缩的结果。
而我们将从管道的读入端 `we_read_from_zip` 读取 `zip` 命令的输出，并将其发送给用户。

接下来，我们在新的任务组中创建了一个单独的任务，
并在其中使用 `@process.run` 运行 `zip` 命令。
`@process` 是 `moonbitlang/async/process` 的别名，
是 `moonbitlang/async` 中提供调用外部进程功能的包。
我们向 `zip` 传递的参数的意义是：

- `-q`：不要输出日志信息
- `-r`：递归压缩整个文件夹
- `-`：把结果写入到 `stdout`
- `path`：要压缩的文件夹

在调用 `@process.run` 时，我们通过 `stdout=zip_write_to_us`，
把 `zip` 命令的 `stdout` 重定向到了 `zip_write_to_us`，以获取 `zip` 的输出。
相比创建一个临时文件，这么做有两个好处：

- 和 `zip` 间的数据传递完全在内存中进行，不需要进行低效的磁盘 IO
- `zip` 一边压缩，我们可以一边像用户发送已经压缩好的部分，效率更高

`@process.run` 会等待 `zip` 结束运行，并返回 `zip` 命令的状态码。
如果 `zip` 的返回值不是 `0`，说明 `zip` 失败了，我们抛出一个错误。

在调用 `zip` 的同时，我们继续使用 `conn.send_response(..)` 向用户发送回复信息。
接下来，我们用 `conn.write_reader(we_read_from_zip)` 把 `zip` 的输出发送给用户。
`Content-Disposition` 这一 HTTP header 能让我们指定用户下载的 `zip` 文件的名字。

到这里，一切看上去都很合理。
但为什么这里要创建一个新的任务组呢？为什么不能直接提供创建新任务的 API 呢？
在编写异步程序时，有一个现象：
写出在正确时行为正确的程序比较容易，但写出在出错时依然行为正确的程序很难。
比如，对于 `serve_zip` 这个例子：

- 如果 `zip` 命令失败了我们应该怎么办？
- 如果数据发送到一半发生了网络错误，或者用户关闭了连接，应该怎么办？

如果 `zip` 命令失败了，那么整个 `serve_zip` 函数也应该失败。
由于此时用户可能已经收到了一部分不完整的数据，我们很难再把连接恢复到正常状态，
只能关闭把整个连接。
如果数据发送到一半发生了网络错误，那么我们应该停止 `zip` 的运行。
因为此时 `zip` 的结果已经没有用了，让它继续运行只是在浪费资源。
而且在最坏的情况下，由于我们不再读取 `zip` 的输出，和 `zip` 通信用的管道可能会被填满，
此时，`zip` 可能会永远阻塞在向管道写入的操作上，变成一个僵尸进程。

在上面的代码中，我们没有显式地写任何错误处理逻辑，
但是，在出现上述错误时，我们的程序的行为却是符合预期的，
而魔法就在于 `@async.with_task_group` 的语义，及其背后的 **结构化并发** 范式。
`@async.with_task_group(f)` 的大致语义如下：

- 它会创建一个新的任务组 `group`，并运行 `f(group)`
- `f` 可以通过 `group.spawn_bg(..)` 等函数在 `group` 中创建新的任务
- 只有当 `group` 中的所有任务都完成时，`with_task_group` 才会返回
- **如果 `group` 中的任何一个任务失败了，那么 `with_task_group` 也会失败，`group` 中的其他任务会被自动取消**

这里的最后一条，就是保证正确错误处理的行为的关键：

- 如果调用 `zip` 的任务失败了，那么错误会传播到整个任务组。
向用户发送回复的主任务会自动被取消，
然后错误会通过 `with_task_group` 自动向上传播，关闭连接
- 如果发送回复的主任务失败了，错误同样会传播到整个任务组。
此时 `@process.run` 会被取消，此时它会自动向 `zip` 发送终止信号，结束 `zip` 的运行

因此，在使用 `moonbitlang/async` 编写异步程序时，
只需要根据程序的结构在适当的位置插入任务组，
剩下的错误处理的所有细节，都会由 `with_task_group` 自动解决。
这正是 `moonbitlang/async` 使用的结构化并发范式的威力：通过编程范式的引导，
它能让我们写出结构更清晰的异步程序，并以一种润物细无声的方式，
让异步程序在出错时也能有正确的行为。

## 让服务器跑起来

至此，整个 HTTP 服务器的所有内容都已实现完毕，我们可以运行这个服务器了。
MoonBit 对异步代码有原生支持，可以直接用 `async fn main` 定义异步程序的入口，
或是用 `async test` 直接测试异步代码。
这里，我们让 HTTP 服务器运行在当前目录、向用户提供当前目录下的文件，并让它监听 8000 端口：

```moonbit
async test {
  server_main(path=".", port=8000)
}
```

通过 `moon test moonbit_http_server.mbt.md` 运行这份文档的源码，
并在浏览器中打开 `http://127.0.0.1:8000`，即可使用我们实现的文件服务器。

关于 `moonbitlang/async` 的更多功能，可以参考它的
[API 文档](https://mooncakes.io/docs/moonbitlang/async)
和 [GitHub repo](https://github.com/moonbitlang/async)。

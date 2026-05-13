# 20260513 MoonBit v0.9.2

发布于: 2026年5月13日

**对应 moonc 版本：**`v0.9.2+bbe2b338f`

## 语言更新

1. 新增 list comprehension 语法：
    
    ```moonbit
    // 可以用 `if` 来对元素进行筛选
    let even_numbers = [
      for i in 0..<100 if i % 2 == 0 => i
    ]
    
    // 如果创建的是 `Iter`，可以创建无穷序列
    let fib_numbers : Iter[Int] = [
      for p1 = 1, p2 = 0;; p1 = p1 + p2, p2 = p1 => p1
    ]
    ```
    
    语法是 `[ for .. => <body> ]`，在 `=>` 前可以添加可选的 `if <guard>` 来对元素进行筛选。`guard` 内可以用 `is` 绑定变量，并且绑定的变量可以在 `body` 中使用。所有 `for` 循环，包括 `for .. in` 循环和普通 `for` 循环，都能够在 list comprehension 中使用。
    
    List comprehension 可以构造所有内建的类数组类型，包括 `Array`/`FixedArray`/`ReadOnlyArray`/`Bytes`/`String` 以及它们对应的 view 类型。除此之外，list comprehension 还可以用于构造 `Iter` 类型，此时整个序列是惰性求值的，只有当 `Iter` 遍历到对应的元素时，才会计算对应的元素，因此可以创建无穷的序列。一个 list comprehension 表达式具体构造何种类型的值是由上下文的类型决定的，可以通过类型标注来显式控制要构造的类型
    
    List comprehension 的 body 内部目前不支持任何控制流操作，包括 `return`/`break`/`continue`、抛出错误和异步操作
    
2. 支持用数组字面量构造 `Iter` 类型。现在，当一个数组字面量的预期类型可以是 `Iter`，此时它会变成一个包含对应元素的迭代器。字面量中的元素依然会在构造字面量时立刻求值，而不是被包裹在 `Iter` 中进行惰性求值。因此数组字面量的求值顺序不会随着类型隐式改变
    
3. 调整数组插值构造 `Iter` 时的求值顺序。数组插值语法 `[ a, ..it, b ]` 之前就支持构造 `Iter` 类型。但之前的语义里，求值顺序并不自然。具体来说，`it` 对应的迭代器内部的副作用会在构造字面量时就计算完毕，而不是惰性求值。这导致数组插值语法不能用于组合可能无穷的迭代器。
    
	现在，以 `([a, ..it, b] : Iter[_])` 为例，数组插值构造迭代器的求值顺序为：
    
	- 表达式 `a`、`it` 和 `b` 会在构造迭代器时马上按从左到右的顺序求值
        
	- 迭代器 `it` 内部的副作用，会在遍历到对应的元素时才触发
        
4. `struct` 的自定义构造器得到了调整和简化。新的语法如下：
    
    ```moonbit
    struct Point {
      x : Int
      y : Int
      // 结构体内不再需要写任何东西
    }
    
    fn Point::Point(x : Int, y : Int) -> Point {
      { x, y }
    }
    
    test {
     let _ = Point(1, 2)
    }
    ```
    
    相比旧语法，新的语法不再需要把构造器的签名重复两遍，并且不再需要定义一个 `new` 方法来实现构造器，语法和语义上都更简单。对于库作者，如果想在提供构造器的同时保留 `new`，可以在 `fn Type::Type` 声明上标注 `#alias(new)`，也可以用 `#alias(new, deprecated)`/`#alias(new, deprecated="msg")`把 `new` 方法废弃，供下游迁移。
    
    旧的自定义构造器语法目前仍然保留，但编译器会对旧语法给出废弃警告。旧语法会在近期被移除
    
5. 新增 extensible enum
    
    extensible enum 主要用于允许其他包给当前包中的 enum 拓展新的构造器，比如这里在 `base` 这个包中使用 `extenum` 关键字声明 `LogEvent` 类型，表示其可以被拓展：
    
    ```moonbit
    // base package
    pub(all) extenum LogEvent[T] {
      Info(T)
      Warning(T)
    }
    ```
    

	在 `plugin` 包里可以使用 `extenum` 和 `+=` 关键字对 `base` 包中的 `LogEvent` 类型进行拓展，比如这里添加了 `Debug` 这个新的构造器

	```moonbit
	// plugin package — extends a type from another package!
	pub(all) extenum @base.LogEvent[T] += {
	  Debug(T)
	}
	```

	在 `app` 这个包中对 `@base.LogEvent` 这个类型进行模式匹配，这里可以同时匹配来自 `base` 包的构造器，也可以匹配来自 `plugin` 包中的构造器，在匹配构造器的时候需要使用 `@pkg.C` 的语法来区分来自不同包的构造器，并且因为 `LogEvent` 类型是可拓展的，所以必须使用 wildcard 来确保其完备性

	```moonbit
	
	// app package — both variants share one type
	fn[T : Show] use_event(event : @base.LogEvent[T]) -> String {
	  match event {
	    @base.Info(msg)    => "info: \{msg}"
	    @base.Warning(msg) => "warn: \{msg}"
	    @plugin.Debug(msg) => "debug: \{msg}"
	    _                  => "unknown"
	  }
	}
	```

6. 新增 `E::@pkg.C` 的语法
    

	这一语法主要用于支持上面提到的 extensible enum，因为普通的 enum 可以确保类型和构造器来自同一个包，所以上述语法和 `@pkg.E::C` 等价，但是在考虑到 extensible enum 的情况下，类型和构造器可能来自不同的包，所以显式写明构造器来自哪个包就有其必要性了。

	支持了这一语法之后构造器的语法可以概括为以下四种情况：

	- `C` —— 当前包声明的构造器
    
	- `@pkg.C` —— `pkg` 包中声明的构造器
    
	- `@pkg.E::C` —— `E` 是普通 enum 的话则 `E` 和 `C` 都来自 `@pkg`，如果是 extensible enum 的话则 `E` 来自 `pkg` 而 `C` 来自当前包
    
	- `@pkg1.E::@pkg2.C` —— `E` 和 `C` 分别来自 `@pkg1` 和 `@pkg2`
    

7. 反向管道语法 `<|` 支持了方法调用
    
    ```moonbit
    obj.method(args) <| last_arg
    obj.method() <| last_arg
    obj.method(args) <| (x) => {
      x.do_something()
    } 
    ```
    
    注意只有 `final_arg` 一个参数时，`<|` 左侧依然需要写成 `obj.method()` 的形式，而不能直接写 `obj.method <| final_arg`。
    
8. `for` 循环的更新部分现在可以使用条件部分引入的变量了。例如：
    
    ```moonbit
    for sum = 0; queue.next() is Some(elem); sum = sum + elem {
    //                                       ^^^^^^ 这里可以使用 elem 了
    } nobreak {
      sum
    }
    ```
    
9. 下列已经废弃一段时间的旧语法被移除：
    
    - 旧的 newtype 语法 `type T UnderlyingType`，新语法是 `struct T(UnderlyingType)`
        
    - 连续多个局部 `fn` 不再能互相递归。互递归的本地函数需要使用 `letrec f = .. and g = ..`
        

## 工具链更新

1. Workspace 中会采用 preferred target
    
    对于对工作区全局生效的指令，如 `moon build` `moon check` `moon test`，对于每一个工作区的成员，将使用该成员声明的 `preferred-target`对该成员进行操作。这样一来，混合项目，如前后端一体项目，可以通过一行指令完成检查、构建、测试等。
    
2. 新增 `moon run -c` 的功能
    
    `moon run -c <script>`允许直接执行临时脚本，例如：
    
    ```moonbit
    $ moon run -c 'fn main { println("hello") }'
    hello
    ```
    
3. `moon run` 改为从选定路径开始解析项目
    
    通常，我们会使用一个本地的项目作为工具。这种时候，源代码路径和工作路径不同。以往，`moon run` 必须在项目内执行，或需要额外提供 `--manifest-path`。现在这一限制已解除，来简化使用。
    
4. 废弃`--manifest-path`
    
    如上所述，`--manifest-path`的使用场合是源代码路径和工作路径不同，通常只出现在 `moon run`的情况，而目前`moon run`的限制已经解除，因此此参数不再有必要。
    
5. moon.mod 实验性配置
    
    moon.mod 是实验性的模块配置文件，用于替代`moon.mod.json`, 提供和 moon.pkg 一致的编写体验。目前构建系统已经支持了 moon.mod, LSP 还在适配中。
    
    ```moonbit
    // 模块名
    name = "moonbit-community/mod"
    // 版本
    version = "0.1.0"
    // 模块的依赖
    import {
      "moonbitlang/async@0.19.0",
      "moonbitlang/x@0.4.43",
    }
    
    // 原有的其他配置
    options(
      readme: "README.mbt.md",
      repository: "",
      license: "Apache-2.0",
      keywords: [ "keyword1", "keyword2" ],
      ...
      description: "",
    )
    ```
    
    新的 moon.mod 弃用了本地依赖配置，推荐使用`moon.work`替代。
    
    使用旧配置的项目不受影响，而且目前默认不会进行迁移。可以通过设置环境变量`NEW_MOON_MOD=1`来让 moon 自动迁移旧的 moon.mod.json 配置到新的 moon.mod。
    
6. 构建系统 `rule/dev_build` 配置
    

	构建系统弃用了之前`moon.pkg`的`options("pre-build": ...)`配置，改进后的配置如下：

	```moonbit
	// 定义 rule1 
	rule(name: "rule1", command: "exe $input -o $output")
	// 使用 rule1，并设置要用的输入和输出
	dev_build(rule: "rule1", input: "input.txt", output: "output.mbt")
	```

	在 moon.pkg 中定义的rule只有在同一个配置中可见。rule 也可以添加到新的 `moon.mod` 中，此时整个项目的 moon.pkg 都可以使用这条 rule，减少配置上的重复。

7. 新增 native lsp。这是我们使用ocaml重新实现的moonbit lsp，它直接编译到二进制，计划在未来取代现在的使用ts实现的lsp。通过`moon lsp`使用。vscode 插件用户可以通过设置 `"moonbit.nativeLsp": true`使用。欢迎大家试用并给我们提供反馈。
    
8. 新增`MOON_WORK`环境变量指定`moon.work`文件位置，或通过`MOON_WORK=off`关闭 workspace 行为
    

## 标准库更新

1. `Show`相关实现的弃用和迁移
    
    我们正在将大多数容器类型的调试接口从 `Show` 迁移到 `Debug`。`Debug` 旨在提供更好的调试体验：它会为数据结构生成结构化、带缩进、便于人类阅读的信息。`Show` trait 将专注于生成专门格式的字符串，例如让 Json 类型直接输出 Json 格式的文本。区分`Show`和`Debug`也能够避免在字符串插值中错误地使用未处理的数据。
    
    这次更新：
    
    -  **弃用** **标准库** **容器相关类型的** **`Show`** **实现**，包括元组、`Array`、`Map`、`Set`、`Option`、`Result`
        
    - **变更了** **`Show::output`** **关于** **`String`** **和** **`Char`** **两个类型的行为**
        
		
		`Show::output`原先在处理`String`和`Char`时和`Show::to_string`不同：它会处理字符串和字符的内容，输出带引号和转义序列的文本。变更后，`Show::output`和`Show::to_string`保持一致，`String`和`Char`都按原样输出成文本。例如：
        
        ```moonbit
        //旧的行为
        assert_eq(Show::output("\n"), "\"\\n\"") 
        assert_eq(Show::output('\n'), "'\\n'")
        assert_eq(Show::to_string("\n"), "\n") 
        assert_eq(Show::to_string('\n'), "\n")
        //现在的行为
        assert_eq(Show::output("\n"), "\n") 
        assert_eq(Show::output('\n'), "\n")
        assert_eq(Show::to_string("\n"), "\n") 
        assert_eq(Show::to_string('\n'), "\n")
        ```
        

	迁移时，请将 `Debug` 用于测试快照、测试断言、以及类似日志的输出。

	一些常见情况可以按如下方式迁移：

	- 自定义类型使用 `derive(Debug)`生成实现。只有在类型存在有意义的特定文本表示时，才手动实现 `Show`，例如 Json 类型、Html类型、SqlStatement类型。
	    
	- 使用 `debug_inspect(value, content=...)` 替代 `inspect(value, content=...)`
	    
	- 使用 `@debug.assert_eq(a, b)` 替代 `assert_eq(a, b)`
	    
	- 在插值时, `"\{x}"`将插入通过`Show`的到的结果；`"\{to_repr(x)}"`将插入通过`Debug`得到的结果。在大部分调试场景你需要使用`to_repr`。
	    
	- 使用 `@debug.to_string(value)` 替代 `value.to_string()`，前提是该字符串仅用于调试。
	    

2. `moonbitlang/async` 目前的最新版本为 v0.19.0，自上次月报（v0.17.0）以来的主要新增功能和 API 变动如下：
    
    - 新增了 `moonbitlang/async/gzip` 包，可以对任何 reader/writer 进行 gzip 解压缩/压缩变换
        
    - `moonbitlang/async/tls` 包新增了下列功能：
        
        - `get_peer_certificate` 方法可以用户在 client 处获取 DER 格式的 server 证书
            
        - `unique_channel_binding` 和 `server_endpoint_channel_binding` 方法可以用于获取 RFC 5929 定义的两种 TLS channel binding 数据
            
        - `@tls.Tls::client` 的 `verify` 参数被废弃，替代品是 `trust? : TrustedRoot` 参数。`TrustedRoot::SystemRoot` 和 `TrustedRoot::NoVerification` 对应原本的 `verify=true` 和 `verify=false`，`TrustedRoot::CustomPemFile(filename)` 是新增功能，可以用一个自定义的 PEM 证书文件作为受信根证书，从而利用私有的自签名证书进行 TLS 验证
            
        - `@http.Client(..)` 现在也能接受 `trust` 参数，会在进行 `https` 通信时将该参数转发给 `@tls.Tls::client(..)`
            
    - 新增了 `moonbitlang/async/raw_fd` 包，可以将任意 file descriptor 整合进 `moonbitlang/async` 的事件循环，方便用户操作 `moonbitlang/async` 不直接支持的特殊 file descriptor
        
    - 新增了 signal 支持。现在，`async fn main` 程序在接受到 `ctrl+C` 等信号时，会自动取消整个程序（通过 `moonbitlang/async` 自带的取消机制），便于实现进程级别的清理。默认下列信号会触发全局取消：
        
        - Linux/MacOS：`SIGINT`、`SIGTERM`、`SIGHUP`
            
        - Windows：`CTRL_C_EVENT`、`CTRL_BREAK_EVENT`、`CTRL_CLOSE_EVENT`
            
        
        可以通过 `moonbitlang/async/signal` 包的 `set_global_cancellation_signals` 函数控制哪些信号会触发全局取消行为
        
    - 新增了 UDP multicast 支持。详细内容见 https://github.com/moonbitlang/async/pull/354
        
    - `@socket.Addr::parse` 现在能正确处理 IPv6 zone suffix 了
        
    - `moonbitlang/async/http` 修改了处理 cookie 的方式。`Set-Cookie` header 的接受和发送现在需要通过 `@http.Response.cookies` 字段完成，而不是直接通过 headers。这是因为 `Set-Cookie` header 可能在同一个 response 中出现多次，并且不遵循 RFC 的一些规则，无法被放入一个 `Map`。`moonbitlang/async/http` 会对 `Set-Cookie` 的内容做基本的解析，方便用户读取
        
    - 当用户没有显式提供 `Accept-Encoding` 时，`@http.Client` 现在会自动向服务器请求 `gzip` 压缩，并在用户读取 response body 时自动进行解压缩。如果用户显式提供了 `Accept-Encoding`，则目标服务器发送的 response body 会被原样读取出来
        
    - 在发送 HTTP request/response 时现在可以显式提供 `Content-Length`。此时用户依然可以增量地分批发送数据， `moonbitlang/async/http` 会自动检查用户最终发送的总数据长度是否正确，不正确则报错。这一功能可以帮助文件下载服务器等应用给客户端提供下载进度支持
        
    - `@fs.open` 等 API 现在通过 `create_mode? : CreateMode` 来控制是否要创建新文件和是否要 truncate 现有文件，通过 `permission? : Int`来控制新建的文件的访问权限（默认 `0o644`）。旧的 `create` 和 `truncate` 参数被废弃。`@fs.mkdir` 的权限参数变为可选，默认是 `0o755`
        
    - 新增了 `@fs.rename`，可以用于异步地执行文件重命名操作
        
    - 新增了 `@fs.Directory::next`，它会返回一个 `@fs.DirectoryEntry` 结构体，其中包含文件名和一些额外信息，例如文件是否是一个子目录
        
    -  `@fs.File::as_dir` 不再被废弃，后续可以正常使用
        

---
description: "Running WebAssembly-based MoonBit compiler using `rusty_v8`"
slug: moonbit-wasm-compiler
image: /img/blogs/2025-07-03-moonbit-wasm-compiler/cover.png
tags: [MoonBit]
---

# Running WebAssembly-based MoonBit compiler using `rusty_v8`

![](./cover.png)

## Preface

Programming language toolchains face many challenges when distributed across platforms, primarily due to differences in operating systems, hardware architectures, and user environments. For instance, different CPU architectures (such as x86, ARM, RISC-V, etc.) have different instruction sets. Binary files compiled for a specific architecture cannot be directly run on other architectures. Moreover, even on the same CPU architecture, different operating systems or compilers may use different ABIs (Application Binary Interfaces). This affects function calling conventions, data structure layouts, etc., resulting in incompatible compiled libraries or executables.

Container-based distribution technology solves some of the complexities of toolchain distribution, but the file sizes for distribution are often too large and not as convenient to use. Reproducible build technologies like nix/guix are relatively convenient to use but have high learning costs. Furthermore, none of the above technologies address another issue: how to embed the toolchain as a portable component into other tools?

Considering the above, to facilitate MoonBit users in running the MoonBit toolchain on more platforms and to enable the MoonBit toolchain as an embeddable component, we used `wasm_of_ocaml` to compile `moonc`, `moonfmt`, and `mooninfo`, written in OCaml, into wasm files. After testing, the wasm version of the toolchain has good compilation performance and more flexible calling methods.

## Running with nodejs

Wasmoo officially recommends running the compiled wasm files with nodejs. The specific installation steps are as follows:

> Note: The following installation steps are not applicable to Windows users. This is because the shebang we added to the js script output by wasmoo along with the wasm file is for Unix-like systems.

*   Pull the repository: [https://github.com/moonbitlang/moonbit-compiler](https://github.com/moonbitlang/moonbit-compiler)

```shell
git clone https://github.com/moonbitlang/moonbit-compiler
cd moonbit-compiler
```

*   Create the `$HOME/.moon` directory

```shell
mkdir -p $HOME/.moon
```

*   Build and install Moon yourself according to `node/moon_version` under the moonbit-compiler project root directory:

```shell
MOON_VERSION=$(cat ./node/moon_version)
MOON_HOME="$HOME/.moon"
BIN_DIR="$MOON_HOME/bin"
mkdir -p "$BIN_DIR"
git clone https://github.com/moonbitlang/moon
cd moon
git reset --hard "$MOON_VERSION"
cargo build --release
cp target/release/moon "$BIN_DIR"
cp target/release/moonrun "$BIN_DIR"
```

*   Copy the corresponding files to the `$HOME/.moon/bin` directory

```shell
pushd node
cp moonc.js moonfmt.js mooninfo.js moonc.assets moonfmt.assets mooninfo.assets "$BIN_DIR" -r
mv "$BIN_DIR/moonc.js" "$BIN_DIR/moonc"
mv "$BIN_DIR/moonfmt.js" "$BIN_DIR/moonfmt"
mv "$BIN_DIR/mooninfo.js" "$BIN_DIR/mooninfo"
chmod +x "$BIN_DIR/moonc"
chmod +x "$BIN_DIR/moonfmt"
chmod +x "$BIN_DIR/mooninfo"
cp lib include "$MOON_HOME"
popd
```

*   Download core, switch to the specified version, and then bundle core

```shell
CORE_VERSION=$(cat ./node/core_version)
git clone https://github.com/moonbitlang/core "$MOON_HOME/lib/core"
pushd "$MOON_HOME/lib/core"
git reset --hard "$CORE_VERSION"
moon bundle --target all
popd
```

For users with more complex needs, you can consider implementing the external APIs on which the runtime of `wasm_of_ocaml` depends. This will also allow you to run the wasm version of the MoonBit compiler.

## Running with `rusty_v8`

> The wasm/js files in the moonbit-compiler repository are all built using `wasm_of_ocaml-6.0.1`. The latest version of the `wasm_of_ocaml` API list has some differences. In the following, `wasm_of_ocaml` will be abbreviated as wasmoo.

Although wasmoo doesn't officially provide running methods other than Node, as long as the corresponding functions in the wasmoo's wasm loading script import object list are implemented, other wasm runtimes can also run the wasm version of the MoonBit compiler.

MoonBit's official tool for running wasm, moonrun, is written based on `rusty_v8`. Therefore, this section uses `rusty_v8` as an example to demonstrate how to implement the external APIs required by wasmoo.

### System API Overview

Some of the external APIs required by wasmoo are built into the JavaScript language, while others need to be provided by the JavaScript runtime. To use `rusty_v8` to run wasm files compiled by wasmoo, the first thing to do is implement all the functions in the API list that require a JavaScript runtime in Rust and connect them to v8.

Reading the js script output by wasmoo along with the wasm file reveals the following list of APIs:

```
getenv : JSString -> JSString
system : JSString -> Number
log : JSString -> undefined
is_file : JSString -> Number(1 | 0)
is_directory : JSString -> Number(1 | 0)
file_exists : JSString -> Number(1 | 0) // actually mains path_exists
chmod : JSString, u32 as PermissionMode -> undefined
truncate: JSString, u64 as Length -> undefined
open : JSString as Path, i32 as Flags, Number as PermissionMode -> i32 as FileDescriptor
close : i32 as FileDescriptor -> undefined
access : JSString as Path, i32 as Mode -> undefined
write: i32 as FileDescriptor, UInt8Array as Buffer, i32 as Offset, i32 as Length, null as Position -> Number
read: i32 as FileDescriptor, UInt8Array as Buffer, i32 as Offset, i32 as Length, null as Position -> Number
fsync: i32 as FileDescriptor -> undefined
file_size: i32 as FileDescriptor -> BigInt
utimes: JSString as Path, F64 as AccessTime, F64 as ModifyTime -> undefined
exit: i32 -> undefined
isatty: i32 as FileDescriptor -> Number(1 | 0)
getcwd: () -> JSString
chdir: JSString -> undefined
mkdir: JSString as Path, i32 as Mode -> undefined
rmdir: JSString as Path -> undefined
unlink: JSString as Path -> undefined
readdir: JSString as Path -> Array<String>
stat : JSString as Path -> Object
lstat : JSString as Path -> Object
fstat: i32 as FileDescriptor -> Object
fchmod: i32 as FileDescriptor, i32 as Mode -> undefined
ftruncate: i32 as FileDescriptor, u64 as Length -> undefined
rename: JSString as OldPath, JSString as NewPath -> undefined
decode_utf8: Uint8Array -> JSString
encode_into: JSString, Uint8Array -> Object { read, written }
```

The above are *pseudo-type annotations* for these APIs, but should be easy to understand for developers familiar with JavaScript and Rust. The tricky parts of implementing these APIs include:

*   Correctly handle the translation of wasmoo constants to system API options.
*   Efficiently exchanging data between v8 and Rust (most often when handling UInt8Array)

### How to Implement API

Writing js functions using `rusty_v8` requires obtaining three essential v8 components: `v8::HandleScope`, `v8::FunctionCallbackArguments`, and `v8::ReturnValue`

*   `v8::HandleScope` is responsible for managing the lifecycle and memory of V8 objects, and it is also needed for conversions between V8 object handles and Rust objects.
*   `v8::FunctionCallbackArguments` stores the arguments of a JS function.
*   `v8::ReturnValue` is responsible for receiving the return value of a JS function.

Taking the `getenv` function as an example, the first argument can be obtained through `args.get(0)`, and a Rust string can be obtained from a V8 string using `to_string(scope).unwrap()` and `to_rust_string_lossy(scope)`. Finally, `ret.set()` is used to pass the return value. Using this mechanism makes writing Rust code less type-safe, so caution is required.

```rust
fn getenv(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut ret: v8::ReturnValue,
) {
    let var = args.get(0);
    let var = var.to_string(scope).unwrap();
    let var = var.to_rust_string_lossy(scope);
    match std::env::var(var) {
        Ok(val) => {
            let val = v8::String::new(scope, &val).unwrap();
            ret.set(val.into())
        }
        Err(_) => {
            let val = v8::undefined(scope);
            ret.set(val.into())
        }
    }
}
```

#### `getenv : JSString -> JSString`

The `getenv` function is used to access the value of an environment variable, returning `undefined` if the environment variable does not exist.

#### `system : JSString -> Number`

The `system` function is used to execute shell commands, and its return value is the exit code of the command. It should throw an exception when the command fails to execute.

#### `log : JSString -> undefined`

The `log` function prints a string to standard output and automatically adds a newline character.

#### `is_file : JSString -> Number(1 | 0)`

The `is_file` function determines whether a path is a file. It returns `1` if it is a file, and `0` otherwise.

#### `is_directory : JSString -> Number(1 | 0)`

The `is_directory` function checks if a path is a directory. It returns `1` if it is a directory, and `0` otherwise.

#### `file_exists : JSString -> Number(1 | 0)`

The `file_exists` function checks if a path exists.

#### `chmod : JSString, PermissionMode -> undefined`

The `chmod` function modifies the permission bits of a file based on the given path and permission mode, where the permission mode is an unsigned 32-bit integer (refer to using the chmod command in Unix systems).

#### `truncate: JSString, u64 as Length -> undefined`

The `truncate` function truncates a file to a specified length

#### `open : JSString as Path, i32 as Flags, Number as PermissionMode -> i32 as FileDescriptor`

The `open` function opens or creates a file according to the specified `path`, `flags`, and `mode` (file permissions), and returns the corresponding file descriptor. Because it uses custom open flags (although the constant definitions have a clear correspondence with the POSIX standard open flags constants), care must be taken to handle the passed flags to ensure that they are mapped to the correct options.

Due to wasmoo's limitations, file descriptors must be implemented as signed 32-bit integers (i32). In Rust, an i32 can be mapped to the `File` type via a Map data structure (how to stuff this data structure into v8's **context slot** is another topic, which will be detailed below).

```rust
// File Descriptor Table
// The file descriptor representation uses i32, keep consistent with the wasm_of_ocaml runtime
pub struct FdTable {
    map: HashMap<i32, File>,
    next_fd: i32,
}

impl FdTable {
    pub fn new() -> FdTable {
        FdTable {
            map: HashMap::new(),
            next_fd: 3,
        }
    }
    fn add(&mut self, file: File) -> i32 {
        ...
    }
    fn get(&self, fd: i32) -> Result<&File, String> {
        ...
    }

    fn get_mut(&mut self, fd: i32) -> Result<&mut File, String> {
        ...
    }

    fn remove(&mut self, fd: i32) -> Option<File> {
        ...
    }
}

// open flags for wasm_of_ocaml
const O_RDONLY: i32 = 1;
const O_WRONLY: i32 = 2;
const O_RDWR: i32 = 4;
const O_APPEND: i32 = 8;
const O_CREAT: i32 = 16;
const O_TRUNC: i32 = 32;
const O_EXCL: i32 = 64;
const O_NONBLOCK: i32 = 128;
const O_NOCTTY: i32 = 256;
const O_DSYNC: i32 = 512;
const O_SYNC: i32 = 1024;
```

#### `close : FileDescriptor -> undefined`

The `close` function closes the file corresponding to a file descriptor

#### `access : JSString as Path, i32 as Mode -> undefined`

The `access` function receives a file path and a mode as parameters and is used to test specific file permissions. If the file or directory at the specified path exists, and the calling process has all the permissions requested by the mode parameter, the function will execute successfully and return undefined.

```rust
// access flags for wasm_of_ocaml
const R_OK: i32 = 8;
const W_OK: i32 = 4;
const X_OK: i32 = 2;
const F_OK: i32 = 1;
```

#### `write: i32 as FileDescriptor, UInt8Array as Buffer, i32 as Offset, i32 as Length, null as Position -> Number`

The `write` function writes data from the specified byte array to the output destination identified by the file descriptor. Here, it is necessary to determine whether the file identifier is standard output/standard error output and handle it specially.

```rust
// wasm_of_ocaml compile Unix.(stdin, stdout, stderr) to constants (0, 1, 2)
const STDIN: i32 = 0;
const STDOUT: i32 = 1;
const STDERR: i32 = 2;
```

#### `read: i32 as FileDescriptor, UInt8Array as Buffer, i32 as Offset, i32 as Length, null as Position -> Number`

The `read` function reads data from the input destination identified by the file descriptor and stores it in the specified byte array.

> This function implementation does not handle the case where the file descriptor is standard input because the MoonBit compiler does not obtain information from standard input.

#### `fsync: i32 as FileDescriptor -> undefined`

`fsync` forces all pending write data (including file content and metadata) associated with the specified file descriptor to be flushed to the actual underlying storage device.

#### `file_size: i32 as FileDescriptor -> BigInt`

`file_size` reads the file size of the specified file.

#### `utimes: JSString as Path, F64 as AccessTime, F64 as ModifyTime -> undefined`

The `utimes` function sets the access and modification times of a given file according to the parameters.

#### `exit: i32 -> undefined`

The `exit` function terminates the execution of the current process.

#### `isatty: FileDescriptor -> Number(1 | 0)`

The  `isatty` function determines whether the given file descriptor corresponds to a terminal file

#### `getcwd: () -> JSString`

The  `getcwd` function gets the directory where the current program is located

#### `chdir: JSString -> undefined`

The  `chdir` function changes the directory where the current program is located

#### `mkdir: JSString as Path, i32 as Mode -> undefined`

The  `mkdir` function creates a new directory according to the given permission mode

#### `rmdir: JSString as Path -> undefined`

The `rmdir` function deletes the given directory.

#### `unlink: JSString as Path -> undefined`

The unlink function deletes the file/directory corresponding to the given path.

#### `readdir: JSString as Path -> Array<String>`

The `readdir` function reads the file/directory names under the specified directory path.

#### `stat : JSString as Path -> Object`

The `stat` function obtains detailed metadata information of the file or directory at the specified path. It returns a Js object containing the following properties:

*   `kind`: File type (e.g., file, directory, character device, block device, symbolic link, FIFO, socket, etc.).

*   `dev`: Device ID.

*   `ino`: inode number.

*   `mode`: File mode (permissions and file type).

*   `nlink`: Number of hard links.

*   `uid`: Owner user ID.

*   `gid`: Owner group ID.

*   `rdev`: Device ID (if the file is a character or block special file).

*   `size`: File size in bytes.

*   `atime`: Last access time.

*   `mtime`: Last modification time.

*   `ctime`: Last status change time.


#### `lstat : JSString as Path -> Object`

The `lstat` function is essentially the same as the `stat` function, except that it does not directly follow symbolic links. Instead, it returns the meta-information of the symbolic link itself.

#### `fstat: i32 as FileDescriptor -> Object`

The `fstat` function is essentially the same as the `stat` function, except that it accepts a file descriptor as a parameter.

#### `fchmod: i32 as FileDescriptor, i32 as Mode -> undefined`

The `fchmod` function is essentially the same as the `chmod` function, except that it accepts a file descriptor as a parameter.

#### `ftruncate: i32 as FileDescriptor, u64 as Length -> undefined`

The `ftruncate` function is essentially the same as the `truncate` function, except that it accepts a file descriptor as a parameter.

#### `rename: JSString as OldPath, JSString as NewPath -> undefined`

The `rename` function moves the file/directory corresponding to the path given by the first argument to the path given by the second argument.

#### `decode_utf8: Uint8Array -> JSString`

`decode_utf8` decodes a UTF-8 string stored in a `UInt8Array` into a JavaScript string (utf16).

#### `encode_into: JSString, Uint8Array -> Object { read, written }`

The `encode_into` function encodes a JavaScript string into UTF-8 format and writes it to the provided `Uint8Array` buffer.

After execution, it returns a JavaScript Object containing two properties:

*   `read`: The number of UTF-16 encoded code units successfully read from the original `JSString`.
*   `written`: The number of UTF-8 bytes written to the `Uint8Array` buffer.

### Import the API into the Js environment

This step is completed by the `init_wasmoo` function

```rust
pub fn init_wasmoo<'s>(
    obj: v8::Local<'s, v8::Object>,
    scope: &mut v8::HandleScope<'s>,
) -> v8::Local<'s, v8::Object> {
    let getenv = v8::FunctionTemplate::new(scope, getenv);
    let getenv = getenv.get_function(scope).unwrap();
    let ident = v8::String::new(scope, "getenv").unwrap();
    obj.set(scope, ident.into(), getenv.into());

    let system = v8::FunctionTemplate::new(scope, system);
    let system = system.get_function(scope).unwrap();
    let ident = v8::String::new(scope, "system").unwrap();
    obj.set(scope, ident.into(), system.into());

    ...

    obj
}
```

For the complete implementation code, please refer to: https://github.com/moonbitlang/moonc_wasm/blob/main/src/wasmoo_extern.rs

### Start v8 and load the wasm file

After implementing the external API required by wasmoo, the next step is to start v8 in an appropriate manner and instantiate wasm through js scripts. This step is implemented by the function `run_wasmoo`.

```rust
fn run_wasmoo(module_name: &str, argv: Vec<String>) -> anyhow::Result<()> {
    ...
}
```

Before that, there are still two things to do: load the wasm file and initialize v8.

Loading the wasm file is achieved through the function `load_wasm_file`. To avoid repeated IO (and for easy packaging), the Rust macro `include_bytes!` is used in the function `load_wasm_file` to embed the wasm file directly into the source code as bytes. This function is added to the js environment in `init_wasmoo`.

```rust
fn load_wasm_file(
    scope: &mut v8::HandleScope,
    _args: v8::FunctionCallbackArguments,
    mut ret: v8::ReturnValue,
) {
    let contents = Vec::from(include_bytes!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/moonc/moonc.wasm")));
    let len = contents.len();
    let array_buffer = v8::ArrayBuffer::with_backing_store(
        scope,
        &v8::ArrayBuffer::new_backing_store_from_bytes(contents).make_shared(),
    );
    let uint8_array = v8::Uint8Array::new(scope, array_buffer, 0, len).unwrap();
    ret.set(uint8_array.into());
}
```

When initializing v8, you need to manually increase the stack space by using flags.

```rust
fn initialize_v8() -> anyhow::Result<()> {
    v8::V8::set_flags_from_string(&format!("--stack-size={}", 102400));
    v8::V8::set_flags_from_string("--experimental-wasm-exnref");
    v8::V8::set_flags_from_string("--experimental-wasm-imported-strings");
    let platform = v8::new_default_platform(0, false).make_shared();
    v8::V8::initialize_platform(platform);
    v8::V8::initialize();
    Ok(())
}
```

`run_wasmoo` needs to initialize the mapping table required by the file descriptor related API.

```rust
    let context = v8::Context::new(scope, Default::default());
    // setup file descriptor table
    context.set_slot(wasmoo_extern::FdTable::new());
    let scope = &mut v8::ContextScope::new(scope, context);
```

Finally, `run_wasmoo` also needs to correctly handle the command-line argument array passed to the wasm file. In the v8 environment established here, the command-line argument array corresponds to a global variable `process_argv`.

> In fact, the way wasmoo passes the command-line argument array is to put it in the wasm's import list. This will be apparent when parsing the wasm's bootstrap script later.

```rust
    // setup argv
    let process_argv = v8::Array::new(scope, argv.len() as i32);
    for (i, s) in argv.iter().enumerate() {
        let s = v8::String::new(scope, s).unwrap();
        process_argv.set_index(scope, i as u32, s.into());
    }
    let ident = v8::String::new(scope, "process_argv").unwrap();
    global_proxy.set(scope, ident.into(), process_argv.into());
```

It can be seen that the task of `run_wasmoo` is just to stuff the parameters that need to be passed at runtime into the js script and the v8 environment. The details of loading wasm and finally executing the task are in the script `js_glue_for_wasmoo.js`: https://github.com/moonbitlang/moonc_wasm/blob/main/src/moonc/js_glue_for_wasmoo.js

This script has a very complex import list

```javascript
  const bindings = {
    ......
    getcwd,
    chdir,
    mkdir,
    rmdir,
    unlink,
    argv: () => process_argv,
    readdir: (p) => read_dir(p),
    stat: (p, l) => alloc_stat(stat(p), l),
    lstat: (p, l) => alloc_stat(lstat(p), l),
    fstat: (fd, l) => alloc_stat(fstat(fd), l),
    ......
}

const importObject = {
    Math: math,
    bindings,
    js,
    "wasm:js-string": string_ops,
    "wasm:text-decoder": string_ops,
    "wasm:text-encoder": string_ops,
    env: {},
};

importObject.OCaml = {};
```

The complexity of this import list lies in the fact that many of its functions recursively call functions exported from wasm (in addition to which, `importObject.OCaml` also needs to be reassigned with the export list).

The final step to start wasm requires importing the functions/objects from the export list into the js environment, and then calling the `_initialize` function exported from wasm.

```javascript
  let bytes = load_wasm_file();
  let wasm_module = new WebAssembly.Module(bytes, options);
  let instance = new WebAssembly.Instance(wasm_module, importObject);


  Object.assign(
    importObject.OCaml,
    instance.exports,
  );

  var {
    caml_callback,
    caml_alloc_times,
    caml_alloc_tm,
    caml_alloc_stat,
    caml_start_fiber,
    caml_handle_uncaught_exception,
    caml_buffer,
    caml_extract_bytes,
    string_get,
    string_set,
    _initialize,
  } = instance.exports;

  start_fiber = caml_start_fiber

  var buffer = caml_buffer?.buffer;
  var out_buffer = buffer && new Uint8Array(buffer, 0, buffer.length);

  await _initialize();
```

For the complete code, please see: https://github.com/moonbitlang/moonc_wasm

## Running in Other Environments

Although it hasn't been tried, in theory, as long as a set of APIs with sufficient behavioral compatibility is provided, the wasm version of the MoonBit toolchain can also run in other environments (such as browser environments using a virtual file system). We look forward to seeing you come up with more creative ways to use it!
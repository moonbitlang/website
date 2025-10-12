---
description: "Install the Wasm version of the MoonBit toolchain"
slug: moonbit-wasm-toolchain
image: /img/blogs/2025-10-10-moonbit-wasm-toolchain/cover.png
tags: [MoonBit]
---

# Install the Wasm version of the MoonBit toolchain

![](./cover.png)

As a modern programming language, MoonBit's native toolchain provides good and stable support for mainstream platforms (such as x86 Windows, x86 Linux, Arm Darwin). However, for certain specific user groups, such as older x86 Darwin (Intel Mac) users (native toolchain no longer supported) or developers eager to try it on Arm Linux (native toolchain not yet released), directly installing the native toolchain can be challenging.

Fortunately, thanks to the `wasm_of_ocaml` project officially released in early 2025, MoonBit's compiler toolchain can now be compiled into WebAssembly (Wasm) files and launched via a Node.js script. This means that we can use this Wasm-ized toolchain on any platform that supports Node.js.

This article will guide you step-by-step on how to install and configure the Wasm version of the MoonBit toolchain on the aforementioned platforms (or any Node.js-supported environment). Let's begin this journey of exploration!

## Prerequisites

Install bash (or zsh), curl, git, nodejs, and the rust toolchain. Then, follow the instructions below to execute the corresponding commands sequentially in the interactive mode of bash (or zsh).

> Since the wasm files compiled by `wasm_of_ocaml` require a runtime that supports wasm-gc to run correctly, a higher version of Node.js should be chosen during installation. It is recommended to install version **24.0.0** or higher.

## Installation Script

After installing the dependencies mentioned above, you can directly execute the following command to automatically install the WASM version of the MoonBit toolchain via a TypeScript script.

```shell
curl -fsSL https://raw.githubusercontent.com/moonbitlang/moonbit-compiler/refs/heads/main/install.ts | node
```

If you need more fine-grained control over the installation process, we also provide a manual installation guide. Please continue reading below.

## Download the compressed package

First, create a temporary directory anywhere, then execute the following command to download the latest WASM version of the MoonBit toolchain compressed package:

```shell
curl -fSL -O https://github.com/moonbitlang/moonbit-compiler/releases/latest/download/moonbit-wasm.tar.gz
tar -zxvf moonbit-wasm.tar.gz
```

Next, you need to set the `MOON_HOME` environment variable. The value of this variable is the directory where MoonBit toolchain-related files are stored, defaulting to `~/.moon`.

```shell
export MOON_HOME="$HOME/.moon"
```

## Install the corresponding version of moon

MoonBit's build system, `moon`, is written in Rust and is open source. You can clone the repository locally using git and then manually build and install it using Rust's build tools. The key is to install the correct version (because many parts of the build system and compiler are tightly coupled). In the compressed package of the wasm version of the MoonBit toolchain, there is a file `moon_version` that records the git commit SHA corresponding to that version of `moon`. You can use `git reset --hard` to switch to the corresponding commit.

```shell
mkdir -p $HOME/.moon
MOON_VERSION=$(cat ./moon_version)
BIN_DIR="$MOON_HOME/bin"
mkdir -p "$BIN_DIR"
git clone https://github.com/moonbitlang/moon
pushd moon
git reset --hard "$MOON_VERSION"
cargo build --release
```

The built binaries are located in the `./target/release` directory, namely `moon` and `moonrun`. `moon` is the build system, and `moonrun` is the wasm runtime officially provided by MoonBit. To facilitate running tests, we install it along with `moon`.

```shell
cp target/release/moon "$BIN_DIR"
cp target/release/moonrun "$BIN_DIR"
popd
```

## Install moonc/moonfmt/mooninfo/runtime dependencies

The WASM version of the MoonBit toolchain includes: the compiler (moonc), the formatter (moonfmt), and the mbti file generator (mooninfo). After being compiled into WASM, they need to be bootstrapped with a Node.js script. Before placing them in `MOON_HOME/bin`, a suitable shebang needs to be added to these JS scripts:

> To avoid stack overflow issues with the WASM version of the MoonBit toolchain, the V8 engine's stack size limit needs to be increased using the Node.js parameter `--stack-size`.

```shell
sed -i '1 i #!'"$(which env) -S node --stack-size=4096" moonc.js
sed -i '1 i #!'"$(which env) -S node --stack-size=4096" moonfmt.js
sed -i '1 i #!'"$(which env) -S node --stack-size=4096" mooninfo.js
```

Then, the script files (and some runtime files) need to be placed in the correct location and given executable permissions.

```shell
cp moonc.js moonfmt.js mooninfo.js moonc.assets moonfmt.assets mooninfo.assets "$BIN_DIR" -r

mv "$BIN_DIR/moonc.js" "$BIN_DIR/moonc"
mv "$BIN_DIR/moonfmt.js" "$BIN_DIR/moonfmt"
mv "$BIN_DIR/mooninfo.js" "$BIN_DIR/mooninfo"

chmod +x "$BIN_DIR/moonc"
chmod +x "$BIN_DIR/moonfmt"
chmod +x "$BIN_DIR/mooninfo"

cp lib include "$MOON_HOME" -r
```

## Install core

After installing the compiler and build system, we also need to install the corresponding version of the standard library. Similar to the build system, the standard library and the compiler have a very strong coupling relationship, so the versions need to match precisely. In the compressed package of the wasm version of the MoonBit toolchain, there is a `core.tar.gz` file, which contains the source code of the corresponding version of the standard library. After decompressing it to the specified location, execute the `moon bundle` command to package it for use.

> Due to the current mechanism of moonc's bundle implementation, the `.core` file generated by the wasm version of moonc will be slightly different from the native version, which is normal.

```shell
mkdir -p "$MOON_HOME/lib/core"cd
tar -xf core.tar.gz --directory="$MOON_HOME/lib"
pushd "$MOON_HOME/lib/core"
export PATH="$MOON_HOME/bin:$PATH"
moon bundle --target all
popd
```

## Add `$HOME/.moon/bin` to `PATH`

The final step is to add the directory containing all MoonBit executables, `$HOME/.moon/bin`, to your system's PATH environment variable. This allows you to run commands like `moonc` and `moon` directly from anywhere.

*   bash

```shell
echo "export PATH=\"$MOON_HOME/bin:"'$PATH"' >> ~/.bashrc
```

*   zsh

```shell
echo "export PATH=\"$MOON_HOME/bin:"'$PATH"' >> ~/.zshrc
```

* fish

```shell
echo "fish_add_path $HOME/.moon/bin" >> ~/.config/fish/config.fish
```

## Summary

Now, you can try running `moon version --all` to verify your installation. Enjoy the modern programming experience brought by MoonBit!

If you encounter unexpected issues during installation, you can provide feedback in the issues section of the [moonbit-docs](https://github.com/moonbitlang/moonbit-docs) repository.

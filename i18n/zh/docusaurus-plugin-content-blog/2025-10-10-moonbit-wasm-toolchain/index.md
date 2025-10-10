---
description: "安装Wasm版的MoonBit工具链"
slug: moonbit-wasm-toolchain
image: /img/blogs/zh/2025-10-10-moonbit-wasm-toolchain/cover.png
tags: [MoonBit]
---

# 安装Wasm版的MoonBit工具链

![](./cover.png)

MoonBit 作为一门现代编程语言，其原生工具链为主流平台（如 x86 Windows、x86 Linux、Arm Darwin）提供了良好而稳定的支持。然而，对于某些特定用户群体，例如 x86 Darwin (Intel Mac) 的老用户（原生工具链已不再支持）或期待在 Arm Linux 上尝鲜的开发者（原生工具链尚未推出），直接安装原生工具链会遇到困难。

幸运的是，得益于2025年初正式发布的 `wasm_of_ocaml` 项目，MoonBit 的编译器工具链现在可以被编译为 WebAssembly (Wasm) 文件，并通过一个 Node.js 脚本来启动运行。这意味着，在任何支持 Node.js 的平台上，我们都可以使用这套 Wasm 化的工具链。

本文将手把手指导您如何在上述平台（或任何支持 Node.js 的环境）上安装和配置 Wasm 版本的 MoonBit 工具链。让我们开始这段探索之旅吧！

## 前置需求

安装bash(或者zsh), curl, git, nodejs以及rust工具链, 然后按照以下说明在bash(或zsh)的交互模式下依次执行相应命令。

> 由于wasm_of_ocaml编译出的wasm文件需要支持wasm-gc的运行时才能正常运行，在安装nodejs时需要选择较高版本。此处建议安装**24.0.0**及以上版本。

## 安装脚本

在安装好上述依赖之后，你可以直接执行下面的命令，通过一个typescript脚本自动安装wasm版MoonBit工具链。

```shell
curl -fsSL https://raw.githubusercontent.com/moonbitlang/moonbit-compiler/refs/heads/main/install.ts | node
```

如果你有更精细地控制安装过程的需求，我们也提供了一份手动安装的指南，请继续往下看。

## 下载压缩包

首先在任意位置新建一个临时目录，然后执行以下命令下载最新的Wasm版MoonBit工具链压缩包:

```shell
curl -fSL -O https://github.com/moonbitlang/moonbit-compiler/releases/latest/download/moonbit-wasm.tar.gz
tar -zxvf moonbit-wasm.tar.gz
```

接着需要设置`MOON_HOME`环境变量，这个环境变量的值是存放MoonBit工具链相关文件的目录，默认为`~/.moon`。

```shell
export MOON_HOME="$HOME/.moon"
```

## 安装对应版本moon

MoonBit的构建系统`moon`使用Rust编写并已经开源，使用git复制仓库到本地然后使用rust语言的构建工具手动构建安装即可。关键在于需要安装到正确的版本(因为构建系统和编译器的许多地方是强耦合的)，在wasm版MoonBit工具链的压缩包里有一个文件`moon_version`记录了该版本`moon`对应的git commit sha，使用`git reset --hard`即可切换到对应commit。



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

构建好的二进制文件位于`./target/release`目录下，分别为`moon`和`moonrun`, `moon`就是构建系统, `moonrun`则是MoonBit官方提供的wasm运行时，为了方便跑测试我们把它和`moon`一并安装上。

```shell
cp target/release/moon "$BIN_DIR"
cp target/release/moonrun "$BIN_DIR"
popd
```

## 安装moonc/moonfmt/mooninfo/运行时依赖

wasm版的MoonBit工具链包括：编译器(moonc)，格式化工具(moonfmt)和mbti文件生成工具(mooninfo)。它们被编译成wasm后需要用一个nodejs脚本进行引导，在放到`$MOON_HOME/bin`之前，首先需要为这些js脚本添加一个合适的shebang:

> 为了避免wasm版MoonBit工具链出现爆栈的问题，需要通过nodejs的参数`--stack-size`调高v8引擎的栈大小限制

```shell
sed -i '1 i #!'"$(which env) -S node --stack-size=4096" moonc.js
sed -i '1 i #!'"$(which env) -S node --stack-size=4096" moonfmt.js
sed -i '1 i #!'"$(which env) -S node --stack-size=4096" mooninfo.js
```

然后需要将脚本文件(以及一些运行时文件)放到正确的位置并加上可执行权限。

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

## 安装core

在安装好编译器和构建系统之后，我们还需要安装对应版本的标准库。和构建系统一样，标准库和编译器之间也有非常强的耦合关系，所以版本需要精确对应。在wasm版MoonBit工具链的压缩包里有一个`core.tar.gz`文件，它的内容就是对应版本的标准库源码，解压到指定位置后执行`moon bundle`命令打包即可使用。

> 由于目前moonc实现bundle的机制，wasm版的moonc所产生的.core文件会和native版本有一定不同，这是正常的

```shell
mkdir -p "$MOON_HOME/lib/core"cd
tar -xf core.tar.gz --directory="$MOON_HOME/lib"
pushd "$MOON_HOME/lib/core"
export PATH="$MOON_HOME/bin:$PATH"
moon bundle --target all
popd
```

## 将`$HOME/.moon/bin`添加到`PATH`

最后一步，我们需要将包含所有 MoonBit 可执行文件的目录 $HOME/.moon/bin 添加到系统的 PATH 环境变量中，这样我们才能在任何地方直接运行 moonc, moon 等命令。

+ bash

```shell
echo "export PATH=\"$MOON_HOME/bin:"'$PATH"' >> ~/.bashrc
```

+ zsh

```shell
echo "export PATH=\"$MOON_HOME/bin:"'$PATH"' >> ~/.zshrc
```

## 总结

现在，您可以尝试运行`moon version --all` 来验证您的安装是否成功。享受 MoonBit 带来的现代化编程体验吧！

如果您在安装过程中遇到了意料之外的问题，您可以在[moonbit-docs](https://github.com/moonbitlang/moonbit-docs)仓库的issues下进行反馈。
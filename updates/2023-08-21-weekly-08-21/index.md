# Weekly 2023-08-21

Moonbit was introduced to the public last Friday, and we received a lot of positive feedback. This post is intended to provide updates on the changes to Moonbit's language and build system over the past week.

<!--truncate-->

### Changes in Moonbit Language

Major Changes in progress: Moonbit is developing a new handwritten recursive descent parser to improve the user development experience. It is expected to be integrated soon. The changes brought by the new parser are as follows:

1. The new parser will provide more precise syntax error prompts. For example, in the following code:

```
func init{
    if (someCondition) true else false
    ()
}
```

The old parser would prompt `"Parse error, unexpected token true, you may expect ( or \[ or {"`. The new parser will point out that writing true and false directly in the above code is illegal, and braces should be used here instead.

2. The new parser has a more complete auto-complete mechanism. For example, when the user intends to input the following code:

```
func f[X:Eq]
```

When the user writes `func f[X:E`, due to the lack of subsequent parameter lists and function bodies, the coarse-grained error recovery of the current parser makes the autocomplete prompt for Eq not work. The new parser can provide autocompletion for interface restrictions such as Eq, Show, etc.

3. The new parser is more powerful in error recovery. For example:

```
func init{
  let **nonsense = 100 + a.boolField
  ()
}
```

The above code has errors on both sides of the equal sign (`=`). The syntax error on the left side of `**nonsense` is `"Parse error, unexpected token infix 4, you may expect identifier"`. On the right side, there is a type mismatch error between an integer and a boolean addition.

The current parser can only prompt the error on the left side of the equal sign. The new parser can report both errors at the same time.

### Changes in MoonBit's build system

An introduction to the build system is available([MoonBit's Build System Tutorial](http://moonbitlang.com/blog/moon-build-system-tutorial/))

1. Added a `moon check -daemon` option, which can start a background daemon to perform type checking on a Moonbit project, eliminating the need to manually execute `moon check --watch` each time.

2. `moon check/build/run --tool commands` has been changed to `moon check/build/run --dry-run`, which is used to generate commands without executing them.

Before the change:

```
$ moon new hello && cd hello
$ moon check --tool commands
moonc check ./lib/hello.mbt -o ./target/build/lib/lib.mi -pkg hello/lib
moonc check ./main/main.mbt -o ./target/build/main/main.mi -pkg hello/main -i ./target/build/lib/lib.mi
```

After the change:

```
$ moon new hello && cd hello
$ moon check --dry-run
moonc check ./lib/hello.mbt -o ./target/build/lib/lib.mi -pkg hello/lib
moonc check ./main/main.mbt -o ./target/build/main/main.mi -pkg hello/main -i ./target/build/lib/lib.mi
```

3. Now `moon run` requires specifying the path to the main package, resolving the issue of uncertain execution entry points when multiple main packages exist.

Before the change:

```
$ moon new hello && cd hello
$ moon run
Hello, world!
```

After the change:

```
$ moon new hello && cd hello
$ moon run ./main
Hello, world!
```

4. `moon new ` `<` `module_name>` will create only one directory even if `<module_name>` contains `'/'`. For example, `moon new ` `example.com/lib/stack` - Before the change: it would create three-level directories `example.com/lib/stack` in the file system - After the change: it only creates one directory `stack`

5. Fixed an issue where if the `moon check/build/run` command only specified `--source-dir` but did not specify `--target-dir`, the default path of the target directory was not under `--source-dir`.

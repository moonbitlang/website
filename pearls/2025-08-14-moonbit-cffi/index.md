---
description: 'A Guide to MoonBit C-FFI'
slug: moonbit-cffi
image: cover.png
---

# A Guide to MoonBit C-FFI

![](./cover.png)

---

## Introduction

MoonBit is a modern functional programming language featuring a robust type system, highly readable syntax, and a toolchain designed for AI. However, reinventing the wheel is not always the best approach. Countless time-tested, high-performance libraries are written in C (or languages with a C-compatible ABI, like C++, Rust). From low-level hardware manipulation to complex scientific computing and graphics rendering, the C ecosystem is a treasure trove of powerful tools.

So, can we make the modern MoonBit work in harmony with these classic C libraries, allowing the pioneers of the new world to wield the powerful tools of the old? The answer is a resounding yes. Through the C Foreign Function Interface (C-FFI), MoonBit can call C functions, bridging these two worlds.

This article will be your guide, leading you step-by-step through the mysteries of MoonBit's C-FFI. We will use a concrete example—creating MoonBit bindings for a C math library called `mymath`—to learn how to handle different data types, pointers, structs, and even function pointers.

## Prerequisites

To connect to any C library, we need to know the functions in its header file, how to find the header file, and how to find the library file. For our task, the header file for the C math library is `mymath.h`. It defines the various functions and types we want to call from MoonBit. We'll assume `mymath` is installed on the system, and we'll use `-I/usr/include` to find the header file and `-L/usr/lib -lmymath` to link the library during compilation. Here is a part of our `mymath.h`:

```c
// mymath.h

// --- Basic Functions ---
void print_version();
int version_major();
int is_normal(double input);

// --- Floating-Point Calculations ---
float sinf(float input);
float cosf(float input);
float tanf(float input);
double sin(double input);
double cos(double input);
double tan(double input);

// --- Strings and Pointers ---
int parse_int(char* str);
char* version();
int tan_with_errcode(double input, double* output);

// --- Array Operations ---
int sin_array(int input_len, double* inputs, double* outputs);
int cos_array(int input_len, double* inputs, double* outputs);
int tan_array(int input_len, double* inputs, double* outputs);

// --- Structs and Complex Types ---
typedef struct {
  double real;
  double img;
} Complex;

Complex* new_complex(double r, double i);
void multiply(Complex* a, Complex* b, Complex** result);
void init_n_complexes(int n, Complex** complex_array);

// --- Function Pointers ---
void for_each_complex(int n, Complex** arr, void (*call_back)(Complex*));
```

## The Groundwork

Before writing any FFI code, we need to build the bridge between MoonBit and C code.

### Compiling to Native

First, the MoonBit code needs to be compiled into native machine code. This can be done with the following command:

```bash
moon build --target native
```

This command will compile your MoonBit project into C code and then use the system's C compiler (like GCC or Clang) to compile it into a final executable. The compiled C files are located in the `target/native/release/build/` directory, stored in subdirectories corresponding to the package name. For example, `main/main.mbt` will be compiled to `target/native/release/build/main/main.c`.

### Configuring Linkage

Compilation alone is not enough. We also need to tell the MoonBit compiler how to find and link to our `mymath` library. This is configured in the project's `moon.pkg.json` file.

```json
{
  "supported-targets": ["native"],
  "link": {
    "native": {
      "cc": "clang",
      "cc-flags": "-I/usr/include",
      "cc-link-flags": "-L/usr/lib -lmymath"
    }
  }
}
```

- `cc`: Specifies the compiler to use for C code, e.g., `clang` or `gcc`.
- `cc-flags`: Flags needed when compiling C files, typically used to specify header search paths (`-I`).
- `cc-link-flags`: Flags needed during linking, typically used to specify library search paths (`-L`) and the specific libraries to link (`-l`).

We also need a "glue" C file, which we'll name `cwrap.c`, to include the C library's header file and MoonBit's runtime header file.

```c
// cwrap.c
#include <mymath.h>
#include <moonbit.h>
```

This glue file also needs to be declared to the MoonBit compiler via `moon.pkg.json`:

```json
{
  // ... other configurations
  "native-stub": ["cwrap.c"]
}
```

With these configurations in place, our project is ready to link with the `mymath` library.

## The First FFI Call

With everything set up, let's make our first true cross-language call. To declare an external C function in MoonBit, the syntax is as follows:

```moonbit
extern "C" fn moonbit_function_name(arg: Type) -> ReturnType = "c_function_name"
```

- `extern "C"`: Tells the MoonBit compiler that this is an external C function.
- `moonbit_function_name`: The function name used in the MoonBit code.
- `"c_function_name"`: The name of the C function to link to.

Let's try it out with the simplest function in `mymath.h`, `version_major`:

```moonbit
extern "C" fn version_major() -> Int = "version_major"
```

> **Note**: MoonBit has powerful Dead Code Elimination (DCE). If you only declare the FFI function above but never actually call it in your code (e.g., in the `main` function), the compiler will consider it unused code and will not include its declaration in the final generated C code. So, make sure you call it at least once!

## Navigating the Type System Chasm

The real challenge lies in handling the data type differences between the two languages. For some complex type situations, readers will need some C language knowledge.

### 3.1 Basic Types

For basic numeric types, there is a direct and clear correspondence between MoonBit and C.

| MoonBit Type | C Type                | Notes                                                                      |
| ------------ | --------------------- | -------------------------------------------------------------------------- |
| `Int`        | `int`                 |                                                                            |
| `Int64`      | `int64_t`             |                                                                            |
| `UInt`       | `unsigned int`        |                                                                            |
| `UInt64`     | `uint64_t`            |                                                                            |
| `Float`      | `float`               |                                                                            |
| `Double`     | `double`              |                                                                            |
| `Bool`       | `int`                 | The C standard does not have a native `bool`, `int` (0/1) is usually used. |
| `Unit`       | `void` (return value) | Used to represent that a C function has no return value.                   |
| `Byte`       | `uint8_t`             |                                                                            |

Based on this table, we can easily write FFI declarations for most of the simple functions in `mymath.h`:

```moonbit
extern "C" fn print_version() -> Unit = "print_version"
extern "C" fn version_major() -> Int = "version_major"

// The return value is semantically a boolean, using MoonBit's Bool type is clearer
extern "C" fn is_normal(input: Double) -> Bool = "is_normal"

extern "C" fn sinf(input: Float) -> Float = "sinf"
extern "C" fn cosf(input: Float) -> Float = "cosf"
extern "C" fn tanf(input: Float) -> Float = "tanf"

extern "C" fn sin(input: Double) -> Double = "sin"
extern "C" fn cos(input: Double) -> Double = "cos"
extern "C" fn tan(input: Double) -> Double = "tan"
```

### 3.2 Strings

Things get interesting when we encounter strings. You might instinctively map C's `char*` to MoonBit's `String`, but this is a common pitfall.

MoonBit's `String` and C's `char*` have completely different memory layouts. `char*` is a pointer to a ` `-terminated sequence of bytes, while MoonBit's `String` is a GC-managed, complex object containing length information and UTF-16 encoded data.

**Passing Arguments: From MoonBit to C**

When we need to pass a MoonBit string to a C function that accepts a `char*` (like `parse_int`), we need to perform a manual conversion. A recommended approach is to convert it to the `Bytes` type.

```moonbit
// A helper function to convert a MoonBit String to the null-terminated byte array expected by C
fn string_to_c_bytes(s: String) -> Bytes {
  let mut arr = s.to_bytes().to_array()
  // Ensure it's null-terminated
  if arr.last() != Some(0) {
    arr.push(0)
  }
  Bytes::from_array(arr)
}

// FFI declaration, note the parameter type is Bytes
#borrow(s) // Tell the compiler we are just borrowing s, don't increase its reference count
extern "C" fn __parse_int(s: Bytes) -> Int = "parse_int"

// Wrap it in a user-friendly MoonBit function
fn parse_int(str: String) -> Int {
  let s = string_to_c_bytes(str)
  __parse_int(s)
}
```

> **The `#borrow` Annotation**
> The `borrow` annotation is an optimization hint. It tells the compiler that the C function only "borrows" this parameter and will not take ownership of it. This can avoid unnecessary reference counting operations and prevent potential memory leaks.

**Return Values: From C to MoonBit**

Conversely, when a C function returns a `char*` (like `version`), the situation is more complex. We absolutely must not declare it to return `Bytes` or `String` directly:

```moonbit
// Incorrect!
extern "C" fn version() -> Bytes = "version"
```

This is because the C function returns a raw pointer, which lacks the header information required by the MoonBit GC. A direct conversion like this will lead to a runtime crash.

The correct approach is to treat the returned `char*` as an opaque handle, and then write a conversion function in the C "glue" code to manually convert it into a valid MoonBit string.

**MoonBit side:**

```moonbit
// 1. Declare an external type to represent the C string pointer
#extern
type CStr

// 2. Declare an FFI function that calls the C wrapper
extern "C" fn CStr::to_string(self: Self) -> String = "cstr_to_moonbit_str"

// 3. Declare the original C function, which returns our opaque type
extern "C" fn __version() -> CStr = "version"

// 4. Wrap it in a safe MoonBit function
fn version() -> String {
  __version().to_string()
}
```

**C side (add to `cwrap.c`):**

```c
#include <string.h> // for strlen

// This function is responsible for correctly converting a char* to a moonbit_string_t with a GC header
moonbit_string_t cstr_to_moonbit_str(char *ptr) {
  if (ptr == NULL) {
    return moonbit_make_string(0, 0);
  }
  int32_t len = strlen(ptr);
  // moonbit_make_string allocates a MoonBit string object with a GC header
  moonbit_string_t ms = moonbit_make_string(len, 0);
  for (int i = 0; i < len; i++) {
    ms[i] = (uint16_t)ptr[i]; // Assuming ASCII compatibility
  }
  // Note: Whether to free(ptr) depends on the C library's API contract.
  // If the memory returned by version() needs to be freed by the caller, it should be freed here.
  return ms;
}
```

This pattern, while a bit cumbersome at first glance, ensures memory safety and is the standard way to handle C string return values.

### 3.3 The Art of Pointers: Passing by Reference and Arrays

C extensively uses pointers for "output parameters" and passing arrays. MoonBit provides specialized types for this.

**"Output" Parameters for a Single Value**

When a C function uses a pointer to return an additional value, like `tan_with_errcode(double input, double* output)`, MoonBit uses the `Ref[T]` type.

```moonbit
extern "C" fn tan_with_errcode(input: Double, output: Ref[Double]) -> Int = "tan_with_errcode"
```

`Ref[T]` in MoonBit is a struct containing a single field of type `T`. When passed to C, MoonBit passes the address of this struct. From C's perspective, a pointer to `struct { T val; }` is equivalent in memory address to a pointer to `T`, so it works directly.

**Arrays: Passing Collections of Data**

When a C function needs to process an array (e.g., `double* inputs`), MoonBit uses the `FixedArray[T]` type. `FixedArray[T]` is a contiguous block of `T` elements in memory, and its pointer can be passed directly to C.

```moonbit
extern "C" fn sin_array(len: Int, inputs: FixedArray[Double], outputs: FixedArray[Double]) -> Int = "sin_array"
extern "C" fn cos_array(len: Int, inputs: FixedArray[Double], outputs: FixedArray[Double]) -> Int = "cos_array"
extern "C" fn tan_array(len: Int, inputs: FixedArray[Double], outputs: FixedArray[Double]) -> Int = "tan_array"
```

### 3.4 External Types: Embracing Opaque C Structs

For C `struct`s, like `Complex`, the best practice is usually to treat it as an "Opaque Type". We only create a reference (or handle) to it in MoonBit, without caring about its internal fields.

This is achieved with the `#extern type` syntax:

```moonbit
#extern
type Complex
```

This declaration tells MoonBit: "There is an external type named `Complex`. You don't need to know its internal structure, just treat it as a pointer-sized handle." In the generated C code, the `Complex` type will be treated as `void*`. This is usually safe because all operations on `Complex` are done within the C library, and the MoonBit side is only responsible for passing the pointer.

Based on this principle, we can write FFIs for the `Complex`-related functions in `mymath.h`:

```moonbit
// C: Complex* new_complex(double r, double i);
// Returns a pointer to Complex, which is a Complex handle in MoonBit
extern "C" fn new_complex(r: Double, i: Double) -> Complex = "new_complex"

// C: void multiply(Complex* a, Complex* b, Complex** result);
// Complex* corresponds to Complex, and Complex** corresponds to Ref[Complex]
extern "C" fn multiply(a: Complex, b: Complex, res: Ref[Complex]) -> Unit = "multiply"

// C: void init_n_complexes(int n, Complex** complex_array);
// Complex** is used as an array here, corresponding to FixedArray[Complex]
extern "C" fn init_n_complexes(n: Int, complex_array: FixedArray[Complex]) -> Unit = "init_n_complexes"
```

> **Best Practice: Encapsulate Raw FFIs**
> Directly exposing FFI functions can be confusing for users (e.g., `Ref` and `FixedArray`). It is strongly recommended to build a more user-friendly API for MoonBit users on top of the FFI declarations.
>
> ```moonbit
> // Define methods on the Complex type to hide FFI details
> fn Complex::mul(self: Complex, other: Complex) -> Complex {
>   // Create a temporary Ref to receive the result
>   let res: Ref[Complex] = Ref::{ val: new_complex(0, 0) }
>   multiply(self, other, res)
>   res.val // Return the result
> }
>
> fn init_n(n: Int) -> Array[Complex] {
>   // Use FixedArray::make to create the array
>   let arr = FixedArray::make(n, new_complex(0, 0))
>   init_n_complexes(n, arr)
>   // Convert FixedArray to the more user-friendly Array
>   Array::from_fixed_array(arr)
> }
> ```

### 3.5 Function Pointers: When C Needs to Call Back

The most complex function in `mymath.h` is `for_each_complex`, which takes a function pointer as an argument.

```c
void for_each_complex(int n, Complex** arr, void (*call_back)(Complex*));
```

A common misconception is to try to map MoonBit's closure type `(Complex) -> Unit` directly to a C function pointer. This is not possible because a MoonBit closure is internally a struct with two parts: a pointer to the actual function code, and a pointer to its captured environment data.

To pass a pure, environment-free function pointer, MoonBit provides the `FuncRef` type:

```moonbit
extern "C" fn for_each_complex(
  n: Int,
  arr: FixedArray[Complex],
  call_back: FuncRef[(Complex) -> Unit] // Use FuncRef to wrap the function type
) -> Unit = "for_each_complex"
```

Any function type wrapped in `FuncRef` will be converted to a standard C function pointer when passed to C.

> How to declare a `FuncRef`? Just use `let`. As long as the function does not capture external variables, the declaration will succeed.
>
> ```moonbit
> fn print_complex(c: Complex) -> Unit { ... }
>
> fn main {
>   let print_complex : FuncRef[(Complex) -> Unit] = (c) => print_complex(c)
>   // ...
> }
> ```

## Advanced Topic: GC Management

We have covered most of the type conversion issues, but there is still a very important issue: memory management. C relies on manual `malloc`/`free`, while MoonBit has automatic garbage collection (GC). When a C library creates an object (like `new_complex`), who is responsible for freeing it?

> **Can we do without GC?**
>
> Some library authors may choose not to implement GC, leaving all destruction operations to the user. This approach has its merits in some libraries, such as some high-performance computing libraries, graphics libraries, etc. To improve performance or stability, they may abandon some GC features, but this raises the bar for programmers. Most libraries still need to provide GC to enhance the user experience.

Ideally, we want MoonBit's GC to automatically manage the lifecycle of these C objects. MoonBit provides two mechanisms to achieve this.

### 4.1 The Simple Case

If the C struct is very simple and you are sure that its memory layout is stable across all platforms, you can redefine it directly in MoonBit.

```moonbit
// mymath.h: typedef struct { double real; double img; } Complex;
// MoonBit:
struct Complex {
  r: Double,
  i: Double
}
```

By doing this, `Complex` becomes a true MoonBit object. The MoonBit compiler will automatically manage its memory and add a GC header. When you pass it to a C function, MoonBit will pass a pointer to its data part, which is usually feasible.

**But this method has significant limitations**:

- It requires you to know the exact memory layout, alignment, etc., of the C struct, which can be fragile.
- If a C function returns a `Complex*`, you cannot use it directly. You must, like handling string return values, write a C wrapper function to **copy** the data from the C struct into a newly created MoonBit `Complex` object with a GC header.

Therefore, this method is only suitable for the simplest cases. For most scenarios, we recommend a more robust finalizer solution.

### 4.2 The Complex Situation: Using Finalizers

This is a more general and safer method. The core idea is to create a MoonBit object to "wrap" the C pointer and tell the MoonBit GC that when this wrapper object is collected, a specific C function (a finalizer) should be called to release the underlying C pointer.

This process involves several steps:

**1. Declare two types in MoonBit**

```moonbit
#extern
type C_Complex // Represents the raw, opaque C pointer

type Complex C_Complex // A MoonBit type that wraps a C_Complex internally
```

`type Complex C_Complex` is a special declaration that creates a MoonBit object type named `Complex`, which has an internal field of type `C_Complex`. We can access this internal field with the `.inner()` method.

**2. Provide a finalizer and wrapper functions in C**

We need a C function to free the `Complex` object, and a function to create our GC-enabled MoonBit wrapper object.

**C side (add to `cwrap.c`):**

```c
// The mymath library should provide a function to free Complex, let's assume it's free_complex
// void free_complex(Complex* c);

// We need a void* version of the finalizer for the MoonBit GC to use
void free_complex_finalizer(void* obj) {
    // The layout of a MoonBit external object is { void (*finalizer)(void*); T data; }
    // We need to extract the real Complex pointer from obj
    // Assuming the MoonBit Complex wrapper has only one field
    Complex* c_obj = *((Complex**)obj);
    free_complex(c_obj); // Call the real finalizer, if provided by the mymath library
    // free(c_obj); // If it was allocated with standard malloc
}

// Define what the MoonBit Complex wrapper looks like in C
typedef struct {
  Complex* val;
} MoonBit_Complex;

// Function to create the MoonBit wrapper object
MoonBit_Complex* new_mbt_complex(Complex* c_complex) {
  // `moonbit_make_external_obj` is the key
  // It creates a GC-managed external object and registers its finalizer.
  MoonBit_Complex* mbt_complex = moonbit_make_external_obj(
      &free_complex_finalizer,
      sizeof(MoonBit_Complex)
  );
  mbt_complex->val = c_complex;
  return mbt_complex;
}
```

**3. Use the wrapper function in MoonBit**

Now, instead of calling `new_complex` directly, we call our wrapper function `new_mbt_complex`.

```moonbit
// FFI declaration pointing to our C wrapper function
extern "C" fn __new_managed_complex(c_complex: C_Complex) -> Complex = "new_mbt_complex"

// The original C new_complex function returns a raw pointer
extern "C" fn __new_unmanaged_complex(r: Double, i: Double) -> C_Complex = "new_complex"

// The final, safe, GC-friendly new function provided to the user
fn Complex::new(r: Double, i: Double) -> Complex {
  let c_ptr = __new_unmanaged_complex(r, i)
  __new_managed_complex(c_ptr)
}
```

Now, when an object created by `Complex::new` is no longer used in MoonBit, the GC will automatically call `free_complex_finalizer`, safely freeing the memory allocated by the C library.

When we need to pass our managed `Complex` object to other C functions, we just use the `.inner()` method:

```moonbit
// Assume there is a C function `double length(Complex*);`
extern "C" fn length(c_complex: C_Complex) -> Double = "length"

fn Complex::length(self: Self) -> Double {
  // self.inner() returns the internal C_Complex (i.e., the C pointer)
  length(self.inner())
}
```

## Conclusion

This article has guided you through the process of C-FFI in MoonBit, from basic types to complex struct types and function pointer types. Finally, it discussed the GC problem of MoonBit managing C objects. We hope this will be helpful for the library development of our readers.

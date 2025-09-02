---
description: "Value type and bits pattern in MoonBit, 30% faster than Rust!"
slug: moonbit-value-type
image: /img/blogs/2025-09-02-moonbit-value-type/cover.jpg
tags: [MoonBit]
---

# Value type and bits pattern in MoonBit, 30% faster than Rust!

![](./cover.jpg)

We’re happy to share that **MoonBit** now includes two new language features: **Value Type and Bits Pattern**.

These additions make the language more expressive and significantly improve performance on both the Wasm and Native backends.
They’re already available in the latest compiler release and are actively evolving.

This post walks through real examples showing how these features work and how they boost performance — aiming to answer a core question:
**Can MoonBit match or even outperform Rust in both expressiveness and execution speed?**
## Two New Language Features

## Value Type

You can now mark `struct` and `tuple struct` as **value types** using the `#valtype` annotation.
 This avoids heap allocation and GC overhead, improving runtime efficiency.

Example:
```moonbit
#valtype
pub(all) struct Complex {
  real : Double
  imag : Double
}
```
The example above defines a struct for representing complex numbers and uses `#valtype` to enable value-type semantics, avoiding heap allocation. With this setup, we can implement numerical algorithms like **Fast Fourier Transform (FFT)**more efficiently.

Compared to the same code without`#valtype` the performance improvement is substantial.We also benchmarked this implementation against equivalent versions written in **Rust** and **Swift**. The results are shown in the chart below:

![alt text](image.png)

In the chart, the x-axis shows the logarithm of the input size for the FFT computation, while the y-axis shows the execution time of the FFT function.

Benchmark results indicate that **MoonBit outperforms mainstream languages in numerical computing**:
 it **runs 33% faster than Rust** and **133% faster than Swift** for the same FFT workload.

All benchmarks were conducted on a MacBook Pro equipped with an Apple M1 Pro chip (10-core CPU with 8 performance cores and 2 efficiency cores) and 32 GB of unified memory, running macOS 14.5 with Darwin Kernel Version 23.6.0. The machine model identifier is MacBookPro18,3. The software environment included Rustc 1.89.0 (2025-08-04), Swift 6.1.2 (swift-6.1.2-RELEASE, target: arm64-apple-macosx14.0) and MoonBit 0.6.26.

The core FFT implementation is shown below — from left to right: **Rust, Swift, and MoonBit**.
 Full benchmark code is available in our GitHub repository: https://github.com/moonbit-community/benchmark-fft

![alt text](image-1.png)

## Bits Pattern: Parse byte streams like writing a spec
**Bits pattern** matching lets you extract arbitrary-length bit segments directly in pattern matches, with support for both **big-endian** and **little-endian** layouts. It brings your code closer to how protocol specs are written — eliminating the need for manual shifting, masking, or byte-order handling. This feature is especially useful for **network protocol parsing** and **batch processing of binary data**.

- Example: Parsing an IPv4 header
```mbt
pub fn parse_ipv4(ipv4 : @bytes.View) -> Ipv4  {
  match ipv4 {
    [ // version (4) + ihl (4)
      u4(4), u4(ihl),
      // DSCP (6) + ECN (2)
      u6(dscp), u2(ecn),
      // Total length
      u16(total_len),
      // Identification
      u16(ident),
      // Flags (1 reserved, DF, MF) + Fragment offset (13)
      u1(0), u1(df), u1(mf), u13(frag_off),
      // TTL + Protocol
      u8(ttl), u8(proto),
      // Checksum (store; we'll validate later)
      u16(hdr_checksum),
      // Source + Destination
      u8(src0), u8(src1), u8(src2), u8(src3),
      u8(dst0), u8(dst1), u8(dst2), u8(dst3),
      // Options (if any) and the rest of the packet
      .. ] => {
      let hdr_len = ihl.reinterpret_as_int() * 4
      let total_len = total_len.reinterpret_as_int()
      guard ihl >= 5
      guard total_len >= hdr_len
      guard total_len <= ipv4.length()
      let header = ipv4[:hdr_len]
      // checksum must be computed with checksum field zeroed
      guard ipv4_header_checksum_ok(header, hdr_checksum)
      let options = ipv4[20:hdr_len]
      let payload = ipv4[hdr_len:total_len]
      Ipv4::{
        ihl, dscp, ecn,
        total_len, ident,
        df: df != 0, mf: mf != 0,
        frag_off, ttl, proto, hdr_checksum,
        src: Ipv4Addr(src0, src1, src2, src3),
        dst: Ipv4Addr(dst0, dst1, dst2, dst3),
        options, payload,
      }
    }
    ...
  }
}
```
In this example, we use patterns like `u1`, `u4`, and `u13` to extract fields of specific bit lengths —
*almost exactly as defined in protocol documents*. This makes the code both easier to write and verify, freeing developers from dealing with bit shifts, masks, and byte order handling. Instead, they can focus directly on the business logic.

Beyond hand-written parsers, **Bits patterns also pave the way for automated protocol parser generation**.Since the pattern syntax closely mirrors how fields are defined in protocol specs (e.g. RFCs or IDLs), AI tools can generate parsing logic directly from the spec itself.

As a result, developers can simply provide a protocol definition and get back efficient, readable parser code — reducing both the engineering effort and the risk of errors that typically come with manual bit-level manipulations.

In fact, the MoonBit community recently demonstrated this through a real use case with [MoonBit Pilot](https://www.moonbitlang.com/blog/intro-moonbit-pilot), the built-in AI assistant (launched in July). After learning from an IPv4 parsing example, Pilot was able to generate a complete **IPv6 parser** using the same Bits pattern approach.

In short, **Bits Pattern not only improves manual development productivity, but also unlocks new possibilities for AI-assisted code generation.**

![alt text](image-2.png)
- Efficient Byte Sequence Matching
```mbt
pub fn equal(bs1 : @bytes.View, bs2 : @bytes.View) -> Bool {
  if bs1.length() != bs2.length() { return false }
  loop (bs1, bs2) {
    ([u64le(batch1), .. rest1], [u64le(batch2), .. rest2]) => {
      // compare 8 bytes at a time
      if batch1 != batch2 { return false }
      continue (rest1, rest2)
    }
    (rest1, rest2) => {
      for i in 0..<rest1.length() {
        if rest1[i] != rest2[i] { return false }
      }
      return true
    }
  }
}
```
In the example above, we use **Bits pattern** to extract an 8-byte segment from the byte stream in a single match, enabling **batch comparison**.
This approach leverages low-level instructions for better performance.The `le` suffix specifies **little-endian** layout, which is optimal on most native platforms that use little-endian memory representation.
Compared to traditional byte-by-byte comparisons, this method significantly improves runtime efficiency.

## Conclusion

With the introduction of **Bits Pattern** and **Value Type**, MoonBit now offers powerful support for two core scenarios:**byte-level protocol parsing** and **high-performance numerical computing**.
These features significantly enhance both the expressiveness and execution efficiency of the language.Together, they allow developers to write clean, elegant code for low-level data processing and compute-intensive tasks —while achieving performance that rivals, or even surpasses, mainstream programming languages.
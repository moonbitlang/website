---
description: "Announcing MoonBit Beta"
slug: beta-release
image: /img/blogs/2025-06-18-beta-release/cover.png
tags: [MoonBit]
---

# Announcing MoonBit Beta

![cover](cover.png)

Today we’re very proud to announce the beta release of MoonBit — a programming language designed for tooling *(AI focused)* and user experience.

MoonBit supports multiple targets including WebAssembly, JavaScript and Native. Feature-wise, it is very close to Rust with GC but shipped with robust and extremely fast tooling.

If you’d like to experiment with MoonBit, the [MoonBit Tour](https://tour.moonbitlang.com/) is the best place to start — complete with interactive examples and built-in value tracing.

## What does it mean for MoonBit to be beta?

The MoonBit language has gone through rapid evolution over the past two years. That journey has been full of experiments, user feedback, and fast iteration. As a result, MoonBit today is not only more capable, but also more coherent, consistent, and production-ready than ever before.

The Beta release marks a clear commitment: **MoonBit’s core language features are now stable**.

1. The language covers all essential features needed for daily programming
2. Language syntax is considered stable and changes will go through RFC process

While the language itself is stable, the standard library and toolchain will continue to improve. Work is underway to refine naming conventions, modularize packages, and simplify structure.

As we move forward, we’re placing a strong focus on documentation, package ecosystem growth, and community collaboration.

### Async and checked error handling are in beta

Unlike many languages where asynchronous support is delayed until 1.0, MoonBit ships builtin async support, checked error handling and provide nice IDE features to polish the user experience:

- **Safety**: All error propagation is statically checked by the compiler
- **Simplicity**: Async and error-aware functions are written just like regular ones—no `await`, no extra syntax
- **Readability**: The IDE visually highlights async and fallible operations—underlined for errors, italicized for async—without requiring extra annotations

---

Here’s a simplified version of the classic `cat` command implemented in MoonBit.
 It combines multiple async data sources and error paths, yet remains clear and concise—thanks to the language’s structured design and visual cues:

<pre className="shiki shiki-themes one-light one-dark-pro" tabIndex={0} style={{backgroundColor: 'rgb(250, 250, 250)', '--shiki-dark-bg': '#282c34', color: 'rgb(56, 58, 66)', '--shiki-dark': '#abb2bf'}}><code><span className="line"><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD', fontStyle:'italic'}}>async</span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}> fn </span><span style={{color: 'rgb(64, 120, 242)', '--shiki-dark': '#61AFEF', fontStyle: 'italic', textDecoration: 'underline', textUnderlineOffset: '0.3em' }}>cat</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>(</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}>files</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> : </span><span style={{color: 'rgb(193, 132, 1)', '--shiki-dark': '#E5C07B'}}>ArrayView</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>[</span><span style={{color: 'rgb(193, 132, 1)', '--shiki-dark': '#E5C07B'}}>String</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>]) </span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>-&gt;</span><span style={{color: 'rgb(193, 132, 1)', '--shiki-dark': '#E5C07B'}}> Unit</span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}> raise</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>{"  "}if</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}> files</span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}> is</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> [] {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#E5C07B'}}>{"    "}@async</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>.stdin.</span><span style={{color: 'rgb(64, 120, 242)', '--shiki-dark': '#61AFEF', fontStyle: 'italic', textDecoration: 'underline', textUnderlineOffset: '0.3em' }}>read_streaming</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>() </span><span style={{color: 'rgb(160, 161, 167)', fontStyle: 'italic', '--shiki-dark': '#7F848E', '--shiki-dark-font-style': 'italic'}}>// read from stdin only once</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"  "}{"}"} </span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>else</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>{"    "}for</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}> file</span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}> in</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}> files</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>{"      "}if</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}> file</span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}> is</span><span style={{color: 'rgb(80, 161, 79)', '--shiki-dark': '#98C379'}}> "-"</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#E5C07B'}}>{"        "}@async</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>.stdin.</span><span style={{color: 'rgb(64, 120, 242)', '--shiki-dark': '#61AFEF', fontStyle: 'italic', textDecoration: 'underline', textUnderlineOffset: '0.3em' }}>read_streaming</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>() </span><span style={{color: 'rgb(160, 161, 167)', fontStyle: 'italic', '--shiki-dark': '#7F848E', '--shiki-dark-font-style': 'italic'}}>// read from stdin</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>{"        "}continue</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"      "}{"}"} </span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>else</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#E5C07B'}}>{"        "}@async</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>.</span><span style={{color: 'rgb(64, 120, 242)', '--shiki-dark': '#61AFEF'}}>path</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>(</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}>file</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>).</span><span style={{color: 'rgb(64, 120, 242)', '--shiki-dark': '#61AFEF', fontStyle: 'italic', textDecoration: 'underline', textUnderlineOffset: '0.3em' }}>read_all</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>()</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"      "}{"}"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"    "}{"}"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"  "}{"}"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"}"}</span></span>{"\n"}</code></pre>

## Roadmap

We’re moving forward with a clear roadmap toward 1.0, which we expect to lunch in **2026**. If you’d like to help shape the future of MoonBit, we’d love to have you involved. From now on, all major language changes will follow a public RFC process—ensuring transparency and inviting community participation.

If you’d like to help shape the future of MoonBit, we’d love to have you involved. You can:

- 📄 Propose or comment on [RFCs](https://github.com/moonbitlang/moonbit-RFCs)
- [🐛 Report bugs or suggest improvements](https://github.com/moonbitlang/core/issues)
- 💬 Join discussions on [Discord](https://discord.gg/mNf8NG73Te )
- 📦 Contribute packages to [mooncakes.io](https://mooncakes.io/)—our growing package registry

MoonBit gets better with every idea, bug report, and line of code from the community.
 Join us on [GitHub](https://github.com/moonbitlang) and help build what comes next.
///|
using @html {
  a,
  button,
  code,
  div,
  h1,
  h2,
  h3,
  img,
  nothing,
  p,
  pre,
  section,
  source,
  span,
  text,
  video,
}

///|
using @rabbita {type Cmd, type Dispatch, type Html}

// ─── Model & Messages ─────────────────────────────────────────────────────

///|
struct Model {
  hero_tab : Int
  hero_anim : Bool
  copied_step : Int?
  highlighter : @shiki.Highlighter?
  carousel_idx : Int
}

///|
let init_model : Model = {
  hero_tab: 0,
  hero_anim: false,
  copied_step: None,
  highlighter: None,
  carousel_idx: 0,
}

///|
enum Msg {
  SelectTab(Int)
  LoadResult(Result[@shiki.Highlighter, Error])
  SelectCarousel(Int)
}

///|
fn update(dispatch : Dispatch[Msg], msg : Msg, model : Model) -> (Cmd, Model) {
  ignore(dispatch)
  match msg {
    SelectTab(t) =>
      (@rabbita.none, { ..model, hero_tab: t, hero_anim: not(model.hero_anim) })
    LoadResult(Ok(hl)) => (@rabbita.none, { ..model, highlighter: Some(hl) })
    LoadResult(Err(_)) => (@rabbita.none, model)
    SelectCarousel(i) => (@rabbita.none, { ..model, carousel_idx: i })
  }
}

// ─── Links ────────────────────────────────────────────────────────────────

///|
let docs_url : String = "https://docs.moonbitlang.com"

///|
let ide_url : String = "https://tour.moonbitlang.com"

// ─── Icons ────────────────────────────────────────────────────────────────

///|
/// Blue verified checkmark (Twitter-style)
fn icon_verified() -> Html {
  @svg.svg(view_box="0 0 22 22", width=16, height=16, class="voice-verified", [
    @svg.circle(cx=11, cy=11, r=11, fill="#1d9bf0"),
    @svg.path(
      d="M6 11.5L9.5 15L16 8",
      fill="none",
      stroke="white",
      stroke_width=2,
      attrs=@svg.Attrs::build().stroke_linecap("round").stroke_linejoin("round"),
    ),
  ])
}

///|
/// GitHub mark icon
fn icon_github() -> Html {
  @svg.svg(view_box="0 0 16 16", width=15, height=15, class="gh-icon", [
    @svg.path(
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z",
      fill="currentColor",
      stroke="none",
      stroke_width=0,
    ),
  ])
}

///|
/// Arrow-right icon for buttons
fn icon_arrow_right() -> Html {
  @svg.svg(view_box="0 0 24 24", width=16, height=16, class="btn-arrow-icon", [
    @svg.path(
      d="M5 12h14",
      fill="none",
      stroke="currentColor",
      stroke_width=2,
      attrs=@svg.Attrs::build().stroke_linecap("round").stroke_linejoin("round"),
    ),
    @svg.path(
      d="M12 5l7 7-7 7",
      fill="none",
      stroke="currentColor",
      stroke_width=2,
      attrs=@svg.Attrs::build().stroke_linecap("round").stroke_linejoin("round"),
    ),
  ])
}

///|
/// Two overlapping rectangles — copy
fn icon_copy() -> Html {
  @svg.svg(view_box="0 0 24 24", width=15, height=15, class="qs-copy-icon", [
    @svg.rect(
      x=9,
      y=9,
      width=13,
      height=13,
      rx=2,
      fill="none",
      stroke="currentColor",
      stroke_width=2,
    ),
    @svg.path(
      d="M 5 15 H 4 C 3 15 2 14 2 13 V 4 C 2 3 3 2 4 2 H 13 C 14 2 15 3 15 4 V 5",
      fill="none",
      stroke="currentColor",
      stroke_width=2,
    ),
  ])
}

///|
/// Checkmark — copy success
fn icon_check() -> Html {
  @svg.svg(view_box="0 0 24 24", width=15, height=15, class="qs-copy-icon", [
    @svg.path(
      d="M 5 12 L 10 17 L 19 7",
      fill="none",
      stroke="currentColor",
      stroke_width=2,
      attrs=@svg.Attrs::build().stroke_linecap("round").stroke_linejoin("round"),
    ),
  ])
}

// ─── Hero ─────────────────────────────────────────────────────────────────

///|
fn themed_block(hl : @shiki.Highlighter, src : String, lang : String) -> Html {
  div(class="code-themed", [
    hl.code_to_html_dual_themes(
      src,
      lang~,
      light="min-light",
      dark="github-dark-default",
    ),
  ])
}

///|
fn view_hero(dispatch : Dispatch[Msg], model : Model) -> Html {
  let src = code_tabs[model.hero_tab].src
  let code_block = match model.highlighter {
    Some(hl) => themed_block(hl, src, "moonbit")
    None => pre(class="code-block", [code(src)])
  }
  section(class="hero", [
    div(class="hero-inner", [
      div(class="hero-left", [
        h1(class="hero-title", [
          text("The Language and Toolchain "),
          span(class="hero-accent", "for Agents at Scale"),
        ]),
        p(class="hero-desc", "Reliable, readable, and fast."),
        div(class="hero-actions", [
          a(
            class="btn-primary btn-cta",
            href=docs_url,
            target=Blank,
            "Get Started",
          ),
          a(
            class="btn-secondary btn-icon btn-cta",
            href=ide_url,
            target=Blank,
            [text("Try Online"), icon_arrow_right()],
          ),
        ]),
      ]),
      div(class="hero-right", [
        div(
          class="hero-tabs",
          code_tabs.mapi(fn(i, t) {
            let cls = if i == model.hero_tab {
              "hero-tab hero-tab--active"
            } else {
              "hero-tab"
            }
            button(class=cls, on_click=dispatch(SelectTab(i)), t.label)
          }),
        ),
        div(class="hero-code", [
          div(
            class=if model.hero_anim {
              "hero-anim-wrap anim-a"
            } else {
              "hero-anim-wrap anim-b"
            },
            [code_block],
          ),
        ]),
      ]),
    ]),
  ])
}

// ─── Features ─────────────────────────────────────────────────────────────

///|
fn view_platform_svg() -> Html {
  @svg.svg(
    view_box="-20 0 540 320",
    width=500,
    height=300,
    class="feat-platform-svg",
    [
      @svg.defs([
        // Glow for the central hub
        @svg.radial_gradient(
          id="hubGlow",
          attrs=@svg.Attrs::build()
            .style("cx", "50%")
            .style("cy", "50%")
            .style("r", "50%"),
          [
            @svg.stop(
              attrs=@svg.Attrs::build()
                .style("offset", "0%")
                .style("stop-color", "var(--accent)")
                .style("stop-opacity", "0.2"),
            ),
            @svg.stop(
              attrs=@svg.Attrs::build()
                .style("offset", "100%")
                .style("stop-color", "var(--accent)")
                .style("stop-opacity", "0"),
            ),
          ],
        ),
        // Glow for Native (greenish)
        @svg.radial_gradient(
          id="nativeGlow",
          attrs=@svg.Attrs::build()
            .style("cx", "50%")
            .style("cy", "50%")
            .style("r", "50%"),
          [
            @svg.stop(
              attrs=@svg.Attrs::build()
                .style("offset", "0%")
                .style("stop-color", "#10b981")
                .style("stop-opacity", "0.15"),
            ),
            @svg.stop(
              attrs=@svg.Attrs::build()
                .style("offset", "100%")
                .style("stop-color", "#10b981")
                .style("stop-opacity", "0"),
            ),
          ],
        ),
        // Connecting line gradient
        @svg.linear_gradient(
          id="lineGrad",
          attrs=@svg.Attrs::build()
            .style("x1", "0%")
            .style("y1", "0%")
            .style("x2", "100%")
            .style("y2", "0%"),
          [
            @svg.stop(
              attrs=@svg.Attrs::build()
                .style("offset", "0%")
                .style("stop-color", "var(--accent)")
                .style("stop-opacity", "0.9"),
            ),
            @svg.stop(
              attrs=@svg.Attrs::build()
                .style("offset", "100%")
                .style("stop-color", "var(--muted)")
                .style("stop-opacity", "0.4"),
            ),
          ],
        ),
        // Clip path to show only the head of the rabbit logo
        @svg.clip_path(id="headClip", [
          @svg.rect(
            x=10,
            y=110,
            width=120,
            height=80,
            rx=24,
            fill="none",
            stroke="none",
            stroke_width=0,
          ),
        ]),
      ]),

      // Decorative hub glow
      @svg.circle(cx=70, cy=170, r=130, fill="url(#hubGlow)"),
      @svg.circle(cx=380, cy=170, r=100, fill="url(#nativeGlow)"),

      // Central Hub
      @svg.g([
        @svg.rect(
          x=10,
          y=110,
          width=120,
          height=120,
          rx=24,
          fill="var(--surface)",
          stroke="var(--border)",
          stroke_width=1,
        ),
        @svg.rect(
          x=10,
          y=110,
          width=120,
          height=120,
          rx=24,
          fill="var(--accent)",
          stroke="none",
          stroke_width=0,
          attrs=@svg.Attrs::build().style("fill-opacity", "0.9"),
        ),

        // Inline MoonBit Logo (Head only). Native viewBox was 30x45. 
        // Scale 1.7. Box center is (70, 170). Logo head center is (14.85, 19.15).
        // translate X: 70 - 14.85*1.7 = 44.7 (use 45). translate Y: 170 - 19.15*1.7 = 137.4 (use 138).
        @svg.g(
          attrs=@svg.Attrs::build().style(
            "transform", "translate(45px, 138px) scale(1.7)",
          ),
          [
            // Face
            @svg.path(
              d="M14.7916 37.4624C8.50107 37.4624 3.93384 33.822 3.93384 29.2657C3.93384 24.7095 7.23375 21.0159 14.7916 20.9627C22.3495 20.9095 25.756 24.7095 25.756 29.2657C25.756 33.822 20.7097 37.4624 14.7916 37.4624ZM20.5991 24.5988H9.17055C7.15614 24.5988 5.5232 26.2317 5.5232 28.2461C5.5232 30.2605 7.15614 31.8936 9.17055 31.8936C9.17055 31.8936 11.9536 30.6778 14.7633 30.6778C17.6663 30.6778 20.5991 31.8936 20.5991 31.8936C22.6135 31.8936 24.2465 30.2605 24.2465 28.2461C24.2465 26.2317 22.6135 24.5988 20.5991 24.5988Z",
              fill="white",
              attrs=@svg.Attrs::build()
                .style("fill-rule", "evenodd")
                .style("clip-rule", "evenodd"),
            ),
            // Right Ear
            @svg.path(
              d="M15.1897 21.1755L17.5316 5.31461C17.5316 5.31461 18.4364 0.790498 22.3218 0.843728C26.2072 0.896957 29.0281 6.80488 29.1346 11.5951C29.0584 17.7478 25.675 15.6796 23.8121 12.6596C23.8121 12.2871 19.2347 21.6013 19.2347 21.6013L15.1897 21.1755Z",
              fill="white",
              attrs=@svg.Attrs::build()
                .style("fill-rule", "evenodd")
                .style("clip-rule", "evenodd"),
            ),
            // Left Ear
            @svg.path(
              d="M14.5505 21.1755L12.2086 5.31461C12.2086 5.31461 11.3038 0.790498 7.41846 0.843728C3.53302 0.896957 0.712093 6.80488 0.605713 11.5951C0.681833 17.7478 4.06532 15.6796 5.92811 12.6596C5.92811 12.2871 10.5055 21.6013 10.5055 21.6013L14.5505 21.1755Z",
              fill="white",
              attrs=@svg.Attrs::build()
                .style("fill-rule", "evenodd")
                .style("clip-rule", "evenodd"),
            ),
            // Eyes and Nose Features
            @svg.path(
              d="M19.3429 29.5609L21.2244 28.195V27.4775L19.3429 26.1116V26.9463L20.1131 27.443L20.6742 27.8155V27.85L20.1131 28.2226L19.3429 28.7193V29.5609Z",
              fill="white",
            ),
            @svg.path(
              d="M18.8732 26.1115L16.9917 27.4774V28.1949L18.8732 29.5608V28.7261L18.103 28.2293L17.5418 27.8568V27.8223L18.103 27.4498L18.8732 26.9531V26.1115Z",
              fill="white",
            ),
            @svg.path(
              d="M11.5022 29.2648V28.8848H12.1462V26.8368H11.6182V26.5448C11.8942 26.4928 12.0902 26.4248 12.2582 26.3208H12.6062V28.8848H13.1822V29.2648H11.5022Z",
              fill="white",
            ),
            @svg.path(
              d="M10.0169 29.3169C9.43694 29.3169 9.06494 28.8049 9.06494 27.7809C9.06494 26.7609 9.43694 26.2649 10.0169 26.2649C10.5929 26.2649 10.9689 26.7649 10.9689 27.7809C10.9689 28.8049 10.5929 29.3169 10.0169 29.3169ZM10.0169 28.9529C10.3169 28.9529 10.5289 28.6329 10.5289 27.7809C10.5289 26.9369 10.3169 26.6289 10.0169 26.6289C9.71694 26.6289 9.50494 26.9369 9.50494 27.7809C9.50494 28.6329 9.71694 28.9529 10.0169 28.9529Z",
              fill="white",
            ),
            @svg.path(
              d="M12.2396 26.2559H12.6709V28.8199H13.2469V29.3295H11.4373V28.8199H12.0813V26.9015H11.5533V26.4909L11.6061 26.481C11.8775 26.4298 12.0651 26.3639 12.224 26.2656L12.2396 26.2559ZM12.2763 26.3855C12.1143 26.4828 11.9286 26.5481 11.6829 26.5981V26.7719H12.2109V28.9495H11.5669V29.1999H13.1173V28.9495H12.5413V26.3855H12.2763Z",
              fill="white",
              attrs=@svg.Attrs::build()
                .style("fill-rule", "evenodd")
                .style("clip-rule", "evenodd"),
            ),
            @svg.path(
              d="M9.37748 26.6759C9.22177 26.9125 9.12966 27.2771 9.12966 27.7808C9.12966 28.2865 9.22176 28.6563 9.37777 28.8976C9.53155 29.1355 9.74923 29.252 10.0168 29.252C10.2823 29.252 10.5001 29.1355 10.6544 28.8975C10.8109 28.6562 10.904 28.2863 10.904 27.7808C10.904 27.2793 10.811 26.9147 10.6547 26.6774C10.5006 26.4436 10.2829 26.3296 10.0168 26.3296C9.74843 26.3296 9.53087 26.4428 9.37748 26.6759ZM9.26917 26.6046C9.44678 26.3347 9.70523 26.2 10.0168 26.2C10.3267 26.2 10.585 26.336 10.763 26.6061C10.9387 26.8729 11.0337 27.2663 11.0337 27.7808C11.0337 28.2992 10.9387 28.6974 10.7632 28.9681C10.5856 29.242 10.3273 29.3816 10.0168 29.3816C9.70442 29.3816 9.44611 29.2421 9.26889 28.968C9.09389 28.6973 9 28.2991 9 27.7808C9 27.2645 9.09389 26.871 9.26917 26.6046ZM9.7739 26.6364C9.84771 26.5864 9.93014 26.564 10.0168 26.564C10.1035 26.564 10.1859 26.5864 10.2598 26.6364C10.3331 26.6861 10.3944 26.7607 10.4434 26.8595C10.5406 27.0554 10.5937 27.3554 10.5937 27.7808C10.5937 28.2102 10.5405 28.5149 10.4437 28.7146C10.3948 28.8152 10.3337 28.8915 10.2605 28.9426C10.1867 28.9941 10.104 29.0176 10.0168 29.0176C9.92962 29.0176 9.84695 28.9941 9.77316 28.9426C9.69993 28.8915 9.63884 28.8152 9.59 28.7146C9.49311 28.5149 9.44 28.2102 9.44 27.7808C9.44 27.3554 9.4931 27.0554 9.59025 26.8595C9.63925 26.7607 9.70054 26.6861 9.7739 26.6364ZM9.70641 26.9171C9.62256 27.0862 9.56966 27.3622 9.56966 27.7808C9.56966 28.2034 9.62255 28.4847 9.70665 28.658C9.74832 28.7438 9.79647 28.8008 9.84737 28.8363C9.8977 28.8714 9.95403 28.888 10.0168 28.888C10.0796 28.888 10.136 28.8714 10.1863 28.8363C10.2372 28.8008 10.2853 28.7438 10.327 28.658C10.4111 28.4847 10.464 28.2034 10.464 27.7808C10.464 27.3622 10.4111 27.0862 10.3272 26.9171C10.2858 26.8334 10.2378 26.7782 10.187 26.7438C10.1367 26.7097 10.0801 26.6936 10.0168 26.6936C9.95351 26.6936 9.89695 26.7097 9.84664 26.7438C9.79586 26.7782 9.7479 26.8334 9.70641 26.9171Z",
              fill="white",
              attrs=@svg.Attrs::build()
                .style("fill-rule", "evenodd")
                .style("clip-rule", "evenodd"),
            ),
          ],
        ),
      ]),

      // --- Connection Lines (Animated/Glowing) ---
      // Trunk - right touching the moonbit hub (130) and connecting to junction (160)
      @svg.path(
        d="M 130 170 L 160 170.01",
        fill="none",
        stroke="url(#lineGrad)",
        stroke_width=3,
        attrs=@svg.Attrs::build().stroke_linecap("round"),
      ),
      @svg.circle(cx=160, cy=170, r=5, fill="var(--accent)"),

      // Top Branch (WASM)
      @svg.path(
        d="M 160 170 C 180 170, 220 65, 270 65",
        fill="none",
        stroke="url(#lineGrad)",
        stroke_width=2,
        attrs=@svg.Attrs::build().stroke_linecap("round"),
      ),
      @svg.circle(
        cx=270,
        cy=65,
        r=4,
        fill="var(--muted)",
        attrs=@svg.Attrs::build().style("fill-opacity", "0.6"),
      ),

      // Middle Branch (Native)
      @svg.path(
        d="M 160 170 L 270 170.01",
        fill="none",
        stroke="url(#lineGrad)",
        stroke_width=2,
        attrs=@svg.Attrs::build().stroke_linecap("round"),
      ),
      @svg.circle(
        cx=270,
        cy=170,
        r=4,
        fill="var(--muted)",
        attrs=@svg.Attrs::build().style("fill-opacity", "0.6"),
      ),

      // Bottom Branch (JS)
      @svg.path(
        d="M 160 170 C 180 170, 220 275, 270 275",
        fill="none",
        stroke="url(#lineGrad)",
        stroke_width=2,
        attrs=@svg.Attrs::build().stroke_linecap("round"),
      ),
      @svg.circle(
        cx=270,
        cy=275,
        r=4,
        fill="var(--muted)",
        attrs=@svg.Attrs::build().style("fill-opacity", "0.6"),
      ),

      // --- Targets ---
      // Target 1: WebAssembly
      @svg.g([
        @svg.rect(
          x=270,
          y=20,
          width=240,
          height=90,
          rx=16,
          fill="var(--surface)",
          stroke="var(--border)",
          stroke_width=1,
        ),
        @svg.rect(
          x=270,
          y=20,
          width=240,
          height=90,
          rx=16,
          fill="#654FF0",
          stroke="none",
          stroke_width=0,
          attrs=@svg.Attrs::build().style("fill-opacity", "0.02"),
        ),
        // WASM icon
        @svg.rect(
          x=290,
          y=40,
          width=50,
          height=50,
          rx=12,
          fill="#654FF0",
          attrs=@svg.Attrs::build().style("fill-opacity", "0.15"),
        ),
        @svg.path(
          d="M 295 85 L 295 45 L 310 45 A 5 5 0 0 0 320 45 L 335 45 L 335 85 Z",
          fill="#654FF0",
        ),
        @svg.svg_text(
          x=331,
          y=77,
          text="WA",
          fill="#ffffff",
          attrs=@svg.Attrs::build()
            .dominant_baseline("middle")
            .style("font-size", "14px")
            .style("font-weight", "700")
            .style("text-anchor", "end"),
        ),
        @svg.svg_text(
          x=355,
          y=52,
          text="WebAssembly",
          fill="var(--text)",
          attrs=@svg.Attrs::build()
            .style("font-size", "18px")
            .style("font-weight", "700")
            .style("letter-spacing", "-0.3px"),
        ),
        @svg.svg_text(
          x=355,
          y=76,
          text=".wasm / Browser / Edge",
          fill="var(--muted)",
          attrs=@svg.Attrs::build()
            .style("font-size", "13px")
            .style("font-weight", "500"),
        ),
      ]),

      // Target 2: Native
      @svg.g([
        @svg.rect(
          x=270,
          y=125,
          width=240,
          height=90,
          rx=16,
          fill="var(--surface)",
          stroke="var(--border)",
          stroke_width=1,
        ),
        @svg.rect(
          x=270,
          y=125,
          width=240,
          height=90,
          rx=16,
          fill="#0f172a",
          stroke="none",
          stroke_width=0,
          attrs=@svg.Attrs::build().style("fill-opacity", "0.02"),
        ),
        // Terminal icon
        @svg.rect(x=290, y=145, width=50, height=50, rx=12, fill="#0f172a"),
        @svg.svg_text(
          x=300,
          y=177,
          text=">_",
          fill="#10b981",
          attrs=@svg.Attrs::build()
            .dominant_baseline("middle")
            .style("font-size", "18px")
            .style("font-family", "monospace")
            .style("font-weight", "700"),
        ),
        @svg.svg_text(
          x=355,
          y=157,
          text="Native Binaries",
          fill="var(--text)",
          attrs=@svg.Attrs::build()
            .style("font-size", "18px")
            .style("font-weight", "700")
            .style("letter-spacing", "-0.3px"),
        ),
        @svg.svg_text(
          x=355,
          y=181,
          text="Mac / Linux / Windows",
          fill="var(--muted)",
          attrs=@svg.Attrs::build()
            .style("font-size", "13px")
            .style("font-weight", "500"),
        ),
      ]),

      // Target 3: JavaScript
      @svg.g([
        @svg.rect(
          x=270,
          y=230,
          width=240,
          height=90,
          rx=16,
          fill="var(--surface)",
          stroke="var(--border)",
          stroke_width=1,
        ),
        @svg.rect(
          x=270,
          y=230,
          width=240,
          height=90,
          rx=16,
          fill="#F7DF1E",
          stroke="none",
          stroke_width=0,
          attrs=@svg.Attrs::build().style("fill-opacity", "0.05"),
        ),
        // JS icon
        @svg.rect(x=290, y=250, width=50, height=50, rx=12, fill="#F7DF1E"),
        @svg.svg_text(
          x=332,
          y=288,
          text="JS",
          fill="#000000",
          attrs=@svg.Attrs::build()
            .dominant_baseline("middle")
            .style("font-size", "20px")
            .style("font-weight", "800")
            .style("text-anchor", "end"),
        ),
        @svg.svg_text(
          x=355,
          y=262,
          text="JavaScript",
          fill="var(--text)",
          attrs=@svg.Attrs::build()
            .style("font-size", "18px")
            .style("font-weight", "700")
            .style("letter-spacing", "-0.3px"),
        ),
        @svg.svg_text(
          x=355,
          y=286,
          text=".js / Node.js / Deno",
          fill="var(--muted)",
          attrs=@svg.Attrs::build()
            .style("font-size", "13px")
            .style("font-weight", "500"),
        ),
      ]),
    ],
  )
}

///|
fn view_feat_term(snippet : TermSnippet, hl : @shiki.Highlighter?) -> Html {
  let code_html = match hl {
    Some(h) => themed_block(h, snippet.src, snippet.lang)
    None => pre(class="code-block", [code(snippet.src)])
  }
  div(class="feat-term", [code_html])
}

///|
fn view_feat_carousel(
  dispatch : Dispatch[Msg],
  model : Model,
  slides : Array[FeatureVisual],
) -> Html {
  let idx = model.carousel_idx % slides.length()
  let content = match slides[idx] {
    Img("") => div(class="feat-img-placeholder", [nothing])
    Img(url) => img(class="feat-carousel-img", src=url, alt="", nothing)
    Video(url) =>
      video(
        class="feat-video",
        autoplay=true,
        loop_=true,
        muted=true,
        attrs=@html.Attrs::build().playsinline(true),
        [source(src=url, type_="video/mp4")],
      )
    Term(snippet) => view_feat_term(snippet, model.highlighter)
    Carousel(_) => nothing
  }
  div(class="feat-carousel-outer", [
    div(class="feat-carousel", [content]),
    div(
      class="feat-carousel-dots",
      slides.mapi(fn(i, _) {
        let cls = if i == idx {
          "feat-carousel-dot feat-carousel-dot--active"
        } else {
          "feat-carousel-dot"
        }
        button(class=cls, on_click=dispatch(SelectCarousel(i)), [nothing])
      }),
    ),
  ])
}

///|
fn view_features(dispatch : Dispatch[Msg], model : Model) -> Html {
  let rows = feature_rows.mapi(fn(i, f) {
    let cls = if i % 2 == 0 { "feat-row" } else { "feat-row feat-row-flip" }
    let visual = match f.visual {
      Img("") => div(class="feat-img-placeholder", [nothing])
      Img(url) => img(class="feat-img", src=url, alt=f.heading, nothing)
      Video(url) =>
        video(
          class="feat-video",
          autoplay=true,
          loop_=true,
          muted=true,
          attrs=@html.Attrs::build().playsinline(true),
          [source(src=url, type_="video/mp4")],
        )
      Term(snippet) => view_feat_term(snippet, model.highlighter)
      Carousel(slides) => view_feat_carousel(dispatch, model, slides)
    }
    div(class=cls, [
      div(class="feat-text", [
        h2(class="feat-heading", f.heading),
        p(class="feat-body", f.body),
      ]),
      div(class="feat-visual", [visual]),
    ])
  })
  rows.insert(
    0,
    div(class="features-header", [h2(class="section-title", "Why MoonBit?")]),
  )
  section(class="features", rows)
}

// ─── Community ─────────────────────────────────────────────────────────────

///|
fn comm_block(title : String, see_all_url : String, content : Html) -> Html {
  div(class="comm-block", [
    div(class="comm-block-header", [
      h3(class="comm-block-title", title),
      if see_all_url == "" {
        nothing
      } else {
        a(class="comm-see-all btn-icon", href=see_all_url, target=Blank, [
          text("See all"),
          icon_arrow_right(),
        ])
      },
    ]),
    content,
  ])
}

///|
fn voice_card(v : Voice, duplicate? : Bool = false) -> Html {
  let base = match v.quote_original {
    None => "comm-voice-card"
    Some(_) => "comm-voice-card comm-voice-card--has-original"
  }
  let card_class = if duplicate {
    base + " comm-voice-card--duplicate"
  } else {
    base
  }
  div(class=card_class, [
    div(class="comm-voice-header", [
      img(
        class="comm-voice-avatar",
        src=v.avatar,
        alt=v.name,
        width=44,
        height=44,
        loading="lazy",
        nothing,
      ),
      div(class="comm-voice-meta", [
        div(class="comm-voice-name-row", [
          span(class="comm-voice-name", v.name),
          if v.verified {
            icon_verified()
          } else {
            nothing
          },
        ]),
        span(class="comm-voice-handle", v.handle),
      ]),
    ]),
    match v.quote_original {
      None => p(class="comm-voice-quote", v.quote)
      Some(original) =>
        div(class="comm-voice-quote-wrap", [
          p(class="comm-voice-quote comm-voice-quote--translated", v.quote),
          p(class="comm-voice-quote comm-voice-quote--original", original),
        ])
    },
    div(class="comm-voice-footer", [
      span(class="comm-voice-source", v.source),
      span(class="comm-voice-bio", v.bio),
    ]),
  ])
}

///|
fn view_voices() -> Html {
  let n = voices.length()
  let card_w = 340
  let gap = 16
  let one_set_px = n * (card_w + gap)
  let duration_s = n * 12
  let track_style = [
    "--voices-one-set-px: \{one_set_px}px",
    "animation-duration: \{duration_s}s",
  ]
  let originals : Array[Html] = []
  let duplicates : Array[Html] = []
  voices.each(fn(v) { originals.push(voice_card(v)) })
  voices.each(fn(v) { duplicates.push(voice_card(v, duplicate=true)) })
  voices.each(fn(v) { duplicates.push(voice_card(v, duplicate=true)) })
  voices.each(fn(v) { duplicates.push(voice_card(v, duplicate=true)) })
  section(class="voices-section", [
    div(class="voices-inner", [h2(class="section-title", "Community Voices")]),
    div(class="comm-voices-outer", [
      div(class="comm-voices-track", style=track_style, originals + duplicates),
    ]),
  ])
}

///|
fn view_community() -> Html {
  // Build cards array
  let cards : Array[Html] = projects.map(fn(proj) {
    a(class="comm-project-card", href=proj.url, target=Blank, [
      span(class="comm-project-name", proj.name),
      p(class="comm-project-desc", proj.desc),
    ])
  })
  // Chunk into batches of 3, cycling from start to pad the last batch
  let n_projects = cards.length()
  let n_batches = (n_projects + 2) / 3
  let batches : Array[Array[Html]] = []
  for b = 0; b < n_batches; b = b + 1 {
    let batch : Array[Html] = []
    for j = 0; j < 3; j = j + 1 {
      batch.push(cards[(b * 3 + j) % n_projects])
    }
    batches.push(batch)
  }
  // Compute animation timing. Keyframe is defined in CSS for N=3 batches.
  // If batch count changes, update the @keyframes comm-proj-cycle rule in styles.css.
  let n = batches.length()
  let slot_s = 5
  let duration_s = n * slot_s
  let batch_divs = batches.mapi(fn(i, batch_cards) {
    let delay_s = -(i * slot_s)
    div(
      class="comm-proj-batch",
      style=[
        "animation: comm-proj-cycle \{duration_s}s \{delay_s}s linear infinite",
      ],
      batch_cards,
    )
  })
  section(class="community", [
    div(class="community-inner", [
      div(class="community-header", [
        h2(class="section-title", "Build with Brilliant Minds"),
        p(
          class="community-desc",
          "MoonBit's open-source ecosystem is growing rapidly. Discover libraries, tools, and frameworks built by the community, or publish your own to mooncakes.io, the official MoonBit package registry.",
        ),
      ]),

      // Projects: cycling batches + see more link
      div(class="comm-projs-block", [
        div(class="comm-proj-outer", batch_divs),
        div(class="comm-links-row", [
          span(class="comm-links-label", "Explore more awesome projects in "),
          a(
            class="comm-link-btn btn-icon",
            href="https://github.com/moonbitlang",
            target=Blank,
            [icon_github(), text("moonbitlang")],
          ),
          span(class="comm-links-sep", ", "),
          a(
            class="comm-link-btn btn-icon",
            href="https://github.com/moonbit-community",
            target=Blank,
            [icon_github(), text("moonbit-community")],
          ),
          span(class="comm-links-sep", ", and "),
          a(
            class="comm-link-btn",
            href="https://mooncakes.io",
            target=Blank,
            "mooncakes.io",
          ),
        ]),
      ]),

      // Contributors grid
      div(
        class="comm-avatars",
        contribs.map(fn(c) {
          a(
            class="comm-avatar-link",
            href="https://github.com/\{c.login}",
            target=Blank,
            [
              img(
                class="comm-avatar",
                src="https://github.com/\{c.login}.png?size=80",
                alt=c.login,
                width=44,
                height=44,
                loading="lazy",
                nothing,
              ),
            ],
          )
        }),
      ),
    ]),
  ])
}

// ─── News + Roadmap ────────────────────────────────────────────────────────

///|
fn rdm_badge(status : RoadmapStatus) -> Html {
  match status {
    Done => span(class="rdm-badge rdm-badge--done", "Done")
    Active => span(class="rdm-badge rdm-badge--active", "In Progress")
    Planned => span(class="rdm-badge rdm-badge--planned", "Planned")
  }
}

///|
fn rdm_status_class(status : RoadmapStatus) -> String {
  match status {
    Done => "done"
    Active => "active"
    Planned => "planned"
  }
}

///|
fn view_news_roadmap() -> Html {
  section(class="news-roadmap-section", [
    div(class="news-roadmap-inner", [
      // ── Roadmap: horizontal timeline ─────────────────────────────────────
      div(class="nr-block", [
        div(class="nr-block-header", [h2(class="nr-block-title", "Roadmap")]),
        div(
          class="rdm-track-h",
          milestones.map(fn(m) {
            ignore(m.status)
            div(class="rdm-node-h", [
              div(class="rdm-node-h-top", [
                div(class="rdm-h-line rdm-h-line--left", [nothing]),
                div(class="rdm-dot", [nothing]),
                div(class="rdm-h-line rdm-h-line--right", [nothing]),
              ]),
              div(class="rdm-content-h", [
                span(class="rdm-period", m.period),
                h3(class="rdm-title", m.title),
                div(
                  class="rdm-items",
                  m.items.map(fn(item) { div(class="rdm-item", item) }),
                ),
              ]),
            ])
          }),
        ),
      ]),
      // ── News: 4-column horizontal grid ────────────────────────────────────
      div(class="nr-block", [
        div(class="nr-block-header", [
          h2(class="nr-block-title", "News"),
          a(
            class="comm-see-all btn-icon",
            href="https://www.moonbitlang.com/blog",
            target=Blank,
            [text("See all"), icon_arrow_right()],
          ),
        ]),
        div(
          class="news-grid",
          news_items.map(fn(n) {
            a(class="news-card", href=n.url, target=Blank, [
              if n.img == "" {
                div(class="news-card-img", [nothing])
              } else {
                img(class="news-card-img", src=n.img, alt=n.title, nothing)
              },
              div(class="news-card-body", [
                span(class="news-card-date", n.date),
                p(class="news-card-title", n.title),
              ]),
            ])
          }),
        ),
      ]),
    ]),
  ])
}

// ─── CTA ──────────────────────────────────────────────────────────────────

///|
fn view_quickstart() -> Html {
  section(class="quickstart", [
    div(class="quickstart-inner", [
      h2(
        class="quickstart-tagline",
        "Experience MoonBit: Code Faster, Perform Better!",
      ),
      a(class="btn-primary btn-icon btn-cta", href=ide_url, target=Blank, [
        text("Try Now"),
        icon_arrow_right(),
      ]),
    ]),
  ])
}

// ─── Root View ────────────────────────────────────────────────────────────

///|
fn view(dispatch : Dispatch[Msg], model : Model) -> Html {
  ignore(model.copied_step)
  div(class="site", [
    view_hero(dispatch, model),
    view_features(dispatch, model),
    view_voices(),
    view_community(),
    view_news_roadmap(),
    view_quickstart(),
  ])
}

// ─── Entry ────────────────────────────────────────────────────────────────

///|
/// NOTE: This program is only available in the js backend.
#warnings("-alert_unstable")
fn main {
  // Keep helper symbols reachable while related UI wiring is being iterated.
  ignore(icon_copy)
  ignore(icon_check)
  ignore(view_platform_svg)
  ignore(comm_block)
  ignore(rdm_badge)
  ignore(rdm_status_class)

  let (dispatch, app) = @rabbita.cell_with_dispatch(
    model=init_model,
    update~,
    view~,
  )
  @rabbita.new(app)
  ..with_init(
    @shiki.load(
      ["moonbit", "typescript"],
      ["min-light", "github-dark-default"],
      x => dispatch(LoadResult(x)),
    ),
  )
  .mount("rabbita-home")
}

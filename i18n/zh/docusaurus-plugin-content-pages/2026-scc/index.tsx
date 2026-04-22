import ContestLayout from '@site/src/components/ContestLayout'
import ContestNavbar, { items2026 } from '@site/src/components/ContestNavbar'
import styles from '@site/src/pages/2026-scc/styles.module.css'

export default function Page() {
  return (
    <ContestLayout
      heroImg='/img/2026-contest/kv.jpg'
      mobileHeroImg='/img/2026-contest/kv.jpg'
      qqGroupImg='/img/2026-contest/qq-group.png'
      heroBgColor='#09184c'
      heroBackdropImg='/img/2026-contest/kv.jpg'
    >
      <div className={styles.container}>
        <ContestNavbar activeIndex={0} items={items2026} qqGroup={false} />
        <ChineseContent />
      </div>
    </ContestLayout>
  )
}

function ChineseContent() {
  const recommendedProjectListPdf = encodeURI(
    '/files/2026-scc/2026 软件合成挑战赛推荐项目具体清单.pdf'
  )

  return (
    <>
      <section className={styles.intro}>
        <p>
          为响应人工智能与基础软件工程融合发展的整体方向，推动新一代软件工程模式的探索实践。本赛事以"
          <strong>AI 原生软件工厂</strong>"为核心理念，探索在
          <strong>大模型与 MoonBit 编程语言及工具链协同</strong>
          条件下，如何将复杂软件的开发过程，从依赖个人经验的一次性实现，逐步转变为
          <strong>可复用、可演进、可持续的软件工程流程</strong>。
        </p>
        <p>
          本赛事面向希望成为 MoonBit 生态奠基者的开发者，鼓励参赛者充分发挥
          <strong>大模型在代码生成、结构推演与工程协作方面的优势</strong>
          ，并结合 MoonBit 在类型系统、工具链与工程约束方面的能力，合成
          <strong>具备工程可行性、可维护性和长期价值的高质量软件系统</strong>。
        </p>
        <p>
          赛事通过提出软件方向参考和工程质量底线要求，在保障项目工程可行性的基础上，鼓励参赛者结合自身技术判断与探索实践，形成多样化的软件合成方案，逐步提升项目的工程成熟度与可持续性。
        </p>
        <div className={styles.introBtn}>
          <a
            href='https://bxup9uklfcb.feishu.cn/share/base/form/shrcn7TOywKY9ALnNzgocPEp0pc'
            target='_blank'
            className='button button--primary button--lg'
          >
            立即报名
          </a>
          <a href='/2026-scc/showcase/' className='button button--primary button--lg'>
            查看作品
          </a>
        </div>
      </section>

      <section id='timeline'>
        <h2>一、赛程关键时间点</h2>
        <ul>
          <li>
            <strong>申报启动：</strong>2026 年 2 月 9 日
          </li>
          <li>
            <strong>申报截止：</strong>2026 年 3 月 20 日
          </li>
          <li>
            <strong>申报评审：</strong>赛事组滚动审核申报书，审核将在申报 2
            周内邮件通知预答辩
          </li>
          <li>
            <strong>开发周期：</strong>预答辩通过，代码提交次数满足要求后
          </li>
          <li>
            <strong>评选截至：</strong>2026 年 4 月 21 日
          </li>
          <li>
            <strong>统一答辩与优秀作品评选：</strong>2026 年 4 月 27 日（暂定）
          </li>
        </ul>

        <h3>参赛对象与形式</h3>
        <ol>
          <li>
            本赛事仅接受<strong>个人参赛</strong>，不设团队赛。
          </li>
          <li>不限是否在校生或在职人员。</li>
          <li>鼓励高校学生参与。</li>
        </ol>
      </section>

      <section id='direction'>
        <h2>二、项目方向</h2>
        <p>
          参赛者须围绕<strong>高质量软件工程</strong>
          主题，自主选择软件合成项目方向，完成一个具备工程可行性与长期演进潜力的软件系统。赛事鼓励参赛者在满足基本工程质量要求的前提下，探索不同的软件形态与系统设计路径，不限定具体实现方式。
        </p>
      </section>

      <section id='types'>
        <h2>三、项目类型参考（不限于以下方向）</h2>
        <p>
          不知道从哪里开始？
          我们准备了一份推荐项目方向清单，既包含经典工程方向，也包含具有挑战性的进阶主题，欢迎参考并延展。
          <a href={recommendedProjectListPdf} target='_blank' rel='noreferrer'>
            👉 点击查看推荐项目清单
          </a>
        </p>
        <p>项目类型包括但不限于：</p>
        <ul>
          <li>电子表格核心系统（Spreadsheet Core）</li>
          <li>轻量级数据库内核（Database Core）</li>
          <li>文档 / PDF 处理引擎（Document Processing Engine）</li>
          <li>游戏引擎内核（Game Engine Core）</li>
          <li>定理证明工具（Proof Assistant）</li>
          <li>软件分析框架（Software Analysis Frameworks）</li>
        </ul>
        <p>同时，以下方向亦属于本赛事鼓励范围：</p>
        <ul>
          <li>静态网站生成器</li>
          <li>日志采集与查询系统</li>
          <li>自动化构建或任务流水线系统</li>
          <li>面向 LLM 的推理或服务框架</li>
          <li>2D 绘图、原型设计工具</li>
          <li>3D 建模或几何处理工具</li>
          <li>音视频处理与转码工具</li>
        </ul>
        <p>
          以及其他
          <strong>
            具备长期工程价值的系统型软件项目（除 MoonBit 生态已有项目）
          </strong>
          。
        </p>
        <p className={styles.note}>
          注：上述示例仅作为方向参考，不构成限制性要求。
        </p>
      </section>

      <section id='process'>
        <h2>四、参赛流程</h2>

        <h3>阶段一：信息收集与递交申报书</h3>
        <h4>1. 个人信息收集</h4>
        <p>
          参赛者需通过官方申报在线表单填写基本个人信息：
          <a
            href='https://bxup9uklfcb.feishu.cn/share/base/form/shrcn7TOywKY9ALnNzgocPEp0pc'
            target='_blank'
          >
            https://bxup9uklfcb.feishu.cn/share/base/form/shrcn7TOywKY9ALnNzgocPEp0pc
          </a>
        </p>
        <p>
          线上表单主要用于参赛者身份确认与基础信息采集，不作为项目评审的唯一依据。
        </p>

        <h4>2. 项目申报书具体提交要求</h4>
        <p>
          参赛者需在在线表单中上传一份<strong>完整的项目申报书</strong>
          。项目申报书应重点围绕拟合成的软件系统，说明其工程目标、实现路径与可行性。
        </p>
        <p>项目申报书内容应包括但不限于以下部分：</p>

        <div className={styles.requirementItem}>
          <h5>（1）项目目标与应用场景</h5>
          <ul>
            <li>说明项目拟解决的实际问题或应用场景</li>
          </ul>
        </div>

        <div className={styles.requirementItem}>
          <h5>（2）交付物说明</h5>
          <ul>
            <li>拟支持的核心功能与功能边界（Scope）</li>
            <li>预期使用方式或交互流程</li>
            <li>初步测试规划（如单元测试、集成测试等）</li>
            <li>文档与使用说明覆盖范围</li>
          </ul>
        </div>

        <div className={styles.requirementItem}>
          <h5>（3）技术路线说明</h5>
          <ul>
            <li>整体系统架构与核心模块划分</li>
            <li>大模型与智能体工具在开发过程中的作用</li>
            <li>关键技术选型说明</li>
          </ul>
        </div>

        <div className={styles.requirementItem}>
          <h5>（4）风险分析与应对方案</h5>
          <ul>
            <li>可能面临的技术或工程风险</li>
            <li>对应的缓解措施或替代方案</li>
          </ul>
        </div>

        <div className={styles.requirementItem}>
          <h5>（5）相关研究与实践基础</h5>
          <ul>
            <li>与项目相关的既有研究、开源项目或工程实践</li>
            <li>对相关技术现状的理解与参考情况</li>
          </ul>
        </div>

        <div className={styles.requirementItem}>
          <h5>（6）个人背景与项目匹配度（如有）</h5>
          <ul>
            <li>与项目相关的个人技术经历</li>
            <li>以往工程或研究实践情况</li>
          </ul>
        </div>

        <div className={styles.requirementItem}>
          <h5>（7）其他有助于理解项目的补充材料（可选）</h5>
          <ul>
            <li>如原型设计、技术草图、参考代码仓库链接等</li>
          </ul>
        </div>

        <h3>阶段二：项目预答辩</h3>
        <p>
          项目申报书提交并通过初步材料审核后，主办方将邀请参赛者参加
          <strong>线上项目预答辩</strong>
          。预答辩主要围绕项目申报书内容展开，重点就项目方向、技术路线、功能范围（Scope）及工程可行性等方面，与参赛者进行交流讨论。
        </p>

        <h3>阶段三：获得立项支持</h3>
        <p>
          通过预答辩后，并在两周内提交 100 次代码（commit），可获得 1,500
          元/人资金支持
        </p>

        <h3>阶段四：开发周期</h3>
        <p>自预答辩通过邮件发送后即可开始开发，评选截至日前结束开发</p>

        <h3>阶段五：项目验收</h3>
        <p>
          在项目开发周期内，参赛者可在完成自身项目后，按照主办方要求提交验收材料。主办方将对项目成果实行
          <strong>滚动验收机制</strong>
          ，根据项目完成度与工程质量，分批开展技术验收工作，具体包括：
        </p>

        <div className={styles.evaluationItem}>
          <h5>完成度评估（25%）</h5>
          <p>
            依据项目申报书中声明的功能范围（Scope），对项目的构建过程、运行结果及关键功能路径进行验证，确保项目在合理环境配置下可构建、可运行（关键功能路径可通过命令、脚本或示例明确触发）、可复现（对同一输入，多次运行结果一致或具备合理解释）。
          </p>
        </div>

        <div className={styles.evaluationItem}>
          <h5>工程质量评估（25%）</h5>
          <p>
            从系统结构合理性、代码组织与可维护性、测试覆盖情况、错误处理与边界条件设计等方面，对项目工程质量进行综合评估。
          </p>
          <ul>
            <li>核心模块职责是否清晰，是否存在可替换边界</li>
            <li>代码是否遵循一致的风格与错误处理约定</li>
            <li>测试是否覆盖声明范围内的关键功能路径与异常情况</li>
          </ul>
        </div>

        <div className={styles.evaluationItem}>
          <h5>可解释性评估（25%）</h5>
          <p>
            需提交开发历程文章，包含开发过程及心得体会；从项目理解程度、AI
            工具使用方式、对优秀开源工作借鉴（如有）取舍等方面，对项目可解释性进行综合评估
          </p>
        </div>

        <div className={styles.evaluationItem}>
          <h5>用户体验评估（25%）</h5>
          <p>
            从目标用户（含 AI
            代理）使用难度、全流程流畅程度等方面，对项目人机界面进行综合评估。
          </p>
        </div>

        <h4>项目规模参考</h4>
        <p>
          为保证项目具备足够的工程深度，赛事建议参赛项目的
          <strong>有效 MoonBit 代码量</strong>至少 <strong>10,000 行</strong>。
        </p>
        <p>
          该代码规模仅作为<strong>工程量级参考</strong>
          ，评审将综合考虑项目的功能复杂度、工程结构与实现质量，不以代码行数作为重点评价依据。
        </p>

        <h3>阶段六：线下答辩与决赛评选</h3>
        <p>
          在此基础上，主办方将从参与线下答辩的项目中，
          <strong>择优遴选一批代表性成果</strong>
          ，入选项目的参赛者需就解决实际应用问题、提供完整用户体验、充分利用
          MoonBit
          语言特性，结合领域特定知识和实际需求及关键工程取舍进行现场说明，并接受评审专家提问。
        </p>
        <p>
          答辩优异的项目，将获得赛事设定的总奖金池{' '}
          <strong>15 万元现金奖励</strong>
          。相关奖励的具体形式与发放安排，将以主办方后续决赛公告为准。
        </p>
        <p>
          本次线下答辩计划是在深圳，时间计划是 4 月 27
          日，如有改动，会提前通知选手。
        </p>
      </section>

      <section id='rewards'>
        <h2>五、激励机制</h2>

        <h4>1. 启动支持</h4>
        <ul>
          <li>
            <strong>支持金额：</strong>1,500 元 / 人
          </li>
          <li>
            <strong>发放时间：</strong>项目预答辩通过，有 100 次提交后。
          </li>
          <li>
            <strong>发放说明：</strong>
            启动支持用于支持参赛者在项目开发初期合理使用 AI
            工具、云计算资源及必要的开发环境配置等支出。
          </li>
        </ul>

        <h4>2. 优秀作品奖励设置</h4>
        <table className={styles.rewardTable}>
          <thead>
            <tr>
              <th>奖项名次</th>
              <th>奖金</th>
              <th>数量</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>特等奖</td>
              <td>15,000</td>
              <td>1</td>
            </tr>
            <tr>
              <td>一等奖</td>
              <td>10,000</td>
              <td>1</td>
            </tr>
            <tr>
              <td>二等奖</td>
              <td>8,000</td>
              <td>2</td>
            </tr>
            <tr>
              <td>三等奖</td>
              <td>6,000</td>
              <td>3</td>
            </tr>
            <tr>
              <td>优异奖</td>
              <td>4,000</td>
              <td>15</td>
            </tr>
          </tbody>
        </table>
        <p className={styles.note}>注：不包含启动支持 1,500 元</p>

        <p>
          <strong>发放时间：</strong>线下答辩后 2 周内
        </p>
        <p>
          <strong>发放条件：</strong>
          参与线下答辩的项目中，赛事评审组将对线下答辩项目进行专业评审，本次设立特等奖（1
          名）、一等奖（1 名）、二等奖（2 名）、三等奖（3
          名）、优异奖，赛事组将按照以下维度评选优秀作品，最终名单根据奖项根据实际质量和评分综合确定。
        </p>
        <ul>
          <li>解决实际应用问题（25%）</li>
          <li>提供完整用户体验（25%）</li>
          <li>充分利用 MoonBit 语言特性（25%）</li>
          <li>结合领域特定知识和实际需求（25%）</li>
        </ul>
      </section>

      <section id='opensource'>
        <h2>六、开源与成果提交要求</h2>
        <p>
          参赛项目须在 <strong>GitHub</strong>{' '}
          平台以开源方式发布，并满足以下基本要求：
        </p>
        <ul>
          <li>
            提供完整的源代码仓库，保留完整开发历史记录；包含 README
            文档，说明项目目标、功能范围与使用方式；保证项目在合理环境配置下可构建、可运行、可复现；遵守所使用第三方依赖的开源协议要求并选择
            OSI 认证许可开源；
          </li>
          <li>
            如果项目有额外的支持性内容（例如部署脚本、在线服务等）也需要在
            GitHub 平台开放源码。
          </li>
        </ul>
        <p>
          通过验收并参与展示的项目，均为参赛者本人独立完成的成果。在尊重作者署名与成果归属的前提下，表现突出的项目将
          <strong>入选 MoonBit 生态标准实现</strong>
          ，并且同意在署名前提下，授权主办方用于展示、宣传与生态共建（非商业）。
        </p>
      </section>

      <section id='appendix'>
        <h2>七、附则</h2>
        <p>
          <strong>基础指南：</strong>
        </p>
        <p>
          <a href='https://www.moonbitlang.com/' target='_blank'>
            MoonBit 工具链
          </a>
        </p>

        <p>
          <strong>软件开发示例：</strong>
        </p>
        <ul>
          <li>
            <a
              href='https://github.com/moonbit-community/fastcc'
              target='_blank'
            >
              fastcc
            </a>{' '}
            - 使用 Codex 合成的高可靠 C 语言编译器
          </li>
          <li>
            <a href='https://github.com/Milky2018/wasmoon' target='_blank'>
              wasmoon
            </a>{' '}
            - 使用 Codex 合成的支持 JIT 的 WebAssembly 运行时，性能与 wasmtime
            相当
          </li>
        </ul>

        <h3>重要说明</h3>
        <ol>
          <li>
            本赛事所有支持与奖励均为激励性质，不构成任何形式的劳务报酬、委托开发或成果购买关系。
          </li>
          <li>
            启动支持、完成支持及优秀作品奖励的具体发放形式及税务处理方式，将按相关规定执行。
          </li>
          <li>
            主办方保留在不改变总体原则的前提下，对激励机制细则进行合理调整的权利，并提前公告。
          </li>
          <li>
            主办方有权根据实际情况进行合理调整，参赛即视为同意本章程全部条款。
          </li>
          <li>
            本次奖金发放视比赛情况可能会有空缺，按照实际的作品技术能力展示对应相应的奖项。
          </li>
        </ol>
      </section>
    </>
  )
}

import ContestLayout from '@site/src/components/ContestLayout'
import styles from './styles.module.css'

export default function Page() {
  return (
    <ContestLayout
      heroImg='/img/2026-contest/kv-en.jpg'
      mobileHeroImg='/img/2026-contest/kv-en.jpg'
      heroBgColor='#051033'
    >
      <div className={styles.container}>
        <EnglishContent />
      </div>
    </ContestLayout>
  )
}

function EnglishContent() {
  return (
    <>
      <section className={styles.intro}>
        <p>The <strong>2026 MoonBit Software Synthesis Challenge</strong> focuses on building production-grade software systems using an <strong>AI-native approach</strong>.</p>
        <p>Under the vision of an <strong>"AI-Native Software Factory,"</strong> this challenge explores how Large Language Models (LLMs) can work together with the MoonBit programming language and its toolchain. The goal is to move software development from ad-hoc, experience-driven implementations toward workflows that are <strong>reusable, evolvable, and sustainable</strong>.</p>
        <p>This challenge is for developers who want to actively shape the MoonBit ecosystem by leveraging AI for code generation, architectural reasoning, and collaborative engineering.</p>
        <div className={styles.introBtn}>
          <a href="https://forms.gle/VcgnUK8qTJVKrDkBA" target="_blank" className="button button--primary button--lg">Apply Now</a>
        </div>
      </section>

      <section id="dates">
        <h2>1. Key Dates</h2>
        <ul>
          <li><strong>Applications Open:</strong> February 9, 2026</li>
          <li><strong>Rolling Review:</strong> Applications are reviewed on a continuous basis; accepted participants will be notified via email</li>
          <li><strong>Final Submission Deadline:</strong> April 21, 2026</li>
        </ul>

        <h3>Eligibility</h3>
        <ul>
          <li><strong>Individual Participation Only:</strong> This is an individual competition</li>
          <li><strong>No Teams:</strong> Team submissions are not accepted</li>
          <li><strong>Submission Limit:</strong> Each participant may submit one project</li>
        </ul>
      </section>

      <section id="scope">
        <h2>2. Project Scope</h2>
        <p>Participants are expected to propose and build a <strong>system-level software project</strong> with a strong emphasis on engineering quality.</p>
        <p>Your project must:</p>
        <ul>
          <li>Target a clear engineering objective</li>
          <li>Demonstrate technical feasibility</li>
          <li>Exhibit clear potential for long-term evolution</li>
        </ul>
        <p>There are no restrictions on implementation style or architecture, provided the project meets the baseline engineering quality standards.</p>
      </section>

      <section id="categories">
        <h2>3. Reference Categories (Inspiration)</h2>
        <p>This list is non-exhaustive. You are free to define your own direction.</p>
        
        <h4>Core Systems</h4>
        <ul>
          <li>Spreadsheet engines</li>
          <li>Lightweight database kernels</li>
          <li>Document / PDF processing engines</li>
          <li>Game engine cores</li>
          <li>Proof assistants</li>
          <li>Software analysis frameworks</li>
        </ul>

        <h4>Emerging Directions</h4>
        <ul>
          <li>Static site generators</li>
          <li>Log collection and query systems</li>
          <li>Build automation or task pipelines</li>
          <li>LLM-oriented reasoning or service frameworks</li>
          <li>2D graphics or prototyping tools</li>
          <li>3D modeling or geometry processing tools</li>
          <li>Audio / video processing and transcoding tools</li>
        </ul>
        <p>Any system-level software with long-term engineering value is welcome, provided it does not duplicate existing projects within the MoonBit ecosystem.</p>
      </section>

      <section id="process">
        <h2>4. Participation Process</h2>

        <h3>Stage 1: Application</h3>
        <p>Submit your application via the official <strong>Google Form</strong>, which collects:</p>
        <ul>
          <li><strong>Personal information:</strong> Email address, GitHub profile</li>
          <li><strong>Project description</strong> (minimum 300 words), including:
            <ul>
              <li>Project overview: the software system you plan to build</li>
              <li>Engineering goals: the problems you aim to solve and the scope</li>
              <li>Technical approach: key design ideas, architecture, or implementation plan</li>
              <li>Feasibility analysis: why the project is realistic and achievable</li>
            </ul>
          </li>
        </ul>

        <h3>Stage 2: Development</h3>
        <p>Upon receiving a confirmation email, you may begin development immediately. All work must be finalized before the submission deadline.</p>

        <h3>Stage 3: Evaluation</h3>
        <p>Projects are reviewed on a rolling basis and evaluated across four equally weighted dimensions:</p>

        <div className={styles.evaluationItem}>
          <h5>Functional Completeness (25%)</h5>
          <ul>
            <li>Does the project fulfill its declared scope?</li>
            <li>Is it buildable, runnable, and reproducible?</li>
            <li>Are key functionalities clearly demonstrated?</li>
          </ul>
        </div>

        <div className={styles.evaluationItem}>
          <h5>Engineering Quality (25%)</h5>
          <ul>
            <li>Clear modular boundaries and system structure</li>
            <li>Readable, maintainable code organization</li>
            <li>Sufficient test coverage for core paths and edge cases</li>
            <li>Consistent error handling and coding conventions</li>
          </ul>
        </div>

        <div className={styles.evaluationItem}>
          <h5>Explainability & Documentation (25%)</h5>
          <p>Participants must provide a development retrospective covering:</p>
          <ul>
            <li>Key architectural decisions</li>
            <li>The role of AI tools in the process</li>
            <li>References to existing open-source work, if applicable</li>
          </ul>
        </div>

        <div className={styles.evaluationItem}>
          <h5>User Experience (25%)</h5>
          <ul>
            <li>Ease of use for intended users (including AI agents)</li>
            <li>Clarity and smoothness of the overall workflow</li>
          </ul>
        </div>

        <h4>Scale Benchmark</h4>
        <p>Projects are <strong>recommended</strong> to reach approximately <strong>10,000 lines of effective MoonBit code</strong>. This serves only as a rough reference for project complexity.</p>
      </section>

      <section id="awards">
        <h2>5. Awards & Support</h2>
        <ul>
          <li><strong>Participation Grant:</strong> Up to USD 600 per participant</li>
        </ul>
        <p>Each participant is eligible for this grant only once. If multiple submissions are linked to the same individual, the organizers reserve the right to consolidate eligibility.</p>
      </section>

      <section id="opensource">
        <h2>6. Open Source Requirements</h2>
        <p>All projects must be open-sourced on <strong>GitHub</strong> and adhere to the following requirements:</p>
        <ul>
          <li><strong>Public Repository:</strong> Includes full commit history</li>
          <li><strong>Documentation:</strong> A clear README describing goals, scope, and usage</li>
          <li><strong>Reproducibility:</strong> The project must be buildable and runnable by others</li>
          <li><strong>License:</strong> An OSI-approved open-source license is required</li>
          <li><strong>Artifacts:</strong> Supporting materials (e.g. deployment scripts) must also be open-sourced</li>
        </ul>
        <p>Outstanding projects may be selected as <strong>reference implementations</strong> for the MoonBit ecosystem.</p>
      </section>

      <section id="resources">
        <h2>7. Resources & Contact</h2>
        <p><strong>Resources:</strong></p>
        <ul>
          <li><a href="https://www.moonbitlang.com/" target="_blank">MoonBit Toolchain</a></li>
          <li><a href="https://discord.gg/FyXNY8cpyJ" target="_blank">Discord Community</a></li>
          <li>Contact Email: ideamoonbit@gmail.com</li>
        </ul>
        
        <p><strong>Reference Projects:</strong></p>
        <ul>
          <li><a href="https://github.com/moonbit-community/fastcc" target="_blank">fastcc</a> - A high-reliability C compiler synthesized using Codex</li>
          <li><a href="https://github.com/Milky2018/wasmoon" target="_blank">wasmoon</a> - A Codex-synthesized WebAssembly runtime with JIT support</li>
        </ul>

        <h3>Terms & Conditions</h3>
        <ol>
          <li>All grants are incentives and do not constitute employment, commissioned work, or procurement.</li>
          <li>Tax handling and distribution follow applicable regulations.</li>
          <li>Organizers reserve the right to adjust rules with prior notice.</li>
          <li>Participation implies acceptance of these terms.</li>
          <li>Grants may be withheld if submissions fail to meet expected technical standards.</li>
        </ol>
      </section>
    </>
  )
}


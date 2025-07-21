/*
 * Copyright 2025 International Digital Economy Academy
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Layout from '@theme/Layout'
import styles from './styles.module.css'
import clsx from 'clsx'
import ContestNavbar, { items2024 } from '@site/src/components/ContestNavbar'

export default function Page() {
  return (
    <Layout>
      <main className={styles['contest-main']}>
        <div className={styles['section-wrapper']}>
          <section className={styles['hero-section']}>
            <img
              className={styles['desktop-hero-img']}
              src='/img/contest/desktop-hero.jpg'
              alt=''
            />
            <img
              className={styles['mobile-hero-img']}
              src='/img/contest/mobile-hero.jpg'
              alt=''
            />
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <ContestNavbar activeIndex={1} items={items2024} />
        </div>
        <div className={styles['section-wrapper']}>
          <section className={styles['signup-section']}>
            <a
              href='https://tianchi.aliyun.com/s/399e702c1b75629138f56fdb6f5e411a'
              className={clsx(
                'button',
                'button--primary',
                'button--lg',
                styles['signup-button']
              )}
            >
              立即报名
            </a>

            <a
              href='https://tianchi.aliyun.com/competition/entrance/532263/rankingList'
              className={clsx(
                'button',
                'button--primary',
                'button--lg',
                styles['signup-button']
              )}
            >
              查看排行榜
            </a>
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <article className={styles['contest-article']}>
            <h2>⭐️大赛资料</h2>
            <ol>
              <li>
                <a href='https://moonbitlang.github.io/minimoonbit-public/'>
                  MoonBit 程序语言理论设计与实现课程
                </a>
                。
              </li>
              <li>
                <a href='/files/contest/main.pdf' download>
                  MiniMoonBit 2024 程序设计语言规范、文法及说明
                </a>
                。
              </li>
              <li>
                <a href='/files/contest/test-platform.pdf' download>
                  竞赛平台（竞赛测试系统）使用文档
                </a>
                。
              </li>
              <li>性能基准测试程序及其文档。</li>
              <li>本地调试指南。</li>
            </ol>
            <p>（以上文档中暂不可浏览部分，具体更新时间为10月1日之前）</p>
            <h2>一、赛题基本说明</h2>
            <ol>
              <li>
                大赛要求各参赛队综合运用各种知识(包括但不局限于编译技术、操作系统、计算机体系结构等)，构思并实现一个综合性的编译系统，以展示面向特定目标平台的编译器构造与编译优化的能力。
              </li>
              <li>
                大赛鼓励各参赛队充分了解目标语言及目标硬件平台(CPU指令集、Cache、各类并行加速能力等)特点，使编译出的目标码能够尽可能利用目标硬件平台能力以提高目标码的运行效率。
              </li>
              <li>
                为展示参赛队的设计水平，增加竞赛的对抗性，进入决赛的参赛队还需针
                对目标语言或目标平台的变化，现场调整编译系统。
              </li>
              <li>
                除本技术方案特别要求、规定和禁止事项外，各参赛队可自行决定编译器
                体系结构、前端与后端设计、代码优化等细节。
                除本技术方案特别要求、规定和禁止事项外，各参赛队可自行决定编译器
                体系结构、前端与后端设计、代码优化等细节。
              </li>
            </ol>
            <h2>二、组队规则</h2>
            <ol>
              <li>
                参赛者可以个人身份参赛或以团队方式参赛，二者择其一。以团队方式参赛的，团队人数不得超过5人，且每人只能参加一支队伍。
              </li>
              <li>
                选手可以自由组队，跨校、跨国组队均可。如果报名后需要更换队伍，需要先退出队伍再重新加入队伍。
              </li>
              <li>
                参赛者通过天池平台进行报名，确保报名信息准确有效，否则会被取消参赛资格及激励。
              </li>
              <li>
                本赛道所有选手需在2024年11月14日21:00前完成实名认证（实名认证入口：天池网站-个人中心-认证-支付宝实名认证），未按要求完成实名认证队伍，将被取消参赛资格，拟晋级资格顺延候补。
              </li>
              <li>
                如果你在寻找一起创作的“伙伴”或“队伍”，可以直接加入官方活动 QQ
                群：914387051或钉钉群：（待补充），寻找队友报名。
              </li>
            </ol>
            <h2>三、初赛评分标准</h2>
            <p>
              比赛内容：开发支持特定语言、面向 RISC-V 硬件平台的综合性编译系统。
            </p>
            <p>
              1.编译器应当基于 MoonBit 语言开发，并能够在 x86_64 架构、Ubuntu
              24.04LTS 操作系统的评测服务器上编译运行。
            </p>
            <p>
              2.RISC-V硬件平台：能够将符合自定义程序设计语言MiniMoonBit
              2024的测试程序编译为 RISC-V 汇编语言程序。程序应当使用 RV64GC
              指令集，并将在链接后在 Linux 操作系统的 RISC-V 设备上运行。
            </p>
            <p>
              功能测试：参赛队所开发的编译器应能够编译大赛提供的 MiniMoonBit
              2024 语言编写的基准测试程序。
            </p>
            <p>
              3.具有词法分析、语法分析、语义分析、目标代码生成与优化等能力，
              并支持编译错误的准确识别、定位与错误处理功能。
            </p>
            <p>
              4.对于正确编译通过的MiniMoonBit
              2024基准测试程序，应生成符合要求的汇编文件。
            </p>
            <p>
              功能测试要求基于大赛给出的汇编器、链接器等工具，基于大赛给出的模板，用自行编写的实现为每个基准测试程序生成对应的输出。对于输出可执行文件的测试，输出将在安装有
              Linux
              操作系统的指定硬件平台上加载并运行。对于每个测试用例，我们将给定输入数据，比对程序运行输出结果是否满足预期，以此决定该该测试是否通过。每一个实现部分的最终得分为
              (通过测试数量/总测试数量) * 该部分分数 。
            </p>
            <p>不同的编译器实现级别与对应的分数如下：</p>
            <p>加分项中的后端支持部分，评测方式与功能测试相同。</p>
            <p>对于生成代码的性能优化部分，测试方法如下：</p>
            <p>
              记录使用基准实现编译每个测试点后，样例在目标硬件平台上的执行时间作为评价依据。对于每个测试点，得分为
              基准时间/实际运行时间。参赛者在此项上的最终得分为 总分数 *
              各点得分的几何平均数 * 80%。
            </p>
            <p>对于生成代码的体积优化部分，测试方法如下：</p>
            <p>
              记录使用基准实现编译每个测试点后，样例在目标硬件平台上的二进制体积作为评价依据。对于每个测试点，得分为
              基准体积/实际体积。参赛者在此项上的最终得分为 总分数 *
              各点得分的几何平均数 * 80%。
            </p>
            <p>初赛总成绩为各得分项与加分项得分之和，满分为 145 分。</p>
            <h2>四、决赛评分标准</h2>
            <p>决赛阶段的任务在初赛提交的最终版本编译系统上完成。</p>
            <p>
              比赛内容：大赛组委会公布新的基准测试程序。参赛队根据变化，在限定时间内自行修改编译系统源代码，提交给竞赛系统。生成的编译系统需要以新给出的基准测试程序集作为输入，生成对应的程序。
            </p>
            <p>
              功能测试与初赛加分项：评测方法与初赛一致。在评分中，初赛提供的测试数据将在决赛中继续进行测试，占据每个测试项目
              50% 的分数，决赛新加入的测试数据占剩下的
              50%。各个测试项目的总分数不变。
            </p>
            <p>
              语言特性加分项：不参与自动评测，将在决赛答辩展示说明后确认加分。
            </p>
            <p>参赛队团队协作及现场答辩：评分标准在将决赛阶段另行公布。</p>
            <p>总决赛得分标准</p>
            <h2>五、参赛作品提交</h2>
            <p>4.1 各参赛选手初赛阶段需要在大赛的竞赛平台提交完整的设计内容:</p>
            <p>
              1）综合编译系统设计的完整 MoonBit
              项目文件，并在竞赛平台中至少有一次完整进行性能测试的记录和有效成绩。
            </p>
            <p>2）编译系统设计的分析设计文档。</p>
            <p>
              4.2
              如果需要使用第三方IP或者借鉴他人的部分源码，必须在设计文档和源代码的头部予以明确说明。为了编写编译器必需在项目中引用的IO库、命令行解析器等辅助工具不包含在内。。
            </p>
            <p>
              4.3 参赛队必须严守学术诚信。一经发现代码抄袭或技术抄袭等学术不端行
              为， 代码重复率在 50%以上，取消参赛队的参赛资格
            </p>
            <p></p>
            <h2>六、等级认定标准</h2>
            <p>
              编译系统设计赛根据参赛队在初赛和决赛阶段最后提交的有效作品进行等级评定，等级认定共分为一级、二
              级、三级、入门级等共四级，对应的评定标准如下:
            </p>
            <p>
              1.一级：熟悉编译器结构和构建过程，熟练掌握函数式语言的编译技术。
            </p>
            <p>标准：功能测试全部通过。</p>
            <p>
              2.二级：能够完成编译器设计及实现，功能正确，熟悉编译器结构和构建过程。
            </p>
            <p>标准：功能测试通过前四项</p>
            <p>
              3.三级:熟悉编译器结构和构建过程，能够开发实现功能基本正确的编译器。
            </p>
            <p>标准：功能测试通过前三项。</p>
            <p>
              4.入门级:基本熟悉编译器结构和构建过程，能够开发实现具有一定功能的编译器。
            </p>
            <p>标准：功能测试通过前两项。</p>
            <p>
              等级认定中各个等级划分的功能与性能分数线标准，待当年决赛结束后公布，并制作发放等级认定证书。
            </p>
            <p></p>
            <h2>七、竞赛平台与测试程序</h2>
            <p>大赛提供的竞赛平台和测试程序包括:</p>
            <p>1.代码托管平台，支持各参赛队的群体协作与版本控制。</p>
            <p>
              2.竞赛评测系统，根据参赛队的申请从代码托管平台获取指定版本，生
              成编译系统，并加载基准测试程序，自动进行功能及性能测试。
            </p>
            <p>
              3.基于MiniMoonBit 2024语言的基准测试程序(包括MiniMoonBit
              2024源码及评测点数据)，用于RISC-V
              等目标硬件平台上对参赛队编译器及编译器生成的可执行文件进行性能评测
            </p>
            <p></p>
            <h2>八、软硬件系统规范</h2>
            <p>
              MiniMoonBit 2024 语言是用于本次竞赛的高级程序设计语言，是 MoonBit
              基本语法的子集。语言特性方面，支持全局变量与函数声明、Int 和
              Double
              两种数据类型、数组、闭包、高阶函数，表达式支持算术运算、函数调用，支持类型推导。MiniMoonBit
              在其所拥有的特性上与 MoonBit 语言保持一致。
            </p>
            <p>
              决赛阶段的语言语法、目标硬件平台特性、基准测试集调整，由大赛组委
              会在决赛阶段发布。
            </p>
            <p></p>
            <p>
              大赛指定的编译环境用于编译参赛队提交的编译系统源码，参数如下：
            </p>
            <p>1.CPU 体系结构: x86_64</p>
            <p>2.操作系统：Ubuntu 24.04</p>
            <p>
              3.使用标准的 MoonBit 工具链对提交的编译器进行编译与运行（如：moon
              build、moon run 等）。在编译器的运行过程中不允许访问网络。
            </p>
            <p>
              大赛指定的 RISC-V 架构目标程序性能测试实验设备为 Milk-V Pioneer
              Box，主要参数如下:
            </p>
            <p>
              1.CPU: 算丰 (SOPHON) SG2042 (64 Core C920, RVV 0.71, up to 2GHz)
            </p>
            <p>2.内存: 121GiB DDR4</p>
            <p>
              3.操作系统: OpenEuler Linux riscv64 6.6.0-27.0.0.31.oe2403.riscv64
            </p>
            <p>
              4.汇编和链接器：Zig 0.13.0 / LLVM 18。编译与连接指令：
              {`zig
              build-exe -target riscv64-linux -femit-bin={output_file}
              {input_files} -fno-strip -mcpu=baseline_rv64`}
            </p>
            <p>
              5.额外的测试限制：我们将限制每个被测程序占用的 CPU 核心数最多为 2
              个（独占），内存不超过4GiB。这一限制后续可能会根据实际被测程序的情况进行调整。
            </p>
            <p>
              6.参赛选手提交的编译器应当基于或参考 MiniMoonBit
              模板进行实现。大赛将采用模板中提供的测试方式和函数等对选手提交的编译器进行运行和测试。
            </p>
            <h2>九、奖金设置</h2>
            <p>一等奖（1名）20000元</p>
            <p>二等奖（2名）10000元</p>
            <p>三等奖（3名）5000元</p>
            <p>优异奖（10名）500元</p>
          </article>
        </div>
      </main>
    </Layout>
  )
}

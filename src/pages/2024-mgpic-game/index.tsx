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
import ContestNavbar from '@site/src/components/ContestNavbar'

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
          <ContestNavbar activeIndex={2} />
        </div>

        <div className={styles['section-wrapper']}>
          <section className={styles['signup-section']}>
            <a
              href='https://tianchi.aliyun.com/s/42503d88fe6e219f3260251114461b54'
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
              href='https://github.com/moonbitlang/MoonBit-Code-JAM-2024'
              className={clsx(
                'button',
                'button--primary',
                'button--lg',
                styles['signup-button']
              )}
            >
              提交作品
            </a>
          </section>
        </div>
        <div className={styles['section-wrapper']}>
          <article className={styles['contest-article']}>
            <h2>⭐️大赛资料</h2>
            <ol>
              <li>
                游戏开发赛道
                <a href='https://space.bilibili.com/1453436642'>参考视频</a>＆
                <a href='https://mp.weixin.qq.com/s/kmvtEgW7eihRCGVaK8QSAA'>
                  文章
                </a>
              </li>
            </ol>
            <h2>一、赛题基本说明</h2>
            <p>
              游戏赛道旨在鼓励开发者通过使用 MoonBit 编程语言和
              提供的游戏框架，开发出具有创新性和趣味性的游戏作品。参赛者需在WASM-4框架的基础上进行游戏开发，展示创造力和编程技巧
            </p>
            <p></p>
            <h2>二、活动报名</h2>
            <p>
              1.本届MoonBit
              游戏挑战赛的报名、比赛过程均在线上完成、决赛评选、颁奖典礼等在线下完成。
            </p>
            <p>
              2.选手请在11月13日前完成报名，报名确认完成后（参选队伍ID生成）即可开始作品创作。
            </p>
            <p></p>
            <p>
              本次活动面向全球开发者，参赛选手年龄需满14岁以上，每支队伍需至少包含一名成年人。
            </p>
            <p>报名同学须保证提供的信息合法、真实、有效。</p>
            <p>参赛者报名前请仔细阅读《隐私政策》内容。</p>
            <p>
              主办方将对所有选手提交的个人信息予以保密，未经选手本人同意主办方不会透露给第三方。
            </p>
            <h2>三、组队规则</h2>
            <p>
              1.参赛者可以个人身份参赛或以团队方式参赛，二者择其一。以团队方式参赛的，团队人数不得超过5人，且每人只能参加一支队伍。
            </p>
            <p>2.选手可以自由组队，跨校、跨国组队均可。</p>
            <p>
              3.如果报名后需要更换队伍，需要先退出队伍再重新加入队伍。直到初赛报名截止前，即2024年11月13日，选手均可随意组队或加入新的队伍。更换队伍需要将原队伍与新队伍信息一并发送至赛事组邮箱，由赛事组邮件确认后方可生效
            </p>
            <p>4.报名阶段截止后，未锁定队伍的同学，报名信息将自动失效</p>
            <p>
              5.如果你在寻找一起创作的“伙伴”或“队伍”，可以直接加入官方活动 QQ
              群：914387051或钉钉群：待补充，寻找队友报名。
            </p>
            <p></p>
            <h2>四、线上线下宣讲</h2>
            <p>
              主办方于9月-11月前往全国高校举办了赛事宣讲宣讲会以线上不定期直播宣讲，内容包括赛事介绍、经验分享以及关游戏研发流程。具体时间地点由主办方在活动群及公众号另行通知。
            </p>
            <p></p>
            <h2>五、比赛流程</h2>
            <p>本次挑战赛将分为初赛和决赛，初赛纯线上、线下决赛线下的形式。</p>
            <p>
              线下决赛还将包括游戏展示路演、导师交流会等，届时主办方会统一安排。
            </p>
            <p>*本次赛程安排中涉及到的所有时间均为北京时间</p>
            <p></p>
            <h2>六、作品提交</h2>
            <p>
              作品提交入口将于 9 月 1 日开启，于 11 月 14 日 18：00
              截止。队长需将参选作品提交至官方指定Github仓库链接：
              <a href='https://github.com/moonbitlang/MoonBit-Code-JAM-2024'>
                https://github.com/moonbitlang/MoonBit-Code-JAM-2024
              </a>
              （用于专家评审），主办方将把参选作品同步至大赛官网（用于大众展示），请参照以下指引，完成在仓库的提交
              ：Html 编译后的产物，进入前100后再提交源码
            </p>
            <p>
              1.选手应当在GitHub上创建官方仓库的分支，仓库应当在参赛队伍下创建文件夹。此仓库的Star数计入评分。文件夹命名规范：文件夹中应当包含：
            </p>
            <p>1）game.wasm：编译后的游戏本体</p>
            <p>2）README.md：游戏描述及说明</p>
            <p>
              3）选手须在自己的分支下通过向官方仓库新建合并请求来提交自己的作品
            </p>
            <p>2.进入前100选手在最终筛选前应当提交源代码</p>
            <p>
              1）在GitHub上创建公开可见的仓库（可与前步骤共用同一仓库）。只有上述创建的官方仓库的分支的Star数会被计入评分，其他仓库一律忽略，仓库需要有详细说明验证编译出来的产物与提交一致
            </p>
            <p>2）在License.md中应当至少包含对赛事组委会的授权</p>
            <p>3.在README.md中提供游戏描述以及游戏玩法介绍：</p>
            <p>1）游戏描述：包括游戏的设定、操作说明</p>
            <p>
              2）游戏玩法：包括游戏画面截图（jpg/png/gif文件格式）和文字描述。
            </p>
            <p>
              3）游戏运行视频链接 上传至 B站 、 Youtube
              或以线上网盘（如百度网盘）的形式，将链接放置到相应的 Github
              README.md 中，作品提交问题请咨询：jichuruanjian@idea.edu.cn
            </p>
            <p>
              参考链接：<a href='https://wasm4.org/'>https://wasm4.org/</a>
            </p>
            <p></p>
            <h2>七、作品规范</h2>
            <p>需为参赛者的原创游戏作品</p>
            <p>
              所有参赛作品必须使用 MoonBit 编程语言开发，并基于 WASM-4
              框架运行。
            </p>
            <p>游戏硬件规格参考 Wasm4 标准</p>
            <p>1）显示：160x160 像素，60 Hz 刷新率。</p>
            <p>2）内存：64KB 线性 RAM，内存映射 I/O，支持保存状态。</p>
            <p>3）输入设备：键盘、鼠标、触摸屏，最多支持 4个游戏手柄。</p>
            <p>4）音频：2个脉冲波通道，1个三角波通道，1个噪声通道</p>
            <p>磁盘存储：1024 字节。</p>
            <p>
              参赛者对参赛作品享有完整、独立的知识产权，并有权使用该作品参加比赛。
            </p>
            <p>
              1.选手允许以合法途径获得并使用非原创素材，但使用就必须保证拥有其完整的版权，并在提交文档中标注，因参赛行为或参赛作品而引起的侵权争议及其他争议，由参赛者自行解决，并承担由此导致的一切责任和损失。
            </p>
            <p>
              2.参赛作品的代码需开放源代码，并托管在官方指定的 Github
              仓库中，供评审和其他参赛者参考。
            </p>
            <p>
              3.如果使用了已有的开源代码，需在文档中明确声明，并确保符合相关的授权和使用条款
            </p>
            <p>
              作品必须遵守法律法规，不得宣传色情、暴力、血腥等不良内容；不得盗用、剽窃抄袭他人作品；不得侵犯他人知识产权，使用未经授权的素材、图片、字体等；若违反相应规则，则取消成员参赛及获奖资格
            </p>
            <h2>八、初赛评分标准</h2>
            <p>标准一：Star 数评分（最高 50 分）</p>
            <p>
              1.参赛作品在官方指定的 Github 仓库中获得的 Star
              数将转换为评分，每个 Star 计 0.2 分，最多可得 50分。
            </p>
            <p>标准二：视频、文章联动（最高20分）</p>
            <p>
              1.发表或是录制你参赛作品的文字讲解、解说视频（真人/虚拟/声音出镜录制，晒出幕后花絮和作品实机演示），成功投递文字稿件至赛事组官方邮箱、或视频上传
              B 站，并投稿至 #MoonBit 月兔 话题广场，让更多玩家了解你的作品
            </p>
            <p>标准三：专家评审（最高40分）</p>
            <p>
              1.游戏实现完整度：评估游戏内容的实现程度、关卡完整性和操作体验。（25%）
            </p>
            <p>2.游戏技术难度：考虑实现过程中技术的复杂性和难度。（20%）</p>
            <p>
              3.游戏玩法创意性：考察游戏玩法的创新性、关卡设计的趣味性及表现形式。（30%）
            </p>
            <p>
              4.游戏美观设计：评估美术风格的匹配度、美术设计的美感以及音乐和音效的表现。（25%）
            </p>
            <p>
              5.决赛名单将根据以上得分求和计算，队伍从高到低的排名进行入围通知。
            </p>
            <h2>九、决赛评分标准</h2>
            <p>
              如果你的团队进入到第二阶段的比赛，你需要在队伍中派出代表在线下进行决赛创作路演（Live），决赛具体路演要求主办方将另行通知
            </p>
            <p></p>
            <p>主办方邀请了多位业界大咖作为本次挑战赛的评审专家。</p>
            <p>
              将从核心玩法体验、操控感、表现力、切题程度四个方面对入围决赛作品进行评审和打分。
            </p>
            <h2>十、作品评审与投票周期</h2>
            <p>
              初赛作品的专家评审与观众投票周期均为9月1日-11月14日下午18：00。
            </p>
            <p></p>
            <p>
              初赛和决赛作品评选期间，参赛作品将被展示在赛事官网上，选手可以邀请社会人员为自己和其他选手的作品在GitHub仓库进行投票（点击
              Star）。
            </p>
            <p>决赛作品的评审日期为11月23日</p>
            <p></p>
            <h2>十一、奖金设置</h2>
            <p>初赛：</p>
            <p></p>
            <p>
              阳光普照奖【初赛表现优异的作品，初赛综合得分前 100 队】：每队 300
              元
            </p>
            <p>决赛：</p>
            <p>一等奖（1名）10000元</p>
            <p>二等奖（1名）5000元</p>
            <p>三等奖（1名）3000元</p>
            <p>优异奖（2名）2000元</p>
            <p>
              特别奖：赛道设置「B站」、「知乎」、「微信公众号 」、X（Twitter ）
              平台的最受欢迎奖每个 1000
              元，统计方式以单个平台的文章阅读量或视频浏览量为准，通过联系MoonBit
              小助手（微信号：moonbit_helper），提交数据，提交截止时间为初赛代码截止时间（见大赛章程-赛事安排）。
            </p>
            <p></p>
            <p>以上奖项各不重叠，取最高奖项</p>
            <p>1、最终解释权归主办方所有</p>
            <p>2、特别奖参选标准需要单个作品所有平台浏览量总计大于 5000 </p>
          </article>
        </div>
      </main>
    </Layout>
  )
}

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
          <ContestNavbar activeIndex={0} items={items2024} />
        </div>

        <div className={styles['section-wrapper']}>
          <article className={styles['contest-article']}>
            <h1>获奖名单</h1>
            <img src='/img/contest/price.png' alt='获奖名单' />
            <h2>程序语言与实现赛道代码开源</h2>
            <ul>
              <li>
                Mini Moonbit Machine:{' '}
                <a href='https://github.com/Mini-Moonbit-Machine/mmm'>
                  https://github.com/Mini-Moonbit-Machine/mmm
                </a>
              </li>
              <li>
                摩卡猫猫:{' '}
                <a href='https://github.com/yjl9903/minimoonbit-moca'>
                  https://github.com/yjl9903/minimoonbit-moca
                </a>
              </li>
              <li>
                Segmentation Fault:{' '}
                <a href='https://github.com/AdUhTkJm/minimoonbit-public'>
                  https://github.com/AdUhTkJm/minimoonbit-public
                </a>
              </li>
            </ul>
            <h2>游戏开发赛道代码开源</h2>
            <ul>
              <li>
                布丁大馍:{' '}
                <a href='https://github.com/moonbitlang/MoonBit-Code-JAM-2024/tree/main/teams/%E5%B8%83%E4%B8%81%E5%A4%A7%E9%A6%8D'>
                  https://github.com/moonbitlang/MoonBit-Code-JAM-2024/tree/main/teams/布丁大馍
                </a>
              </li>
              <li>
                moonbug:{' '}
                <a href='https://github.com/moonbitlang/MoonBit-Code-JAM-2024/tree/main/teams/GoToTheDoor'>
                  https://github.com/moonbitlang/MoonBit-Code-JAM-2024/tree/main/teams/GoToTheDoor
                </a>
              </li>
              <li>
                汪汪立功:{' '}
                <a href='https://github.com/moonbitlang/MoonBit-Code-JAM-2024/tree/main/teams/%E6%B1%AA%E6%B1%AA%E7%AB%8B%E5%8A%9F'>
                  https://github.com/moonbitlang/MoonBit-Code-JAM-2024/tree/main/teams/汪汪立功
                </a>
              </li>
              <li>
                天地一！屋！大爱盟:{' '}
                <a href='https://github.com/moonbitlang/MoonBit-Code-JAM-2024/tree/main/teams/%E5%A4%A9%E5%9C%B0%E4%B8%80%EF%BC%81%E5%B1%8B%EF%BC%81%E5%A4%A7%E7%88%B1%E7%9B%9F'>
                  https://github.com/moonbitlang/MoonBit-Code-JAM-2024/tree/main/teams/天地一！屋！大爱盟
                </a>
              </li>
              <li>
                Arc_En_Ciel:{' '}
                <a href='https://github.com/moonbitlang/MoonBit-Code-JAM-2024/tree/main/teams/Arc_En_Ciel'>
                  https://github.com/moonbitlang/MoonBit-Code-JAM-2024/tree/main/teams/Arc_En_Ciel
                </a>
              </li>
            </ul>
            <img src='/img/contest/board.jpg' alt='决赛名单' />
            <h1>🌟 决赛通知</h1>
            <a href='/files/contest/2024-mgpic-final.pdf'>
              2024 MoonBit 全球编程创新挑战赛决赛通知
            </a>
            <h1 className='text--center'>
              2024年 MoonBit 全球编程创新挑战赛章程
            </h1>
            <h2>一、竞赛总则</h2>
            <p>
              MoonBit
              编程创新挑战赛是由粤港澳大湾区数字经济研究院（福田）基础软件中心主办，面向全球开发者的挑战大赛。大赛目标是以编程竞赛推动计算机软件开发专业建设，助力人工智能云原生领域创新人才梯队培育，培养编程语言这一基础软件领域的后备人才。本大赛鼓励开发者通过设计、开发创新性计算机系统项目，学习人工智能云原生开发平台，培养系统级的设计、分析、优化与应用能力，提升开发技术、创新实践、团队协作能力。大赛服务国家人才培养战略，以赛促学、以赛促教，为高水平计算机人才成长搭建交流、展示、合作的开放平台。
            </p>
            <h2>二、赛道设置</h2>
            <p>本次大赛分为【游戏开发挑战赛】、【程序语言设计和实现赛】</p>
            <ul>
              <li>
                游戏开发挑战赛道： 面向 14岁以上的开发者，使用 MoonBit
                编程语言基于 WASM-4 引擎进行开发。
              </li>
              <li>
                程序语言设计与实现赛道： 面向 14岁以上的开发者，使用 MoonBit
                编程语言面向 RISC-V 后端硬件平台开发。
              </li>
            </ul>
            <h2>三、赛事流程</h2>
            <img src='/img/contest/contest-timeline.png' alt='' />
            <h2>四、赛事规则</h2>
            <h3>4.1 报名和初赛期间</h3>
            <p>
              同步安排相应技术培训（具体培训时间请关注公众号：MoonBit
              ，或联系MoonBit 小助手微信moonbit_helper）。
            </p>
            <p>
              大赛分初赛和决赛两个阶段，初赛全程线上进行，初赛胜出团队中，按照成绩从高到低等因素综合评判，在两个赛道共评选出10个参赛队伍（原则上每个赛道
              5 队，队长 1
              人作为代表，将根据实际情况进行调整）拥有资格参加决赛路演，根据各参赛队伍路演情况，结合比赛规则、各项标准进行打分，最终评选结果将在决赛当日公布。
            </p>
            <p>
              为鼓励获奖队伍，主办方将视情况安排为期一日的线下名企大厂研学活动，表现优异者有机会获得由名企大厂提供的面试、实习机会。
            </p>
            <h3>4.2 报名名额及要求</h3>
            <ul>
              <li>参赛队为基本单位报名参赛，每个参赛队不能超过 5 人。</li>
              <li>同一单位允许报名的参赛队伍及进入决赛的队伍数量不限。</li>
              <li>每位参赛选手只能报名参加 1 支参赛队，不可重复报名。</li>
              <li>
                每个参赛队最多有两位指导教师，每位指导教师可同时指导本校多支参赛队。指导教师负责指导参赛队选题、组织学生参加赛前的技术培训，并鼓励学生应用大赛指定的实验平台进行作品的创意设计与实现，同时负责在大赛过程中与学校及组委会之间的信息沟通。如果参赛队伍以高校队伍的形式参赛，则适用本条规定。
              </li>
              <li>
                每位参赛选手需满14岁以上，每队需包含至少一名成年人，且需选出一人作为队长；每个参赛队伍之队长须于活动期间代表该团队负责比赛联系及得奖奖品领取等相关事宜。团队成员须自行分配团队内部的各项权责归属，若有任何争执之处（如奖品领取方式与分配），主办/执行单位不涉入处理。
              </li>
              <li>本次比赛同时面向全球开发者。</li>
              <li>
                参赛者保证提供的参赛者资料和信息真实、准确、合法、有效，同意并授权赛事主办方在法律允许的范围内，在下列情况下收集、存储和使用参赛者资料（包括姓名、性别、手机号码、电子邮箱、身份证号、照片、银行卡号等信息）：
                <ol>
                  <li>用于赛事报名、决赛评奖差旅事项、奖金发放；</li>
                  <li>用于赛事相关的公关材料、广告或宣传活动；</li>
                </ol>
              </li>
            </ul>
            <h3>4.3 报名方式</h3>
            <p>报名入口：</p>
            <ul>
              <li>
                游戏开发挑战赛道：
                <a href='https://tianchi.aliyun.com/s/42503d88fe6e219f3260251114461b54'>
                  https://tianchi.aliyun.com/s/42503d88fe6e219f3260251114461b54
                </a>
              </li>
              <li>
                程序语言设计与实现赛道：
                <a href='https://tianchi.aliyun.com/s/399e702c1b75629138f56fdb6f5e411a'>
                  https://tianchi.aliyun.com/s/399e702c1b75629138f56fdb6f5e411a
                </a>
              </li>
            </ul>
            <p>
              参赛队报名时需提交队伍信息至在线报名页面，信息包括队名，各队员姓名、相关技能、相关项目经验等信息。参赛队应确保所提交信息真实有效，并保持联系方式畅通。如信息不实或无法联系到参赛队，将会影响报名甚至取消成绩。
            </p>
            <h3>4.4 参赛费用</h3>
            <ul>
              <li>
                大赛不收取报名费、参赛费、评审费及技术平台购买费等任何费用。
              </li>
              <li>
                参赛选手代表在全国总决赛及颁奖典礼期间产生的交通、住宿费用由主办方提供（原则上指定队长一人为最终答辩代表），入围决赛队伍需按照相关流程提供对应的个人资料用于差旅预定，如不符合规定，主办方有权不提供并且撤销决赛资格。
              </li>
              <li>大赛指定的游戏引擎等资源由大赛组委会免费向参赛队提供。</li>
            </ul>
            <h2>五、竞赛管理</h2>
            <h3>5.1 初赛</h3>
            <h4>游戏开发挑战赛道</h4>
            <p>
              参赛队按照比赛指南要求在大赛网站提交作品设计方案。评审专家根据评分标准，对初赛作品进行打分，并按照分数对各参赛队进行排序，
              按初赛分数高低决定入围决赛的参赛队，最终进入决赛的队伍名额由评委根据作品质量等因素综合评判。
            </p>
            <h4>程序语言设计与实现赛道</h4>
            <p>
              参赛队按照比赛指南要求在大赛网站提交作品和相关源代码。评审专家通过评测系统给出的依照作品性能评估给出的客观分数，对各参赛队进行排序，按排序先后决定入围决赛的参赛队。
            </p>
            <h3>5.2 全国总决赛</h3>
            <ul>
              <li>
                原则上每个赛道分别有五个队伍到达决赛现场进行最终比拼，且由队长作为代表
              </li>
              <li>
                由大赛组委会组织决赛，决赛根据两个赛道评判标准等不同，设作品演示、性能测试、系统展示、答辩环节等环节。最终按决赛各环节的综合分数高低决定奖项归属。
              </li>
              <li>
                参赛团队必须按组委会要求参加决赛，未参赛的队伍视为自动放弃决赛资格。
              </li>
              <li>
                获奖参赛者应按照主办方发布/通知的奖金发放流程和规则领取奖金，包括但不限于及时提供身份证复印件、银行卡复印件等资料和信息，签署相关领奖文件等；未按前述流程和规则操作的，主办方有权不予发放奖金
              </li>
            </ul>
            <h2>六、奖项设置</h2>
            <img src='/img/contest/price.jpg' alt='' />
            <h2>七、知识产权及学术诚信</h2>
            <ul>
              <li>除另行说明，参赛作品的知识产权归参赛队所有。</li>
              <li>
                参赛队应自觉遵守知识产权的有关法规，不得侵犯他人的知识产权或其他权益，不得未经相关单位许可，对外共享或公开发布涉及该单位知识产权的作品及软件。如造成不良后果，相关法律责任由参赛队自行承担，大赛的主办、承办和协办方均不负任何法律责任。
              </li>
              <li>
                参赛队应保证学术诚信，一经确认代码抄袭或技术抄袭等学术不端行为，或代码重复率在50%以上，将取消参赛资格，并列入赛事黑名单。
              </li>
              <li>
                大赛报名者默认同意大赛的主办方公开赛道参赛作品源代码。大赛主办方拥有免费使用参赛作品进行演示和出版的权利（不涉及技术细节）。如果以盈利为目的使用参赛作品，需与参赛队协商，经参赛队同意后，签署有关对参赛作品使用的协议。
              </li>
            </ul>
            <h2>八、交流与宣传</h2>
            <ul>
              <li>
                大赛致力于推动计算机软件开发专业建设，助力编程语言领域创新人才梯队培育，培养编程语言这一基础软件领域的后备人才，为学术与创新交流合作提供平台。大赛期间鼓励参赛队伍间举办各种形式的交流活动，并对参赛期间优秀作品和参赛团队进行宣传。
              </li>
              <li>
                大赛主办方欢迎行业内各大机构或组织共同参与大赛的组织、命题、宣传、赞助等活动，提升本赛事质量及影响力。
              </li>
              <li>
                报名本次比赛默认同意主办方使用选手参加比赛期间的肖像权，主办方仅使用肖像用于赛事相关内容的宣传
              </li>
              <li>
                合作宣传等需求请联系邮箱：
                <a href='mailto:jichuruanjian@idea.edu.cn'>
                  jichuruanjian@idea.edu.cn
                </a>
              </li>
            </ul>
            <h2>九、竞赛组织</h2>
            <h3>指导单位</h3>
            <div className={styles['with-border']}>
              河套深港科技创新合作区深圳园区发展署
            </div>
            <h3>主办单位</h3>
            <div className={styles['logos']}>
              <div className={styles['logo']}>
                <img src='/img/contest/idea.png' alt='' />
              </div>
            </div>
            <h3>协办单位</h3>
            <div className={styles['logos']}>
              <div className={styles['logo']}>
                <img src='/img/contest/tencent-cloud.jpg' alt='' />
              </div>
              <div className={styles['logo']}>
                <img src='/img/contest/stic.jpg' alt='' />
              </div>
              <div className={styles['logo']}>
                <img src='/img/contest/aliyun.png' alt='' />
              </div>
              <div className={styles['logo']}>深圳市福田区福保街道办事处</div>
            </div>
            <h3>名誉评委（按姓氏笔划排序）</h3>
            <div className={styles['judges']}>
              <div className={styles['judge__video']}>
                <video controls src='/videos/shenxiangyang.mp4'></video>
              </div>
              <div className={styles['judge__bib']}>
                <div className={styles['judge__name']}>沈向洋</div>
                <div className={styles['judge__title']}>
                  粤港澳大湾区数字经济研究院创院理事长
                </div>
              </div>
              <div
                className={`${styles['judge__video']} ${styles['judge__lin']}`}
              >
                <img src='/img/contest/linhuiming.png' alt='' />
              </div>
              <div className={styles['judge__bib']}>
                <div className={styles['judge__name']}>林惠民</div>
                <div className={styles['judge__title']}>
                  中国科学院院士、
                  <br />
                  中国科学院软件研究所学术委员会主任
                </div>
              </div>
              <div className={styles['judge__video']}>
                <video controls src='/videos/zhaozhen.mp4'></video>
              </div>
              <div className={styles['judge__bib']}>
                <div className={styles['judge__name']}>赵琛</div>
                <div className={styles['judge__title']}>
                  中国科学院软件研究所，所长
                </div>
              </div>
              <div className={styles['judge__video']}>
                <video controls src='/videos/nimingxuan.mp4'></video>
              </div>
              <div className={styles['judge__bib']}>
                <div className={styles['judge__name']}>倪明选</div>
                <div className={styles['judge__title']}>
                  IEEE终身会士、香港工程科学院院士、
                  <br />
                  香港科技大学（广州）创校校长
                </div>
              </div>
            </div>
            <h3>合作单位</h3>
            <div>
              <div className={styles['logos']}>
                <div className={styles['logo--iscas']}>
                  <div className={styles['logo--iscas-left']}>
                    <img src='/img/contest/iscas.png' alt='' />
                  </div>
                  <div className={styles['logo--iscas-right']}>
                    <div>
                      <img src='/img/contest/plct.png' alt='' />
                    </div>
                    <div>
                      <img src='/img/contest/summer-opensource.svg' alt='' />
                    </div>
                  </div>
                </div>
                <div className={styles['logo']}>
                  <img src='/img/contest/syu.png' alt='' />
                </div>
                <div className={styles['logo']}>
                  <img src='/img/contest/hkust.png' alt='' />
                </div>
              </div>
            </div>
            <h2>特别说明</h2>
            <ul>
              <li>
                报名比赛，我们即默认参赛选手您同意并自愿遵守大赛章程的全部内容
              </li>
              <li>
                大赛组委会保留对本方案的最终解释权，并有权根据实际情况调整竞赛流程和相关要求。
              </li>
              <li>
                参赛选手请添加官方大赛答疑咨询总群，请扫描二维码加入（或搜索微信号：moonbit_helper）
              </li>
              <li>
                <a href='/2024-mgpic-privacy'>隐私政策</a>
              </li>
            </ul>
          </article>
        </div>
      </main>
    </Layout>
  )
}

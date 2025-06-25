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
import style from './style.module.css'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { useEffect, useState } from 'react'
import {
  getCommitCount,
  getContributors,
  getMergedPRCount
} from '@site/lib/utils'
import type { IconType } from 'react-icons'
import { FaCodePullRequest, FaCodeCommit } from 'react-icons/fa6'
import { GoPersonFill } from 'react-icons/go'
import { translate } from '@docusaurus/Translate'
import clsx from 'clsx'

type StatisticProps = {
  Icon: IconType
  text: string
  number: string
}

function Statistic(props: StatisticProps) {
  const { Icon, text, number } = props
  return (
    <div className={style['statistic-card']}>
      <Icon className={style['statistic-icon']} />
      <div className={style['statistic-title']}>{text}</div>
      <div>{number}</div>
    </div>
  )
}

function useCommitCount() {
  const initCount = useDocusaurusContext().siteConfig.customFields
    ?.commitCount as string
  const [commitCount, setCommitCount] = useState(initCount)

  useEffect(() => {
    const get = async () => {
      const count = await getCommitCount()
      if (count) {
        setCommitCount(count)
      }
    }
    get()
  }, [])

  return commitCount
}

function useMergePRCount() {
  const initCount = useDocusaurusContext().siteConfig.customFields
    ?.mergedPRCount as string

  const [mergedPRCount, setMergedPRCount] = useState(initCount)
  useEffect(() => {
    const get = async () => {
      const count = await getMergedPRCount()
      if (count) {
        setMergedPRCount(count)
      }
    }
    get()
  }, [])
  return mergedPRCount
}

function Statistics() {
  const statistics: StatisticProps[] = [
    {
      Icon: GoPersonFill,
      text: translate({ id: 'page.contributor.contributors' }),
      number: useContributors().length.toString()
    },
    {
      Icon: FaCodePullRequest,
      text: translate({ id: 'page.contributor.PR' }),
      number: useMergePRCount()
    },
    {
      Icon: FaCodeCommit,
      text: translate({ id: 'page.contributor.commit' }),
      number: useCommitCount()
    }
  ]
  return (
    <div className='row'>
      {statistics.map((statistic) => (
        <div
          className='col col--4'
          style={{ paddingBlock: 'var(--ifm-spacing-vertical)' }}
          key={statistic.text}
        >
          <Statistic {...statistic} />
        </div>
      ))}
    </div>
  )
}

type ContributorProps = {
  login: string // username
  avatar_url: string
  html_url: string // contributor github page
}

function Contributor(props: ContributorProps) {
  const { login, avatar_url, html_url } = props
  return (
    <div className='card'>
      <div className={style['contributor__avatar']}>
        <a href={html_url}>
          <img src={avatar_url}></img>
        </a>
      </div>
      <div className={style['contributor__body']}>
        <a href={html_url}>{login}</a>
      </div>
    </div>
  )
}

function useContributors() {
  const [contributors, setContributors] = useState<ContributorProps[]>(
    useDocusaurusContext().siteConfig.customFields
      ?.contributors as ContributorProps[]
  )

  useEffect(() => {
    const get = async () => {
      const contributors = await getContributors()
      if (Array.isArray(contributors)) {
        setContributors(contributors)
      }
    }
    get()
  }, [])

  return contributors
}

function Contributors() {
  const contributors = useContributors()
  return (
    <div className='row'>
      {contributors.map((contributor) => (
        <div
          className={clsx('col', 'col--2', style['contributors-col'])}
          style={{ paddingBlock: 'var(--ifm-spacing-vertical)' }}
          key={contributor.login}
        >
          <Contributor {...contributor} />
        </div>
      ))}
      <div></div>
    </div>
  )
}

export default function Page() {
  return (
    <Layout>
      <main className={style['main']}>
        <section className={style['section']}>
          <h1>{translate({ id: 'page.contributor.title' })}</h1>
          <Statistics />
        </section>
        <section className={style['contributors-section']}>
          <h1 className={style['contributors-section-title']}>
            {translate({ id: 'page.contributor.contributors' })}
          </h1>
          <Contributors />
          <a
            className={style['contributors-section-link']}
            href='https://github.com/moonbitlang/core/graphs/contributors'
          >
            {translate({ id: 'page.contributor.viewAllContributors' })}
          </a>
        </section>
      </main>
    </Layout>
  )
}

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

import Link from '@docusaurus/Link'
import { Content } from '@theme/BlogPostPage'
import { useDateTimeFormat } from '@docusaurus/theme-common/internal'
import Heading from '@theme/Heading'
import styles from './styles.module.css'
import clsx from 'clsx'

type Props = {
  content: Content
  isHero?: boolean
}

export default function ListItem(props: Props): JSX.Element {
  const { content } = props
  const isHero = props.isHero || false

  const dateTimeFormat = useDateTimeFormat({
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })

  const formatDate = (blogDate: string) =>
    dateTimeFormat.format(new Date(blogDate))

  return (
    <div
      className={isHero ? 'col col--12' : 'col col--4'}
      style={{ paddingBlock: 'var(--ifm-spacing-vertical)' }}
    >
      <div className='card' style={{ height: '100%' }}>
        <div className={clsx('card__image', isHero ? styles.hero : '')}>
          <Link to={content.metadata.permalink} className={styles.link}>
            <img
              src={content.assets.image ?? content.frontMatter.image}
              alt={content.metadata.title}
            />
          </Link>
        </div>
        <div className='card__body'>
          <p>{formatDate(content.metadata.date)}</p>
          <Heading as={isHero ? 'h2' : 'h3'}>
            <a href={content.metadata.permalink}>{content.metadata.title}</a>
          </Heading>
        </div>
      </div>
    </div>
  )
}

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

import React from 'react'
import styles from './styles.module.css'
import Link from '@docusaurus/Link'
import { useDateTimeFormat } from '@docusaurus/theme-common/internal'
import Heading from '@theme/Heading'
import type { BlogPostMetadata } from '@site/.docusaurus/docusaurus-plugin-content-blog/default/blog-posts-metadata.json'

const RecentBlogPost: React.FC<{ post: BlogPostMetadata }> = ({ post }) => {
  const { metadata } = post
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
      className='col col--4'
      style={{
        paddingBlock: 'var(--ifm-spacing-vertical)'
      }}
    >
      <div
        className='card'
        style={{ height: '100%', backgroundColor: '#242526' }}
      >
        <div className={'card__image'}>
          <Link className={styles.link} to={metadata.permalink}>
            <img src={metadata.frontMatter.image} alt='blog cover' />
          </Link>
        </div>
        <div className='card__body'>
          <p>{formatDate(metadata.date as unknown as string)}</p>
          <Heading as={'h3'}>
            <a href={metadata.permalink}>{metadata.title}</a>
          </Heading>
        </div>
      </div>
    </div>
  )
}

export default RecentBlogPost

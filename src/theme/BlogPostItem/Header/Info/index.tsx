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
import clsx from 'clsx'
import { translate } from '@docusaurus/Translate'
import { usePluralForm } from '@docusaurus/theme-common'
import { useDateTimeFormat } from '@docusaurus/theme-common/internal'
import { useBlogPost } from '@docusaurus/plugin-content-blog/client'
import type { Props } from '@theme/BlogPostItem/Header/Info'
import ShareButtons from '@site/src/components/ShareButtons'
import styles from './styles.module.css'

// Very simple pluralization: probably good enough for now
function useReadingTimePlural() {
  const { selectMessage } = usePluralForm()
  return (readingTimeFloat: number) => {
    const readingTime = Math.ceil(readingTimeFloat)
    return selectMessage(
      readingTime,
      translate(
        {
          id: 'theme.blog.post.readingTime.plurals',
          description:
            'Pluralized label for "{readingTime} min read". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',
          message: 'One min read|{readingTime} min read'
        },
        { readingTime }
      )
    )
  }
}

function ReadingTime({ readingTime }: { readingTime: number }) {
  const readingTimePlural = useReadingTimePlural()
  return <>{readingTimePlural(readingTime)}</>
}

function DateTime({
  date,
  formattedDate
}: {
  date: string
  formattedDate: string
}) {
  return <time dateTime={date}>{formattedDate}</time>
}

function Spacer() {
  return <>{' · '}</>
}

export default function BlogPostItemHeaderInfo({
  className
}: Props): JSX.Element {
  const { metadata } = useBlogPost()
  const { date, readingTime } = metadata

  const dateTimeFormat = useDateTimeFormat({
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })

  const formatDate = (blogDate: string) =>
    dateTimeFormat.format(new Date(blogDate))

  return (
    <div className={clsx(styles.container, 'margin-vert--md', className)}>
      <DateTime date={date} formattedDate={formatDate(date)} />
      {typeof readingTime !== 'undefined' && (
        <>
          <Spacer />
          <ReadingTime readingTime={readingTime} />
          <ShareButtons />
        </>
      )}
    </div>
  )
}

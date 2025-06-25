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
import LinkItem from '@theme/Footer/LinkItem'
import type { Props } from '@theme/Footer/Links/MultiColumn'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

type ColumnType = Props['columns'][number]
type ColumnItemType = ColumnType['items'][number]

function ColumnLinkItem({ item }: { item: ColumnItemType }) {
  return item.html ? (
    <li
      className='footer__item'
      // Developer provided the HTML, so assume it's safe.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: item.html }}
    />
  ) : (
    <li key={item.href ?? item.to} className='footer__item'>
      <LinkItem item={item} />
    </li>
  )
}

function Column({ column }: { column: ColumnType }) {
  const { i18n } = useDocusaurusContext()
  return (
    <div className='col footer__col' style={{ flex: '1' }}>
      <div className='footer__title'>{column.title}</div>
      <ul className='footer__items clean-list'>
        {column.items
          .filter(
            (item) =>
              item.locale &&
              (item.locale as string[]).includes(i18n.currentLocale)
          )
          .map((item, i) => (
            <ColumnLinkItem key={i} item={item} />
          ))}
      </ul>
    </div>
  )
}

export default function FooterLinksMultiColumn({
  columns
}: Props): JSX.Element {
  return (
    <div className='row'>
      {columns.map((column, i) => (
        <Column key={i} column={column} />
      ))}
    </div>
  )
}

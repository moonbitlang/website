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
import type { Props } from '@theme/Footer/Links/Simple'

function Separator() {
  return <span className='footer__link-separator'>·</span>
}

function SimpleLinkItem({ item }: { item: Props['links'][number] }) {
  return item.html ? (
    <span
      className='footer__link-item'
      // Developer provided the HTML, so assume it's safe.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: item.html }}
    />
  ) : (
    <LinkItem item={item} />
  )
}

export default function FooterLinksSimple({ links }: Props): JSX.Element {
  return (
    <div className='footer__links text--center'>
      <div className='footer__links'>
        {links.map((item, i) => (
          <React.Fragment key={i}>
            <SimpleLinkItem item={item} />
            {links.length !== i + 1 && <Separator />}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

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
import styles from './styles.module.css'
import { useLocation } from '@docusaurus/router'
import type { Props } from '@theme/Footer/Copyright'

export default function FooterCopyright({ copyright }: Props): JSX.Element {
  const location = useLocation()
  return (
    <div className={clsx('footer__copyright', styles['copyright-wrapper'])}>
      {copyright}
      {location.pathname === '/' && (
        <>
          <a
            href='https://beian.miit.gov.cn/'
            style={{ color: 'var(--ifm-footer-color)' }}
          >
            粤ICP备2020119212号
          </a>
          <a
            className={styles['beian']}
            href='https://beian.mps.gov.cn/#/query/webSearch?code=44030002004653'
            rel='noreferrer'
            target='_blank'
          >
            <div>
              <img src='/img/index/beian.png' alt='' />
            </div>
            粤公网安备44030002004653
          </a>
        </>
      )}
    </div>
  )
}

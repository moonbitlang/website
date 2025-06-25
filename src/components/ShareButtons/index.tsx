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
import { useLocation } from '@docusaurus/router'
import useBaseUrl from '@docusaurus/useBaseUrl'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { FaXTwitter, FaFacebook, FaLink } from 'react-icons/fa6'
import styles from './index.module.css'

export default function ShareButtons(): JSX.Element {
  const url =
    useDocusaurusContext().siteConfig.url + useBaseUrl(useLocation().pathname)
  return (
    <span className={styles.ShareButtons}>
      <Link
        className={styles.ShareButton}
        to={'https://x.com/intent/tweet?url=' + url}
      >
        <FaXTwitter size='2em' />
      </Link>
      <Link
        className={styles.ShareButton}
        to={'https://www.facebook.com/sharer/sharer.php?u=' + url}
      >
        <FaFacebook size='2em' />
      </Link>
      <Link
        className={styles.ShareButton}
        to='#'
        onClick={() => {
          navigator.clipboard.writeText(url)
        }}
      >
        <FaLink size='2em' />
      </Link>
    </span>
  )
}

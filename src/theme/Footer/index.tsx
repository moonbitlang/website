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

import { useThemeConfig } from '@docusaurus/theme-common'
import FooterLinks from '@theme/Footer/Links'
import FooterLogo from '@theme/Footer/Logo'
import FooterCopyright from '@theme/Footer/Copyright'
import FooterLayout from '@theme/Footer/Layout'

function Footer(): JSX.Element | null {
  const { footer } = useThemeConfig()
  if (!footer) {
    return null
  }
  const { copyright, links, logo, style } = footer

  return (
    <FooterLayout
      style={style}
      links={links && links.length > 0 && <FooterLinks links={links} />}
      logo={logo && <FooterLogo logo={logo} />}
      copyright={copyright && <FooterCopyright copyright={copyright} />}
    />
  )
}

export default React.memo(Footer)

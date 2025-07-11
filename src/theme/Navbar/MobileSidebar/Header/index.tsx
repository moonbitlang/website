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
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal'
import { translate } from '@docusaurus/Translate'
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle'
import IconClose from '@theme/Icon/Close'
import NavbarLogo from '@theme/Navbar/Logo'

function CloseButton() {
  const mobileSidebar = useNavbarMobileSidebar()
  return (
    <button
      type='button'
      aria-label={translate({
        id: 'theme.docs.sidebar.closeSidebarButtonAriaLabel',
        message: 'Close navigation bar',
        description: 'The ARIA label for close button of mobile sidebar'
      })}
      className='clean-btn navbar-sidebar__close'
      onClick={() => mobileSidebar.toggle()}
    >
      <IconClose color='var(--ifm-color-emphasis-600)' />
    </button>
  )
}

export default function NavbarMobileSidebarHeader(): JSX.Element {
  return (
    <div className='navbar-sidebar__brand'>
      <NavbarLogo />
      <NavbarColorModeToggle className='margin-right--md' />
      <CloseButton />
    </div>
  )
}

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
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { useAlternatePageUtils } from '@docusaurus/theme-common/internal'
import { translate } from '@docusaurus/Translate'
import { useLocation } from '@docusaurus/router'
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem'
import IconLanguage from '@theme/Icon/Language'
import type { LinkLikeNavbarItemProps } from '@theme/NavbarItem'
import type { Props } from '@theme/NavbarItem/LocaleDropdownNavbarItem'

import styles from './styles.module.css'

export default function LocaleDropdownNavbarItem({
  mobile,
  dropdownItemsBefore,
  dropdownItemsAfter,
  ...props
}: Props): JSX.Element {
  const {
    i18n: { currentLocale, locales, localeConfigs }
  } = useDocusaurusContext()
  const { pathname, search, hash } = useLocation()

  const localeItems = locales.map((locale): LinkLikeNavbarItemProps => {
    const host =
      locale === 'en'
        ? 'https://www.moonbitlang.com'
        : 'https://www.moonbitlang.cn'
    // preserve ?search#hash suffix on locale switches
    const to = `${host}${pathname}${search}${hash}`
    return {
      label: localeConfigs[locale]!.label,
      lang: localeConfigs[locale]!.htmlLang,
      to,
      target: '_self',
      autoAddBaseUrl: false,
      className:
        // eslint-disable-next-line no-nested-ternary
        locale === currentLocale
          ? // Similar idea as DefaultNavbarItem: select the right Infima active
            // class name. This cannot be substituted with isActive, because the
            // target URLs contain `pathname://` and therefore are not NavLinks!
            mobile
            ? 'menu__link--active'
            : 'dropdown__link--active'
          : ''
    }
  })

  const items = [...dropdownItemsBefore, ...localeItems, ...dropdownItemsAfter]

  // Mobile is handled a bit differently
  const dropdownLabel = mobile
    ? translate({
        message: 'Languages',
        id: 'theme.navbar.mobileLanguageDropdown.label',
        description: 'The label for the mobile language switcher dropdown'
      })
    : localeConfigs[currentLocale]!.label

  return (
    <DropdownNavbarItem
      {...props}
      mobile={mobile}
      label={
        <>
          <IconLanguage className={styles.iconLanguage} />
          {dropdownLabel}
        </>
      }
      items={items}
    />
  )
}

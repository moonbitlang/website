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

import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames
} from '@docusaurus/theme-common'
import BlogLayout from '@theme/BlogLayout'
import BlogListPaginator from '@theme/BlogListPaginator'
import SearchMetadata from '@theme/SearchMetadata'
import type { Props } from '@theme/BlogListPage'
import BlogPostItems from '@theme/BlogPostItems'
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData'
import Layout from '@theme/Layout'
import styles from './styles.module.css'
import ListItem from './ListItem'

function BlogListPageMetadata(props: Props): JSX.Element {
  const { metadata } = props
  const {
    siteConfig: { title: siteTitle }
  } = useDocusaurusContext()
  const { blogDescription, blogTitle, permalink } = metadata
  const isBlogOnlyMode = permalink === '/'
  const title = isBlogOnlyMode ? siteTitle : blogTitle
  return (
    <>
      <PageMetadata title={title} description={blogDescription} />
      <SearchMetadata tag='blog_posts_list' />
    </>
  )
}

function DefaultBlogListPageContent(props: Props): JSX.Element {
  const { metadata, items, sidebar } = props
  return (
    <BlogLayout sidebar={sidebar}>
      <BlogPostItems items={items} />
      <BlogListPaginator metadata={metadata} />
    </BlogLayout>
  )
}

function CardBlogListPageContent(props: Props): JSX.Element {
  const { metadata } = props
  const items = props.items.filter(
    (item) =>
      !(item.content.frontMatter.draft || item.content.frontMatter.unlisted)
  )
  const firstItem = items[0]
  const otherItems = items.slice(1)

  return (
    <Layout>
      <main className={styles.root}>
        <h1>{metadata.blogTitle}</h1>
        <h2 className={styles.description}>{metadata.blogDescription}</h2>
        <div className='row'>
          <ListItem {...firstItem} isHero />
        </div>
        <div className='row'>
          {otherItems.map((item) => (
            <ListItem {...item} key={item.content.metadata.title} />
          ))}
        </div>
      </main>
    </Layout>
  )
}

export default function BlogListPage(props: Props): JSX.Element {
  const BlogListPageContent =
    props.metadata.permalink === '/blog' ||
    props.metadata.permalink === '/zh/blog'
      ? CardBlogListPageContent
      : DefaultBlogListPageContent
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage
      )}
    >
      <BlogListPageMetadata {...props} />
      <BlogListPageStructuredData {...props} />
      <BlogListPageContent {...props} />
    </HtmlClassNameProvider>
  )
}

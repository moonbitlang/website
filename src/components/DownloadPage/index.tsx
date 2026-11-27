/*
 * Copyright 2026 International Digital Economy Academy
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

import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from '@docusaurus/router'
import useBaseUrl from '@docusaurus/useBaseUrl'
import useIsBrowser from '@docusaurus/useIsBrowser'
import CodeBlock from '@theme/CodeBlock'
import CodeBlockContainer from '@theme/CodeBlock/Container'
import TabItem from '@theme/TabItem'
import Tabs from '@theme/Tabs'
import styles from './styles.module.css'

type DownloadPageCopy = {
  title: string
  cliId: string
  cliTitle: string
  cliIntro: string
  verifyBefore: string
  verifyAfter: string
  installer: string
  vscodeId: string
  vscodeTitle: string
  instructionsId: string
  extensionBefore: string
  extensionAfter: string
  paletteBefore: string
  onMac: string
  onWindowsLinux: string
  paletteAfter: string
  restartStep: string
  marketplace: string
  play: string
  pause: string
  firstProject: string
  checksumsId: string
  checksumsTitle: string
  checksumsIntro: string
  checksumsExample: string
  help: string
  helpJoin: string
  forum: string
  helpEnd: string
}

const archives = [
  {
    value: 'mac-m1',
    label: 'macOS (Apple Silicon)',
    file: 'moonbit-darwin-aarch64.tar.gz',
    language: 'bash'
  },
  {
    value: 'ubuntu',
    label: 'Linux (x86-64)',
    file: 'moonbit-linux-x86_64.tar.gz',
    language: 'bash'
  },
  {
    value: 'windows',
    label: 'Windows (x86-64)',
    file: 'moonbit-windows-x86_64.zip',
    language: 'powershell'
  }
]

function InstallDemo({ play, pause }: { play: string; pause: string }) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const userPaused = useRef(false)
  const demo = useBaseUrl('videos/vsc_mbt_install.mp4')
  const poster = useBaseUrl('videos/vsc_mbt_install.webp')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const panel = video.closest('[role="tabpanel"]')
    let inView = false

    const updatePlayback = () => {
      if (!inView || panel?.hasAttribute('hidden')) {
        video.pause()
      } else if (!reducedMotion.matches && !userPaused.current) {
        void video.play().catch(() => setPlaying(false))
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      updatePlayback()
    })
    const panelObserver = new MutationObserver(updatePlayback)

    observer.observe(video)
    if (panel) {
      panelObserver.observe(panel, {
        attributes: true,
        attributeFilter: ['hidden']
      })
    }

    return () => {
      observer.disconnect()
      panelObserver.disconnect()
      video.pause()
    }
  }, [])

  function toggleDemo() {
    const video = videoRef.current
    if (!video) return

    userPaused.current = !video.paused
    if (userPaused.current) {
      video.pause()
    } else {
      void video.play().catch(() => setPlaying(false))
    }
  }

  return (
    <button
      type='button'
      className={styles.demo}
      aria-label={playing ? pause : play}
      title={playing ? pause : play}
      onClick={toggleDemo}
    >
      <video
        ref={videoRef}
        src={demo}
        poster={poster}
        width={800}
        height={520}
        muted
        loop
        playsInline
        preload='none'
        aria-hidden='true'
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && <span className={styles.demoPlay} aria-hidden='true' />}
    </button>
  )
}

export default function DownloadPage({
  copy,
  children
}: {
  copy: DownloadPageCopy
  children: React.ReactNode
}) {
  const installer = copy.installer
  const { hash } = useLocation()
  const isBrowser = useIsBrowser()
  const fragment = isBrowser ? hash.slice(1) : ''
  const linksToVsCode = ['vscode', copy.vscodeId, copy.instructionsId].some(
    (id) => fragment === id || fragment === encodeURIComponent(id)
  )

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>{copy.title}</h1>
        {children}
      </header>

      <div className={styles.installOptions}>
        <Tabs
          key={fragment}
          className={styles.methodTabs}
          defaultValue={linksToVsCode ? 'vscode' : 'cli'}
        >
          <TabItem
            value='cli'
            label={copy.cliTitle}
            attributes={{ id: copy.cliId }}
          >
            <section
              id='cli'
              aria-labelledby={copy.cliId}
              className={styles.installPanel}
            >
              <p>{copy.cliIntro}</p>
              <CodeBlockContainer as='div' className={styles.terminal}>
                <Tabs className={styles.systemTabs}>
                  <TabItem value='linux-and-mac' label='Linux & macOS'>
                    <CodeBlock language='bash'>
                      {`curl -fsSL ${installer}/install/unix.sh | bash`}
                    </CodeBlock>
                  </TabItem>
                  <TabItem value='windows' label='Windows'>
                    <CodeBlock language='powershell'>
                      {`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser\nirm ${installer}/install/powershell.ps1 | iex`}
                    </CodeBlock>
                  </TabItem>
                </Tabs>
              </CodeBlockContainer>
              <p className={styles.verify}>
                {copy.verifyBefore}
                <code>moon version</code>
                {copy.verifyAfter}
              </p>
            </section>
          </TabItem>

          <TabItem
            value='vscode'
            label={copy.vscodeTitle}
            attributes={{ id: copy.vscodeId }}
          >
            <section
              id='vscode'
              aria-labelledby={copy.vscodeId}
              className={`${styles.installPanel} ${styles.vscodePanel}`}
            >
              <div>
                <ol id={copy.instructionsId} className={styles.steps}>
                  <li>
                    {copy.extensionBefore}
                    <a href='https://code.visualstudio.com/download'>VS Code</a>
                    {copy.extensionAfter}
                  </li>
                  <li>
                    {copy.paletteBefore} <kbd>Shift+Cmd+P</kbd> {copy.onMac}{' '}
                    <kbd>Ctrl+Shift+P</kbd>
                    {copy.onWindowsLinux}{' '}
                    <code>MoonBit: Install moonbit toolchain</code>
                    {copy.paletteAfter}
                  </li>
                  <li>{copy.restartStep}</li>
                </ol>
                <a
                  className={styles.marketplace}
                  href='https://marketplace.visualstudio.com/items?itemName=moonbit.moonbit-lang'
                >
                  {copy.marketplace} <span aria-hidden='true'>↗</span>
                </a>
              </div>

              <InstallDemo play={copy.play} pause={copy.pause} />
            </section>
          </TabItem>
        </Tabs>
      </div>

      <div className={styles.resources}>
        <details>
          <summary>{copy.firstProject}</summary>
          <CodeBlock language='bash'>
            {'moon new hello\ncd hello\nmoon run cmd/main'}
          </CodeBlock>
        </details>
        <details id={copy.checksumsId}>
          <summary>{copy.checksumsTitle}</summary>
          <p>{copy.checksumsIntro}</p>
          <Tabs>
            {archives.map(({ value, label, file, language }) => {
              const binary = file.replace(/\.(tar\.gz|zip)$/, '')
              const url = `${installer}/binaries/latest/`
              const paths = [`${binary}.sha256`, `${file}.sha256`]
              const commands = paths.map((path) =>
                language === 'powershell'
                  ? `Invoke-WebRequest -Uri ${url}${path} -OutFile ${path}`
                  : `curl -fLO ${url}${path}`
              )

              return (
                <TabItem key={value} value={value} label={label}>
                  <CodeBlock language={language}>
                    {commands.join('\n')}
                  </CodeBlock>
                </TabItem>
              )
            })}
          </Tabs>
          <p>{copy.checksumsExample}</p>
          <CodeBlock language='bash'>
            {'shasum -a 256 -c moonbit-darwin-aarch64.tar.gz.sha256'}
          </CodeBlock>
        </details>
      </div>

      <p className={styles.help}>
        {copy.help}{' '}
        <a href='https://github.com/moonbitlang/moonbit-docs'>GitHub</a>
        {copy.helpJoin}
        <a href='https://discuss.moonbitlang.com/'>{copy.forum}</a>
        {copy.helpEnd}
      </p>
    </div>
  )
}

import { useEffect } from 'react'
import { useColorMode } from '@docusaurus/theme-common'
import clsx from 'clsx'
import styles from './wrapper.module.css'

const mountId = 'rabbita-scc-showcase'
const scriptId = 'rabbita-scc-showcase-script'
const styleId = 'rabbita-scc-showcase-style'
const scriptSrc = '/rabbita-2026-scc-showcase/main.js'
const styleHref = '/rabbita-2026-scc-showcase/styles.css'

type Props = {
  lightModeLabel: string
  darkModeLabel: string
  toggleLabel: string
}

export default function RabbitaShowcaseMount({
  lightModeLabel,
  darkModeLabel,
  toggleLabel
}: Props) {
  const { colorMode, setColorMode } = useColorMode()

  useEffect(() => {
    const oldScript = document.getElementById(scriptId)
    if (oldScript) {
      oldScript.remove()
    }

    const oldStyle = document.getElementById(styleId)
    if (oldStyle) {
      oldStyle.remove()
    }

    const mount = document.getElementById(mountId)
    if (mount) {
      mount.innerHTML = ''
    }

    const style = document.createElement('link')
    style.id = styleId
    style.rel = 'stylesheet'
    style.href = `${styleHref}?ts=${Date.now()}`
    document.head.appendChild(style)

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `${scriptSrc}?ts=${Date.now()}`
    script.defer = true
    document.body.appendChild(script)

    return () => {
      script.remove()
      style.remove()
      const cleanupMount = document.getElementById(mountId)
      if (cleanupMount) {
        cleanupMount.innerHTML = ''
      }
    }
  }, [])

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.modeSwitch} role='group' aria-label={toggleLabel}>
          <button
            type='button'
            className={clsx(
              styles.modeButton,
              colorMode !== 'dark' && styles.modeButtonActive
            )}
            onClick={() => setColorMode('light')}
            aria-pressed={colorMode !== 'dark'}
          >
            {lightModeLabel}
          </button>
          <button
            type='button'
            className={clsx(
              styles.modeButton,
              colorMode === 'dark' && styles.modeButtonActive
            )}
            onClick={() => setColorMode('dark')}
            aria-pressed={colorMode === 'dark'}
          >
            {darkModeLabel}
          </button>
        </div>
      </div>
      <div id={mountId} />
    </>
  )
}

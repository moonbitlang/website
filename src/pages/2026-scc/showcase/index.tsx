import ContestLayout from '@site/src/components/ContestLayout'
import ContestNavbar, { items2026en } from '@site/src/components/ContestNavbar'
import ShowcaseMount from './ShowcaseMount'
import styles from './wrapper.module.css'

export default function Page() {
  return (
    <ContestLayout
      heroImg='/img/2026-contest/kv-en.jpg'
      mobileHeroImg='/img/2026-contest/kv-en.jpg'
      heroBgColor='#09184c'
      heroBackdropImg='/img/2026-contest/kv-en.jpg'
    >
      <div className={styles.shell}>
        <ContestNavbar activeIndex={1} items={items2026en} qqGroup={false} />
        <ShowcaseMount
          localeToggleLabel='Language'
          themeToggleLabel='Theme'
          localeOptions={[
            { label: '中文', locale: 'zh', isActive: false },
            { label: 'English', locale: 'en', isActive: true }
          ]}
          lightModeLabel='Light Mode'
          darkModeLabel='Dark Mode'
        />
      </div>
    </ContestLayout>
  )
}

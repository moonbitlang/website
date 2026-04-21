import ContestLayout from '@site/src/components/ContestLayout'
import ContestNavbar, { items2026 } from '@site/src/components/ContestNavbar'
import RabbitaShowcaseMount from '@site/src/components/RabbitaShowcaseMount'
import styles from '@site/src/pages/2026-scc/showcase/wrapper.module.css'

export default function Page() {
  return (
    <ContestLayout
      heroImg='/img/2026-contest/kv.jpg'
      mobileHeroImg='/img/2026-contest/kv.jpg'
      qqGroupImg='/img/2026-contest/qq-group.png'
      heroBgColor='#09184c'
      heroBackdropImg='/img/2026-contest/kv.jpg'
    >
      <div className={styles.shell}>
        <ContestNavbar activeIndex={1} items={items2026} qqGroup={false} />
        <RabbitaShowcaseMount
          localeToggleLabel='语言'
          themeToggleLabel='主题'
          localeOptions={[
            { label: '中文', href: '/zh/2026-scc/showcase/', isActive: true },
            { label: 'English', href: '/2026-scc/showcase/', isActive: false }
          ]}
          lightModeLabel='白天模式'
          darkModeLabel='夜间模式'
        />
      </div>
    </ContestLayout>
  )
}

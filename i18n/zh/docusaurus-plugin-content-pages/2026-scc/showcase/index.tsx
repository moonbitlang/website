import ContestLayout from '@site/src/components/ContestLayout'
import ContestNavbar, { items2026 } from '@site/src/components/ContestNavbar'
import RabbitaShowcaseMount from '@site/src/pages/2026-scc/showcase/RabbitaShowcaseMount'
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
          lightModeLabel='白天模式'
          darkModeLabel='夜间模式'
          toggleLabel='展示墙主题切换'
        />
      </div>
    </ContestLayout>
  )
}

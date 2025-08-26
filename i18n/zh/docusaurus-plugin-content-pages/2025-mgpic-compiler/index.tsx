import Content from './content.mdx'
import ContestLayout from '@site/src/components/ContestLayout'

export default function Page() {
  return (
    <ContestLayout
      heroImg='/img/2025-contest/kv.jpg'
      mobileHeroImg='/img/2025-contest/mobile-kv.jpg'
      qqGroupId='914387051'
      qqGroupImg='/img/contest/qq-group.jpg'
    >
      <Content />
    </ContestLayout>
  )
}

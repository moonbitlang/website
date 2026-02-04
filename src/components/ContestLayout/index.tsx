import Layout from '@theme/Layout'
import styles from './styles.module.css'

type HeroProps = {
  img: string
  mobileHeroImg: string
}

type LayoutProps = {
  heroImg: string
  mobileHeroImg: string
  qqGroupImg: string
  qqGroupId: string
  children: React.ReactNode
}

export default function ContestLayout(props: LayoutProps) {
  const { heroImg, mobileHeroImg, children, qqGroupId, qqGroupImg } = props
  return (
    <Layout>
      <Hero img={heroImg} mobileHeroImg={mobileHeroImg} />
      <main>
        <div className={styles['qq-group']}>
          <div className={styles['qq-group__card']}>
            <img src={qqGroupImg} alt='' />
            <div className={styles['qq-group__text']}>
              大赛官方QQ群
              <br />
              {qqGroupId}
            </div>
          </div>
        </div>
        <article className='container container--fluid margin-vert--lg'>
          {children}
        </article>
      </main>
    </Layout>
  )
}

function Hero({ img, mobileHeroImg }: HeroProps) {
  return (
    <div className={styles['hero']}>
      <img className={styles['hero-img']} src={img} alt='' />
      <img className={styles['mobile-hero-img']} src={mobileHeroImg} alt='' />
    </div>
  )
}

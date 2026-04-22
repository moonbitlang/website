import Layout from '@theme/Layout'
import styles from './styles.module.css'
import type { CSSProperties } from 'react'

type HeroProps = {
  img: string
  mobileHeroImg: string
  bgColor?: string
  backdropImg?: string
}

type LayoutProps = {
  heroImg: string
  mobileHeroImg: string
  qqGroupImg?: string
  qqGroupId?: string
  heroBgColor?: string
  heroBackdropImg?: string
  children: React.ReactNode
}

export default function ContestLayout(props: LayoutProps) {
  const {
    heroImg,
    mobileHeroImg,
    children,
    qqGroupId,
    qqGroupImg,
    heroBgColor,
    heroBackdropImg
  } = props
  return (
    <Layout>
      <Hero
        img={heroImg}
        mobileHeroImg={mobileHeroImg}
        bgColor={heroBgColor}
        backdropImg={heroBackdropImg}
      />
      <main>
        {qqGroupImg && (
          <div className={styles['qq-group']}>
            <div className={styles['qq-group__card']}>
              <img src={qqGroupImg} alt='' />
              <div className={styles['qq-group__text']}>
                大赛官方QQ群
                {qqGroupId && <><br />{qqGroupId}</>}
              </div>
            </div>
          </div>
        )}
        <article className='container container--fluid margin-vert--lg'>
          {children}
        </article>
      </main>
    </Layout>
  )
}

function Hero({ img, mobileHeroImg, bgColor, backdropImg }: HeroProps) {
  const style: CSSProperties & Record<'--hero-bg-image' | '--hero-bg-color', string> = {
    '--hero-bg-color': bgColor || 'black',
    '--hero-bg-image': backdropImg ? `url(${backdropImg})` : 'none'
  }

  return (
    <div className={styles['hero']} style={style}>
      <img className={styles['hero-img']} src={img} alt='' />
      <img className={styles['mobile-hero-img']} src={mobileHeroImg} alt='' />
    </div>
  )
}

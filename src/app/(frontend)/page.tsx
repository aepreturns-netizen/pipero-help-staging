import type { Metadata } from 'next'
import Link from 'next/link'
import { cache } from 'react'
import { getPayload } from 'payload'

import config from '@/payload.config'
import type { Article } from '@/payload-types'

import './styles.css'

export const dynamic = 'force-dynamic'

type HomePageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

const getPayloadClient = cache(async () => {
  return getPayload({ config })
})

const getHelpCenterSettings = cache(async () => {
  const payload = await getPayloadClient()

  return payload.findGlobal({
    slug: 'help-center-settings',
  })
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getHelpCenterSettings()

  return {
    title: settings.defaultSeoTitle || 'Pipero Help Center',
    description:
      settings.defaultSeoDescription ||
      'Panduan penggunaan Pipero untuk membantu bisnis Anda.',
  }
}

function getCategoryId(category: Article['category']) {
  if (typeof category === 'object' && category !== null) {
    return String(category.id)
  }

  return String(category)
}

export default async function HomePage({
  searchParams,
}: HomePageProps) {
  const { q = '' } = await searchParams
  const query = q.trim()

  const payload = await getPayloadClient()

  const [settings, categoriesResult, articlesResult] = await Promise.all([
    getHelpCenterSettings(),

    payload.find({
      collection: 'categories',
      where: {
        isActive: {
          equals: true,
        },
      },
      sort: 'order',
      limit: 100,
    }),

    payload.find({
      collection: 'articles',
      depth: 1,
      where: query
        ? {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              {
                or: [
                  {
                    title: {
                      contains: query,
                    },
                  },
                  {
                    summary: {
                      contains: query,
                    },
                  },
                  {
                    searchKeywords: {
                      contains: query,
                    },
                  },
                ],
              },
            ],
          }
        : {
            _status: {
              equals: 'published',
            },
          },
      sort: 'order',
      limit: 100,
    }),
  ])

  const articlesByCategory = new Map<string, Article[]>()

  for (const article of articlesResult.docs) {
    const categoryId = getCategoryId(article.category)
    const currentArticles = articlesByCategory.get(categoryId) || []

    currentArticles.push(article)
    articlesByCategory.set(categoryId, currentArticles)
  }

  const popularArticles = articlesResult.docs
    .filter((article) => article.featured)
    .slice(0, 4)

  const displayedPopularArticles =
    popularArticles.length > 0
      ? popularArticles
      : articlesResult.docs.slice(0, 4)

  const supportNumber =
    settings.supportWhatsApp || '6287877898277'

  const supportLabel =
    settings.supportButtonLabel || 'Tanya Support'

  const supportMessage = encodeURIComponent(
    'Halo Pipero, saya membutuhkan bantuan mengenai penggunaan Pipero.',
  )

  return (
    <main className="help-center">
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">P</span>

            <span className="brand-copy">
              <strong>Pipero</strong>
              <small>Help Center</small>
            </span>
          </Link>

          <a
            className="support-button"
            href={`https://wa.me/${supportNumber}?text=${supportMessage}`}
            target="_blank"
            rel="noreferrer"
          >
            <span aria-hidden="true">💬</span>
            {supportLabel}
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-content">
          <span className="eyebrow">PIPERO HELP CENTER</span>

          <h1>Apa yang bisa kami bantu?</h1>

          <p>
            Temukan panduan, penjelasan fitur, dan solusi untuk membantu
            Anda menggunakan Pipero dengan lebih maksimal.
          </p>

          <form className="search-form" role="search" method="get">
            <label className="sr-only" htmlFor="help-search">
              Cari artikel bantuan
            </label>

            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>

            <input
              id="help-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder={
                settings.searchPlaceholder ||
                'Cari solusi, fitur, atau topik...'
              }
            />

            <button type="submit">Cari</button>
          </form>
        </div>
      </section>

      <div className="container content-wrapper">
        {query ? (
          <section className="search-results">
            <div className="section-heading">
              <div>
                <span className="section-kicker">HASIL PENCARIAN</span>
                <h2>Hasil untuk “{query}”</h2>
              </div>

              <Link href="/" className="clear-search">
                Hapus pencarian
              </Link>
            </div>

            {articlesResult.docs.length > 0 ? (
              <div className="article-grid">
                {articlesResult.docs.map((article) => (
                  <Link
                    href={`/artikel/${article.slug}`}
                    className="article-card"
                    key={article.id}
                  >
                    <span className="article-icon">↗</span>

                    <div>
                      <h3>{article.title}</h3>
                      <p>{article.summary}</p>

                      <small>
                        {article.estimatedReadMinutes || 3} menit baca
                      </small>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span>🔎</span>
                <h3>Artikel belum ditemukan</h3>
                <p>
                  Coba gunakan kata kunci yang lebih singkat atau tanyakan
                  langsung kepada tim support.
                </p>
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="categories-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">
                    JELAJAHI BERDASARKAN TOPIK
                  </span>
                  <h2>Kategori bantuan</h2>
                </div>
              </div>

              <div className="category-grid">
                {categoriesResult.docs.map((category) => {
                  const categoryArticles =
                    articlesByCategory.get(String(category.id)) || []

                  return (
                    <a
                      className="category-card"
                      href={`#${category.slug}`}
                      key={category.id}
                    >
                      <span className="category-icon">
                        {category.icon || '📘'}
                      </span>

                      <div>
                        <h3>{category.name}</h3>
                        <p>
                          {category.description ||
                            'Panduan dan penjelasan mengenai Pipero.'}
                        </p>

                        <small>
                          {categoryArticles.length} artikel
                        </small>
                      </div>

                      <span className="category-arrow">→</span>
                    </a>
                  )
                })}
              </div>
            </section>

            {displayedPopularArticles.length > 0 && (
              <section className="popular-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">
                      PANDUAN PILIHAN
                    </span>
                    <h2>Artikel yang dapat Anda mulai baca</h2>
                  </div>
                </div>

                <div className="article-grid">
                  {displayedPopularArticles.map((article) => (
                    <Link
                      href={`/artikel/${article.slug}`}
                      className="article-card"
                      key={article.id}
                    >
                      <span className="article-icon">↗</span>

                      <div>
                        <h3>{article.title}</h3>
                        <p>{article.summary}</p>

                        <small>
                          {article.estimatedReadMinutes || 3} menit baca
                        </small>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="category-articles">
              {categoriesResult.docs.map((category) => {
                const categoryArticles =
                  articlesByCategory.get(String(category.id)) || []

                if (categoryArticles.length === 0) {
                  return null
                }

                return (
                  <div
                    className="category-article-group"
                    id={category.slug}
                    key={category.id}
                  >
                    <div className="category-group-heading">
                      <span>{category.icon || '📘'}</span>

                      <div>
                        <h2>{category.name}</h2>
                        <p>
                          {category.description ||
                            'Panduan penggunaan Pipero.'}
                        </p>
                      </div>
                    </div>

                    <div className="article-list">
                      {categoryArticles.map((article) => (
                        <Link
                          href={`/artikel/${article.slug}`}
                          className="article-list-item"
                          key={article.id}
                        >
                          <div>
                            <h3>{article.title}</h3>
                            <p>{article.summary}</p>
                          </div>

                          <span>→</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </section>
          </>
        )}
      </div>

      <section className="support-cta">
        <div className="container support-cta-inner">
          <div>
            <span className="section-kicker">
              MASIH MEMBUTUHKAN BANTUAN?
            </span>

            <h2>Tim Pipero siap membantu Anda</h2>

            <p>
              Hubungi support untuk mendapatkan bantuan mengenai
              penggunaan dan pengaturan Pipero.
            </p>
          </div>

          <a
            className="support-button support-button-large"
            href={`https://wa.me/${supportNumber}?text=${supportMessage}`}
            target="_blank"
            rel="noreferrer"
          >
            <span aria-hidden="true">💬</span>
            {supportLabel}
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>© {new Date().getFullYear()} Pipero. Karyawan AI yang bisa kerja.</p>

          <Link href="/admin">Admin Login</Link>
        </div>
      </footer>
    </main>
  )
}
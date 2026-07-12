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

type UnknownRecord = Record<string, unknown>

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

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function getCategoryId(category: Article['category']) {
  if (typeof category === 'object' && category !== null) {
    return String(category.id)
  }

  return String(category)
}

/**
 * Mengambil seluruh teks dari data Rich Text Lexical.
 */
function extractLexicalText(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => extractLexicalText(item))
      .filter(Boolean)
      .join(' ')
  }

  if (!isRecord(value)) {
    return ''
  }

  const textParts: string[] = []

  if (typeof value.text === 'string') {
    textParts.push(value.text)
  }

  if (Array.isArray(value.children)) {
    textParts.push(extractLexicalText(value.children))
  }

  if (isRecord(value.root)) {
    textParts.push(extractLexicalText(value.root))
  }

  return textParts.filter(Boolean).join(' ')
}

/**
 * Mengambil teks yang dapat dicari dari setiap jenis blok artikel.
 */
function extractBlockText(block: unknown): string {
  if (!isRecord(block)) {
    return ''
  }

  const blockType = getString(block.blockType)
  const textParts: string[] = []

  if (blockType === 'richText') {
    textParts.push(extractLexicalText(block.content))
  }

  if (blockType === 'callout') {
    textParts.push(getString(block.title))
    textParts.push(extractLexicalText(block.content))
  }

  if (blockType === 'steps') {
    textParts.push(getString(block.heading))

    if (Array.isArray(block.steps)) {
      for (const step of block.steps) {
        if (!isRecord(step)) {
          continue
        }

        textParts.push(getString(step.title))
        textParts.push(getString(step.description))
      }
    }
  }

  if (blockType === 'articleImage') {
    textParts.push(getString(block.caption))
    textParts.push(getString(block.altOverride))

    if (isRecord(block.image)) {
      textParts.push(getString(block.image.alt))
      textParts.push(getString(block.image.filename))
    }
  }

  if (blockType === 'youtubeVideo') {
    textParts.push(getString(block.title))
    textParts.push(getString(block.description))
  }

  if (blockType === 'faq') {
    textParts.push(getString(block.heading))

    if (Array.isArray(block.items)) {
      for (const item of block.items) {
        if (!isRecord(item)) {
          continue
        }

        textParts.push(getString(item.question))
        textParts.push(extractLexicalText(item.answer))
      }
    }
  }

  return textParts.filter(Boolean).join(' ')
}

/**
 * Menggabungkan semua informasi artikel menjadi satu teks pencarian.
 */
function getArticleSearchText(article: Article): string {
  const textParts: string[] = [
    article.title,
    article.summary,
    article.searchKeywords || '',
  ]

  if (
    typeof article.category === 'object' &&
    article.category !== null
  ) {
    textParts.push(article.category.name || '')
    textParts.push(article.category.description || '')
  }

  if (Array.isArray(article.tags)) {
    for (const tag of article.tags) {
      textParts.push(tag.label || '')
    }
  }

  if (Array.isArray(article.body)) {
    for (const block of article.body) {
      textParts.push(extractBlockText(block))
    }
  }

  return textParts.filter(Boolean).join(' ')
}

/**
 * Menyamakan format teks supaya pencarian tidak sensitif terhadap:
 * - huruf besar dan kecil
 * - tanda baca
 * - tanda hubung
 * - spasi berlebihan
 */
function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Menentukan apakah artikel sesuai dengan kata pencarian.
 *
 * Contoh:
 * - "follow-up" dapat ditemukan dengan "follow up"
 * - "voice notes" dapat menemukan teks "voice note"
 */
function articleMatchesQuery(
  article: Article,
  query: string,
): boolean {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return true
  }

  const searchableText = normalizeSearchText(
    getArticleSearchText(article),
  )

  if (searchableText.includes(normalizedQuery)) {
    return true
  }

  const queryWords = normalizedQuery
    .split(' ')
    .filter(Boolean)

  return queryWords.every((word) => {
    if (searchableText.includes(word)) {
      return true
    }

    /**
     * Membantu pencarian istilah bahasa Inggris sederhana.
     * Contoh: "notes" juga mencoba mencari "note".
     */
    if (word.length > 3 && word.endsWith('s')) {
      const singularWord = word.slice(0, -1)

      return searchableText.includes(singularWord)
    }

    return false
  })
}

export default async function HomePage({
  searchParams,
}: HomePageProps) {
  const { q = '' } = await searchParams
  const query = q.trim()

  const payload = await getPayloadClient()

  const [settings, categoriesResult, articlesResult] =
    await Promise.all([
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

      /**
       * Semua artikel published diambil terlebih dahulu.
       * Setelah itu pencarian dilakukan terhadap seluruh isi artikelnya.
       */
      payload.find({
        collection: 'articles',
        depth: 2,
        where: {
          _status: {
            equals: 'published',
          },
        },
        sort: 'order',
        limit: 100,
      }),
    ])

  const allPublishedArticles = articlesResult.docs

  const searchResults = query
    ? allPublishedArticles.filter((article) =>
        articleMatchesQuery(article, query),
      )
    : allPublishedArticles

  const articlesByCategory = new Map<string, Article[]>()

  for (const article of allPublishedArticles) {
    const categoryId = getCategoryId(article.category)
    const currentArticles =
      articlesByCategory.get(categoryId) || []

    currentArticles.push(article)
    articlesByCategory.set(categoryId, currentArticles)
  }

  const popularArticles = allPublishedArticles
    .filter((article) => article.featured)
    .slice(0, 4)

  const displayedPopularArticles =
    popularArticles.length > 0
      ? popularArticles
      : allPublishedArticles.slice(0, 4)

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
          <span className="eyebrow">
            PIPERO HELP CENTER
          </span>

          <h1>Apa yang bisa kami bantu?</h1>

          <p>
            Temukan panduan, penjelasan fitur, dan solusi
            untuk membantu Anda menggunakan Pipero dengan
            lebih maksimal.
          </p>

          <form
            className="search-form"
            role="search"
            method="get"
          >
            <label
              className="sr-only"
              htmlFor="help-search"
            >
              Cari artikel bantuan
            </label>

            <span
              className="search-icon"
              aria-hidden="true"
            >
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
                <span className="section-kicker">
                  HASIL PENCARIAN
                </span>

                <h2>Hasil untuk “{query}”</h2>
              </div>

              <Link
                href="/"
                className="clear-search"
              >
                Hapus pencarian
              </Link>
            </div>

            {searchResults.length > 0 ? (
              <div className="article-grid">
                {searchResults.map((article) => (
                  <Link
                    href={`/artikel/${article.slug}`}
                    className="article-card"
                    key={article.id}
                  >
                    <span className="article-icon">
                      ↗
                    </span>

                    <div>
                      <h3>{article.title}</h3>

                      <p>{article.summary}</p>

                      <small>
                        {article.estimatedReadMinutes ||
                          3}{' '}
                        menit baca
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
                  Coba gunakan kata kunci yang lebih
                  singkat atau tanyakan langsung kepada
                  tim support.
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
                {categoriesResult.docs.map(
                  (category) => {
                    const categoryArticles =
                      articlesByCategory.get(
                        String(category.id),
                      ) || []

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
                            {categoryArticles.length}{' '}
                            artikel
                          </small>
                        </div>

                        <span className="category-arrow">
                          →
                        </span>
                      </a>
                    )
                  },
                )}
              </div>
            </section>

            {displayedPopularArticles.length > 0 && (
              <section className="popular-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">
                      PANDUAN PILIHAN
                    </span>

                    <h2>
                      Artikel yang dapat Anda mulai baca
                    </h2>
                  </div>
                </div>

                <div className="article-grid">
                  {displayedPopularArticles.map(
                    (article) => (
                      <Link
                        href={`/artikel/${article.slug}`}
                        className="article-card"
                        key={article.id}
                      >
                        <span className="article-icon">
                          ↗
                        </span>

                        <div>
                          <h3>{article.title}</h3>

                          <p>{article.summary}</p>

                          <small>
                            {article.estimatedReadMinutes ||
                              3}{' '}
                            menit baca
                          </small>
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              </section>
            )}

            <section className="category-articles">
              {categoriesResult.docs.map(
                (category) => {
                  const categoryArticles =
                    articlesByCategory.get(
                      String(category.id),
                    ) || []

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
                        <span>
                          {category.icon || '📘'}
                        </span>

                        <div>
                          <h2>{category.name}</h2>

                          <p>
                            {category.description ||
                              'Panduan penggunaan Pipero.'}
                          </p>
                        </div>
                      </div>

                      <div className="article-list">
                        {categoryArticles.map(
                          (article) => (
                            <Link
                              href={`/artikel/${article.slug}`}
                              className="article-list-item"
                              key={article.id}
                            >
                              <div>
                                <h3>
                                  {article.title}
                                </h3>

                                <p>
                                  {article.summary}
                                </p>
                              </div>

                              <span>→</span>
                            </Link>
                          ),
                        )}
                      </div>
                    </div>
                  )
                },
              )}
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
              Hubungi support untuk mendapatkan bantuan
              mengenai penggunaan dan pengaturan Pipero.
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
          <p>
            © {new Date().getFullYear()} Pipero. Karyawan
            AI yang bisa kerja.
          </p>

          <Link href="/admin">Admin Login</Link>
        </div>
      </footer>
    </main>
  )
}
'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { ArticleRenderer } from './ArticleRenderer'
import type {
  HelpCenterArticle,
  HelpCenterCategory,
  HelpCenterShellSettings,
} from './help-center-types'

const PIPERO_LOGO_URL =
  'https://assets.cdn.filesafe.space/9pulV8ZpW1HI8LDNGYza/media/6a222805b7929406c15b399d.png'

const PIPERO_ROBOT_URL =
  'https://assets.cdn.filesafe.space/9pulV8ZpW1HI8LDNGYza/media/6a2e78c9fe75e68647a3c3a5.png'

type TocItem = {
  id: string
  label: string
  level: 2 | 3
}

type HelpCenterShellProps = {
  categories: HelpCenterCategory[]
  articles: HelpCenterArticle[]
  settings: HelpCenterShellSettings
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugifyHeading(value: string, index: number): string {
  const base = normalizeText(value).replace(/\s+/g, '-')
  return base ? `bagian-${base}-${index + 1}` : `bagian-${index + 1}`
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

export function HelpCenterShell({
  categories,
  articles,
  settings,
}: HelpCenterShellProps) {
  const articlesBySlug = useMemo(
    () => new Map(articles.map((article) => [article.slug, article])),
    [articles],
  )

  const articlesByCategory = useMemo(() => {
    const result = new Map<string, HelpCenterArticle[]>()

    for (const article of articles) {
      const current = result.get(article.categoryId) || []
      current.push(article)
      result.set(article.categoryId, current)
    }

    return result
  }, [articles])

  const getSlugFromLocation = useCallback(() => {
    if (typeof window === 'undefined') return settings.defaultArticleSlug

    try {
      const hashSlug = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      return articlesBySlug.has(hashSlug)
        ? hashSlug
        : settings.defaultArticleSlug
    } catch {
      return settings.defaultArticleSlug
    }
  }, [articlesBySlug, settings.defaultArticleSlug])

  const [activeSlug, setActiveSlug] = useState(settings.defaultArticleSlug)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarFilter, setSidebarFilter] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState('')

  const articleCardRef = useRef<HTMLElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeArticle =
    articlesBySlug.get(activeSlug) ||
    articlesBySlug.get(settings.defaultArticleSlug) ||
    articles[0]

  const searchResults = useMemo(() => {
    const query = normalizeText(searchQuery)
    if (!query) return []

    const words = query.split(' ').filter(Boolean)

    return articles
      .filter((article) => {
        const searchText = normalizeText(article.searchText)
        if (searchText.includes(query)) return true

        return words.every((word) => {
          if (searchText.includes(word)) return true
          return word.length > 3 && word.endsWith('s')
            ? searchText.includes(word.slice(0, -1))
            : false
        })
      })
      .slice(0, 8)
  }, [articles, searchQuery])

  const visibleCategories = useMemo(() => {
    const query = normalizeText(sidebarFilter)
    if (!query) return categories

    return categories.filter((category) => {
      const categoryMatches = normalizeText(
        `${category.name} ${category.description}`,
      ).includes(query)

      const articleMatches = (articlesByCategory.get(category.id) || []).some(
        (article) => normalizeText(article.searchText).includes(query),
      )

      return categoryMatches || articleMatches
    })
  }, [articlesByCategory, categories, sidebarFilter])

  const relatedArticles = useMemo(() => {
    if (!activeArticle) return []

    const explicitlyRelated = activeArticle.relatedSlugs
      .map((slug) => articlesBySlug.get(slug))
      .filter((article): article is HelpCenterArticle => Boolean(article))
      .filter((article) => article.slug !== activeArticle.slug)

    if (explicitlyRelated.length > 0) return explicitlyRelated.slice(0, 4)

    return articles
      .filter(
        (article) =>
          article.slug !== activeArticle.slug &&
          article.categoryId === activeArticle.categoryId,
      )
      .slice(0, 4)
  }, [activeArticle, articles, articlesBySlug])

  const supportMessage = encodeURIComponent(
    activeArticle
      ? `Halo Pipero, saya membutuhkan bantuan mengenai artikel "${activeArticle.title}".`
      : 'Halo Pipero, saya membutuhkan bantuan mengenai penggunaan Pipero.',
  )

  const supportUrl = `https://wa.me/${settings.supportNumber}?text=${supportMessage}`

  const showToast = useCallback((message: string) => {
    setToast(message)

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 2400)
  }, [])

  const selectArticle = useCallback(
    (slug: string, options?: { replace?: boolean; scroll?: boolean }) => {
      if (!articlesBySlug.has(slug)) return

      setActiveSlug(slug)
      setSearchOpen(false)
      setSearchQuery('')
      setSidebarOpen(false)

      if (typeof window !== 'undefined') {
        const nextUrl = `#${encodeURIComponent(slug)}`
        if (options?.replace) {
          window.history.replaceState({ slug }, '', nextUrl)
        } else if (window.location.hash !== nextUrl) {
          window.history.pushState({ slug }, '', nextUrl)
        }
      }

      if (options?.scroll !== false) {
        window.requestAnimationFrame(() => {
          articleCardRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        })
      }
    },
    [articlesBySlug],
  )

  useEffect(() => {
    const rawHash = window.location.hash.replace(/^#/, '')
    const initialSlug = getSlugFromLocation()
    const initialFrame = window.requestAnimationFrame(() => {
      setActiveSlug(initialSlug)
    })

    let decodedHash = ''
    try {
      decodedHash = decodeURIComponent(rawHash)
    } catch {
      decodedHash = ''
    }

    if (!decodedHash || !articlesBySlug.has(decodedHash)) {
      window.history.replaceState(
        { slug: initialSlug },
        '',
        `#${encodeURIComponent(initialSlug)}`,
      )
    }

    const syncFromLocation = () => {
      setActiveSlug(getSlugFromLocation())
      setSidebarOpen(false)
    }

    window.addEventListener('hashchange', syncFromLocation)
    window.addEventListener('popstate', syncFromLocation)

    return () => {
      window.cancelAnimationFrame(initialFrame)
      window.removeEventListener('hashchange', syncFromLocation)
      window.removeEventListener('popstate', syncFromLocation)
    }
  }, [articlesBySlug, getSlugFromLocation])

  useEffect(() => {
    if (!activeArticle) return

    document.title = `${activeArticle.title} | Pipero Help Center`

    let savedSlugs: string[] = []
    try {
      savedSlugs = JSON.parse(
        window.localStorage.getItem('piperoHelpSavedArticles') || '[]',
      ) as string[]
    } catch {
      savedSlugs = []
    }
    const savedFrame = window.requestAnimationFrame(() => {
      setSaved(savedSlugs.includes(activeArticle.slug))
    })

    const articleElement = articleCardRef.current
    if (!articleElement) {
      return () => window.cancelAnimationFrame(savedFrame)
    }

    const headings = Array.from(
      articleElement.querySelectorAll<HTMLElement>(
        '.unified-article-body h2, .unified-article-body h3',
      ),
    )

    const nextToc = headings.map((heading, index) => {
      const id = slugifyHeading(heading.textContent || '', index)
      heading.id = id
      heading.style.scrollMarginTop = '190px'

      return {
        id,
        label: heading.textContent || `Bagian ${index + 1}`,
        level: heading.tagName === 'H3' ? 3 : 2,
      } satisfies TocItem
    })

    const tocFrame = window.requestAnimationFrame(() => {
      setTocItems(nextToc)
    })

    return () => {
      window.cancelAnimationFrame(savedFrame)
      window.cancelAnimationFrame(tocFrame)
    }
  }, [activeArticle])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }

      if (event.key === 'Escape') {
        setSearchOpen(false)
        setSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('unified-sidebar-open', sidebarOpen)
    return () => document.documentElement.classList.remove('unified-sidebar-open')
  }, [sidebarOpen])

  if (!activeArticle) {
    return (
      <main className="help-center unified-help">
        <div className="unified-empty">Belum ada artikel yang dipublikasikan.</div>
      </main>
    )
  }

  const toggleSaved = () => {
    let storedSlugs: string[] = []
    try {
      storedSlugs = JSON.parse(
        window.localStorage.getItem('piperoHelpSavedArticles') || '[]',
      ) as string[]
    } catch {
      storedSlugs = []
    }

    const savedSlugs = new Set<string>(storedSlugs)

    if (savedSlugs.has(activeArticle.slug)) {
      savedSlugs.delete(activeArticle.slug)
      setSaved(false)
      showToast('Artikel dihapus dari daftar tersimpan.')
    } else {
      savedSlugs.add(activeArticle.slug)
      setSaved(true)
      showToast('Artikel disimpan di browser ini.')
    }

    window.localStorage.setItem(
      'piperoHelpSavedArticles',
      JSON.stringify(Array.from(savedSlugs)),
    )
  }

  const shareArticle = async () => {
    const shareData = {
      title: activeArticle.title,
      text: activeArticle.summary,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        showToast('Link artikel berhasil disalin.')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      showToast('Link belum dapat dibagikan.')
    }
  }

  const selectFirstArticleInCategory = (categoryName: string) => {
    const category = categories.find((item) =>
      normalizeText(item.name).includes(normalizeText(categoryName)),
    )
    const firstArticle = category
      ? articlesByCategory.get(category.id)?.[0]
      : undefined

    selectArticle(firstArticle?.slug || settings.defaultArticleSlug)
  }

  return (
    <main className="help-center unified-help">
      <header className="site-header unified-header">
        <div className="unified-container header-inner">
          <Link href={`/#${settings.defaultArticleSlug}`} className="brand brand-logo">
            <img className="brand-logo-image" src={PIPERO_LOGO_URL} alt="Pipero" />
          </Link>

          <nav className="header-nav" aria-label="Navigasi Help Center">
            <button type="button" onClick={() => selectArticle(settings.defaultArticleSlug)}>
              Mulai dari Sini
            </button>
            <button type="button" className="is-active" onClick={() => selectArticle(activeArticle.slug, { scroll: false })}>
              Panduan
            </button>
            <button type="button" onClick={() => selectFirstArticleInCategory('troubleshooting')}>
              Troubleshooting
            </button>
            <a href={supportUrl} target="_blank" rel="noreferrer">
              WhatsApp Support
            </a>
          </nav>

          <div className="header-actions">
            <a className="support-button" href={supportUrl} target="_blank" rel="noreferrer">
              {settings.supportLabel}
            </a>

            <button
              type="button"
              className="unified-mobile-menu-button"
              aria-label="Buka daftar artikel"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <section className="unified-search-strip">
        <div className="unified-container unified-search-inner">
          <div className="unified-search-wrap" ref={searchWrapRef}>
            <label className="unified-search-box" htmlFor="unified-help-search">
              <span aria-hidden="true">⌕</span>
              <input
                id="unified-help-search"
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                placeholder={settings.searchPlaceholder}
                autoComplete="off"
                onFocus={() => setSearchOpen(Boolean(searchQuery.trim()))}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setSearchOpen(Boolean(event.target.value.trim()))
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setSearchOpen(false)
                  if (event.key === 'Enter' && searchResults[0]) {
                    event.preventDefault()
                    selectArticle(searchResults[0].slug)
                  }
                }}
              />
              <kbd>Ctrl + K</kbd>
            </label>

            {searchOpen ? (
              <div className="unified-search-results" role="listbox">
                {searchResults.length > 0 ? (
                  searchResults.map((article) => (
                    <button
                      type="button"
                      key={article.id}
                      onClick={() => selectArticle(article.slug)}
                    >
                      <strong>{article.title}</strong>
                      <span>{article.categoryName} · {article.summary}</span>
                    </button>
                  ))
                ) : (
                  <div className="unified-search-empty">
                    Belum ada artikel yang cocok untuk “{searchQuery}”.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <img className="unified-search-robot" src={PIPERO_ROBOT_URL} alt="" aria-hidden="true" />
        </div>
      </section>

      <button
        type="button"
        className={`unified-sidebar-overlay${sidebarOpen ? ' is-visible' : ''}`}
        aria-label="Tutup daftar artikel"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="unified-container unified-doc-layout">
        <aside className={`unified-sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label="Daftar artikel bantuan">
          <div className="unified-sidebar-head">
            <strong>Panduan Pipero</strong>
            <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Tutup daftar artikel">×</button>
          </div>

          <div className="unified-sidebar-filter">
            <input
              type="search"
              value={sidebarFilter}
              placeholder="Filter artikel..."
              onChange={(event) => setSidebarFilter(event.target.value)}
            />
          </div>

          <div className="unified-category-list">
            {visibleCategories.map((category) => {
              const categoryArticles = (articlesByCategory.get(category.id) || []).filter((article) => {
                const query = normalizeText(sidebarFilter)
                return !query || normalizeText(article.searchText).includes(query)
              })

              if (categoryArticles.length === 0) return null

              return (
                <details className="unified-category" open key={category.id}>
                  <summary>
                    <span aria-hidden="true">{category.icon}</span>
                    {category.name}
                  </summary>
                  <div className="unified-article-links">
                    {categoryArticles.map((article) => (
                      <button
                        type="button"
                        key={article.id}
                        className={article.slug === activeArticle.slug ? 'is-active' : ''}
                        aria-current={article.slug === activeArticle.slug ? 'page' : undefined}
                        onClick={() => selectArticle(article.slug)}
                      >
                        {article.title}
                      </button>
                    ))}
                  </div>
                </details>
              )
            })}
          </div>

          <div className="unified-help-card">
            <img src={PIPERO_ROBOT_URL} alt="Robot Pipero" />
            <div>
              <h4>Butuh bantuan cepat?</h4>
              <p>Chat dengan Pipero melalui WhatsApp.</p>
              <a href={supportUrl} target="_blank" rel="noreferrer">Chat via WhatsApp</a>
            </div>
          </div>
        </aside>

        <article className="unified-article-card" ref={articleCardRef} aria-live="polite">
          <nav className="unified-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={() => selectArticle(settings.defaultArticleSlug)}>⌂</button>
            <span>›</span>
            <span>Panduan</span>
            <span>›</span>
            <span>{activeArticle.categoryName}</span>
            <span>›</span>
            <strong>{activeArticle.title}</strong>
          </nav>

          <header className="unified-article-header">
            <div>
              <h1>{activeArticle.title}</h1>
              <p>{activeArticle.summary}</p>
              <div className="unified-article-meta">
                <span>▣ Diperbarui {formatDate(activeArticle.updatedAt)}</span>
                <span>•</span>
                <span>◷ {activeArticle.estimatedReadMinutes} menit baca</span>
              </div>
            </div>

            <div className="unified-article-actions">
              <button type="button" className={saved ? 'is-saved' : ''} onClick={toggleSaved} aria-label="Simpan artikel">
                {saved ? '♥' : '♡'}
              </button>
              <button type="button" onClick={shareArticle} aria-label="Bagikan artikel">↗</button>
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Kembali ke atas">↑</button>
            </div>
          </header>

          <ArticleRenderer article={activeArticle} />

          {relatedArticles.length > 0 ? (
            <section className="article-related unified-related" aria-labelledby="unified-related-title">
              <div className="article-related-heading">
                <span className="section-kicker">ARTIKEL TERKAIT</span>
                <h2 id="unified-related-title">Lanjutkan membaca</h2>
                <p>Pelajari panduan lain yang masih berkaitan dengan artikel ini.</p>
              </div>

              <div className="article-related-grid">
                {relatedArticles.map((article) => (
                  <button
                    type="button"
                    className="article-related-card"
                    key={article.id}
                    onClick={() => selectArticle(article.slug)}
                  >
                    <span className="article-related-icon" aria-hidden="true">↗</span>
                    <span className="article-related-copy">
                      <h3>{article.title}</h3>
                      <p>{article.summary}</p>
                      <span className="article-related-meta">{article.estimatedReadMinutes} menit baca</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="unified-rightbar" aria-label="Informasi artikel">
          <section className="unified-right-card">
            <h3>Dalam Artikel Ini</h3>
            <div className="unified-toc">
              {tocItems.length > 0 ? (
                tocItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={item.level === 3 ? 'is-subheading' : ''}
                    onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    {item.label}
                  </button>
                ))
              ) : (
                <span className="unified-muted">Tidak ada daftar isi.</span>
              )}
            </div>
          </section>

          <section className="unified-right-card">
            <h3>Topik Terkait</h3>
            <div className="unified-related-list">
              {relatedArticles.length > 0 ? (
                relatedArticles.map((article) => (
                  <button type="button" key={article.id} onClick={() => selectArticle(article.slug)}>
                    ▧ {article.title}
                  </button>
                ))
              ) : (
                <span className="unified-muted">Belum ada topik terkait.</span>
              )}
            </div>
          </section>

          <section className="unified-right-card">
            <h3>Tag</h3>
            <div className="unified-tags">
              {activeArticle.tags.length > 0 ? (
                activeArticle.tags.map((tag) => <span key={tag}>{tag}</span>)
              ) : (
                <span className="unified-muted">Belum ada tag.</span>
              )}
            </div>
          </section>
        </aside>
      </div>

      <a className="floating-support unified-floating-support" href={supportUrl} target="_blank" rel="noreferrer" aria-label="Chat dengan Pipero melalui WhatsApp">
        <img src={PIPERO_ROBOT_URL} alt="" />
        <span aria-hidden="true" />
      </a>

      <section className="support-cta unified-support-cta">
        <div className="unified-container support-cta-inner">
          <div>
            <span className="section-kicker">MASIH MEMBUTUHKAN BANTUAN?</span>
            <h2>Tim Pipero siap membantu Anda</h2>
            <p>Hubungi support untuk mendapatkan bantuan mengenai penggunaan dan pengaturan Pipero.</p>
          </div>
          <a className="support-button support-button-large" href={supportUrl} target="_blank" rel="noreferrer">
            <span aria-hidden="true">💬</span>
            {settings.supportLabel}
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="unified-container footer-inner">
          <p>© {new Date().getFullYear()} Pipero. Karyawan AI yang bisa kerja.</p>
          <Link href="/admin">Admin Login</Link>
        </div>
      </footer>

      <div className={`unified-toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </main>
  )
}

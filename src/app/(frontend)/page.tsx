import type { Metadata } from 'next'
import { cache } from 'react'
import { getPayload } from 'payload'

import config from '@/payload.config'
import type { Article, Category } from '@/payload-types'

import { HelpCenterShell } from './HelpCenterShell'
import type {
  HelpCenterArticle,
  HelpCenterCategory,
} from './help-center-types'
import './styles.css'

export const dynamic = 'force-dynamic'

type UnknownRecord = Record<string, unknown>

const getPayloadClient = cache(async () => getPayload({ config }))

const getHelpCenterSettings = cache(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'help-center-settings' })
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

function extractLexicalText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(extractLexicalText).filter(Boolean).join(' ')
  }

  if (!isRecord(value)) return ''

  const parts: string[] = []
  if (typeof value.text === 'string') parts.push(value.text)
  if (Array.isArray(value.children)) parts.push(extractLexicalText(value.children))
  if (isRecord(value.root)) parts.push(extractLexicalText(value.root))

  return parts.filter(Boolean).join(' ')
}

function extractBlockText(block: unknown): string {
  if (!isRecord(block)) return ''

  const blockType = getString(block.blockType)
  const parts: string[] = []

  if (blockType === 'richText') parts.push(extractLexicalText(block.content))

  if (blockType === 'callout') {
    parts.push(getString(block.title), extractLexicalText(block.content))
  }

  if (blockType === 'steps') {
    parts.push(getString(block.heading))
    if (Array.isArray(block.steps)) {
      for (const step of block.steps) {
        if (!isRecord(step)) continue
        parts.push(getString(step.title), getString(step.description))
      }
    }
  }

  if (blockType === 'articleImage') {
    parts.push(getString(block.caption), getString(block.altOverride))
    if (isRecord(block.image)) {
      parts.push(getString(block.image.alt), getString(block.image.filename))
    }
  }

  if (blockType === 'youtubeVideo') {
    parts.push(getString(block.title), getString(block.description))
  }

  if (blockType === 'faq') {
    parts.push(getString(block.heading))
    if (Array.isArray(block.items)) {
      for (const item of block.items) {
        if (!isRecord(item)) continue
        parts.push(getString(item.question), extractLexicalText(item.answer))
      }
    }
  }

  return parts.filter(Boolean).join(' ')
}

function getArticleSearchText(article: Article, categoryName: string): string {
  const parts = [
    article.title,
    article.summary,
    article.searchKeywords || '',
    categoryName,
    ...(article.tags || []).map((tag) => tag.label),
    ...article.body.map(extractBlockText),
  ]

  return parts.filter(Boolean).join(' ')
}

function getCategoryId(category: Article['category']): string {
  return typeof category === 'object' && category !== null
    ? String(category.id)
    : String(category)
}

function getCategoryFromArticle(
  article: Article,
  categoryMap: Map<string, Category>,
): Category | null {
  if (typeof article.category === 'object' && article.category !== null) {
    return article.category
  }

  return categoryMap.get(String(article.category)) || null
}

export default async function HomePage() {
  const payload = await getPayloadClient()

  const [settings, categoriesResult, articlesResult] = await Promise.all([
    getHelpCenterSettings(),
    payload.find({
      collection: 'categories',
      where: { isActive: { equals: true } },
      sort: 'order',
      limit: 100,
    }),
    payload.find({
      collection: 'articles',
      depth: 2,
      where: { _status: { equals: 'published' } },
      sort: 'order',
      limit: 100,
    }),
  ])

  const categories: HelpCenterCategory[] = categoriesResult.docs.map(
    (category) => ({
      id: String(category.id),
      name: category.name,
      slug: category.slug,
      description:
        category.description || 'Panduan dan penjelasan mengenai Pipero.',
      icon: category.icon || '📘',
    }),
  )

  const categoryMap = new Map<string, Category>(
    categoriesResult.docs.map((category) => [String(category.id), category]),
  )

  const articleById = new Map<string, Article>(
    articlesResult.docs.map((article) => [String(article.id), article]),
  )

  const articles: HelpCenterArticle[] = articlesResult.docs.map((article) => {
    const category = getCategoryFromArticle(article, categoryMap)

    const relatedSlugs = (article.relatedArticles || [])
      .map((related) => {
        if (typeof related === 'object' && related !== null) {
          return related.slug
        }

        return articleById.get(String(related))?.slug || ''
      })
      .filter(Boolean)

    const categoryId = getCategoryId(article.category)
    const categoryName = category?.name || 'Panduan'

    return {
      id: String(article.id),
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      categoryId,
      categoryName,
      categorySlug: category?.slug || 'panduan',
      body: article.body,
      tags: (article.tags || []).map((tag) => tag.label),
      relatedSlugs,
      searchText: getArticleSearchText(article, categoryName),
      estimatedReadMinutes: article.estimatedReadMinutes || 3,
      updatedAt: article.updatedAt,
      createdAt: article.createdAt,
      featured: Boolean(article.featured),
    }
  })

  const preferredDefault =
    articles.find((article) => article.slug === 'selamat-datang-di-pipero') ||
    articles.find((article) => article.featured) ||
    articles[0]

  return (
    <HelpCenterShell
      categories={categories}
      articles={articles}
      settings={{
        supportNumber: settings.supportWhatsApp || '6287877898277',
        supportLabel: settings.supportButtonLabel || 'Tanya Support',
        searchPlaceholder:
          settings.searchPlaceholder || 'Cari solusi, fitur, atau topik...',
        defaultArticleSlug: preferredDefault?.slug || '',
      }}
    />
  )
}

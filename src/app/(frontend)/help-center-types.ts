import type { Article } from '@/payload-types'

export type HelpCenterCategory = {
  id: string
  name: string
  slug: string
  description: string
  icon: string
}

export type HelpCenterArticle = {
  id: string
  title: string
  slug: string
  summary: string
  categoryId: string
  categoryName: string
  categorySlug: string
  body: Article['body']
  tags: string[]
  relatedSlugs: string[]
  searchText: string
  estimatedReadMinutes: number
  updatedAt: string
  createdAt: string
  featured: boolean
}

export type HelpCenterShellSettings = {
  supportNumber: string
  supportLabel: string
  searchPlaceholder: string
  defaultArticleSlug: string
}

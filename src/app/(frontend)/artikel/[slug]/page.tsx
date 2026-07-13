import type { Metadata } from 'next'
import { cache } from 'react'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'

export const dynamic = 'force-dynamic'

type ArticlePageProps = {
  params: Promise<{ slug: string }>
}

const getPayloadClient = cache(async () => getPayload({ config }))

const getArticle = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'articles',
    depth: 1,
    limit: 1,
    where: {
      and: [
        { slug: { equals: slug } },
        { _status: { equals: 'published' } },
      ],
    },
  })

  return result.docs[0] || null
})

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return { title: 'Artikel Tidak Ditemukan | Pipero Help Center' }
  }

  return {
    title: article.seo?.title || `${article.title} | Pipero Help Center`,
    description: article.seo?.description || article.summary,
    robots: article.seo?.noIndex
      ? { index: false, follow: false }
      : undefined,
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  redirect(`/#${encodeURIComponent(slug)}`)
}

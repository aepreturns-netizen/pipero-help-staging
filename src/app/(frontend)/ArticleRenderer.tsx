import { Fragment, type ReactNode } from 'react'

import type { HelpCenterArticle } from './help-center-types'

type LexicalNode = {
  type?: string
  text?: string
  format?: number
  tag?: string
  children?: LexicalNode[]
  fields?: {
    url?: string
    newTab?: boolean
  }
}

type RichTextValue = {
  root?: {
    children?: LexicalNode[]
  }
}

type ArticleMedia = {
  id?: number | string
  url?: string | null
  alt?: string | null
  filename?: string | null
  width?: number | null
  height?: number | null
}

type ArticleBodyBlock = {
  blockType?: string
  content?: unknown
  style?: 'info' | 'tip' | 'warning' | 'success'
  title?: string | null
  heading?: string | null
  steps?: Array<{
    title?: string | null
    description?: string | null
  }>
  image?: number | string | ArticleMedia
  caption?: string | null
  altOverride?: string | null
  width?: 'full' | 'medium' | null
  url?: string | null
  description?: string | null
  items?: Array<{
    question?: string | null
    answer?: unknown
  }>
}

function renderChildren(
  children: LexicalNode[] | undefined,
  parentKey: string,
): ReactNode {
  return children?.map((child, index) =>
    renderLexicalNode(child, `${parentKey}-${index}`),
  )
}

function renderText(node: LexicalNode, key: string): ReactNode {
  let content: ReactNode = node.text || ''
  const format = node.format || 0

  if (format & 16) content = <code>{content}</code>
  if (format & 1) content = <strong>{content}</strong>
  if (format & 2) content = <em>{content}</em>
  if (format & 8) content = <u>{content}</u>
  if (format & 4) content = <s>{content}</s>

  return <Fragment key={key}>{content}</Fragment>
}

function renderLexicalNode(node: LexicalNode, key: string): ReactNode {
  const children = renderChildren(node.children, key)

  switch (node.type) {
    case 'text':
      return renderText(node, key)
    case 'paragraph':
      return <p key={key}>{children}</p>
    case 'heading':
      switch (node.tag) {
        case 'h3':
          return <h3 key={key}>{children}</h3>
        case 'h4':
          return <h4 key={key}>{children}</h4>
        case 'h5':
          return <h5 key={key}>{children}</h5>
        case 'h6':
          return <h6 key={key}>{children}</h6>
        default:
          return <h2 key={key}>{children}</h2>
      }
    case 'quote':
      return <blockquote key={key}>{children}</blockquote>
    case 'list':
      return node.tag === 'ol' ? (
        <ol key={key}>{children}</ol>
      ) : (
        <ul key={key}>{children}</ul>
      )
    case 'listitem':
      return <li key={key}>{children}</li>
    case 'link': {
      const href = node.fields?.url || '#'
      const newTab = node.fields?.newTab

      return (
        <a
          href={href}
          key={key}
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noreferrer' : undefined}
        >
          {children}
        </a>
      )
    }
    case 'linebreak':
      return <br key={key} />
    default:
      return <Fragment key={key}>{children}</Fragment>
  }
}

function renderRichText(value: unknown): ReactNode {
  if (!value || typeof value !== 'object') return null

  const richText = value as RichTextValue
  return renderChildren(richText.root?.children, 'rich-text')
}

function getYouTubeEmbedUrl(value?: string | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value.trim())
    let videoId = ''

    if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || ''
    } else if (
      url.hostname === 'youtube.com' ||
      url.hostname === 'www.youtube.com'
    ) {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || ''
      } else {
        const pathParts = url.pathname.split('/').filter(Boolean)
        if (
          pathParts[0] === 'embed' ||
          pathParts[0] === 'shorts' ||
          pathParts[0] === 'live'
        ) {
          videoId = pathParts[1] || ''
        }
      }
    }

    return videoId
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
      : null
  } catch {
    return null
  }
}

export function ArticleRenderer({ article }: { article: HelpCenterArticle }) {
  return (
    <div className="article-body unified-article-body">
      {article.body.map((block, index) => {
        const blockData = block as unknown as ArticleBodyBlock

        if (blockData.blockType === 'richText') {
          return (
            <section className="article-block" key={`block-${index}`}>
              {renderRichText(blockData.content)}
            </section>
          )
        }

        if (blockData.blockType === 'callout') {
          const calloutStyle =
            blockData.style === 'tip' ||
            blockData.style === 'warning' ||
            blockData.style === 'success'
              ? blockData.style
              : 'info'

          const calloutIcon = {
            info: 'ℹ️',
            tip: '💡',
            warning: '⚠️',
            success: '✅',
          }[calloutStyle]

          const calloutLabel = {
            info: 'Informasi',
            tip: 'Tips',
            warning: 'Peringatan',
            success: 'Berhasil',
          }[calloutStyle]

          return (
            <aside
              className={`article-callout article-callout-${calloutStyle}`}
              key={`block-${index}`}
              role="note"
              aria-label={blockData.title || calloutLabel}
            >
              <span className="article-callout-icon" aria-hidden="true">
                {calloutIcon}
              </span>

              <div className="article-callout-content">
                {blockData.title ? (
                  <h3 className="article-callout-title">{blockData.title}</h3>
                ) : null}

                <div className="article-callout-body">
                  {renderRichText(blockData.content)}
                </div>
              </div>
            </aside>
          )
        }

        if (blockData.blockType === 'steps') {
          const steps = blockData.steps || []
          if (steps.length === 0) return null

          return (
            <section className="article-steps" key={`block-${index}`}>
              {blockData.heading ? (
                <h2 className="article-steps-heading">{blockData.heading}</h2>
              ) : null}

              <ol className="article-steps-list">
                {steps.map((step, stepIndex) => (
                  <li className="article-step" key={`step-${index}-${stepIndex}`}>
                    <span className="article-step-number" aria-hidden="true">
                      {stepIndex + 1}
                    </span>

                    <div className="article-step-content">
                      {step.title ? (
                        <h3 className="article-step-title">{step.title}</h3>
                      ) : null}
                      {step.description ? (
                        <p className="article-step-description">{step.description}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )
        }

        if (blockData.blockType === 'articleImage') {
          const media =
            typeof blockData.image === 'object' && blockData.image !== null
              ? blockData.image
              : null
          const imageUrl = media?.url
          if (!imageUrl) return null

          const imageAlt =
            blockData.altOverride?.trim() ||
            media.alt?.trim() ||
            blockData.caption?.trim() ||
            article.title

          const widthClass =
            blockData.width === 'medium'
              ? 'article-image-medium'
              : 'article-image-full'

          return (
            <figure
              className={`article-image-block ${widthClass}`}
              key={`block-${index}`}
            >
              <div className="article-image-frame">
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  width={media.width ?? undefined}
                  height={media.height ?? undefined}
                  loading="lazy"
                />
              </div>
              {blockData.caption ? (
                <figcaption className="article-image-caption">
                  {blockData.caption}
                </figcaption>
              ) : null}
            </figure>
          )
        }

        if (blockData.blockType === 'youtubeVideo') {
          const embedUrl = getYouTubeEmbedUrl(blockData.url)
          if (!embedUrl) return null

          const videoTitle = blockData.title?.trim() || 'Video panduan Pipero'

          return (
            <section className="article-youtube" key={`block-${index}`}>
              {blockData.title || blockData.description ? (
                <div className="article-youtube-heading">
                  {blockData.title ? (
                    <h2 className="article-youtube-title">{blockData.title}</h2>
                  ) : null}
                  {blockData.description ? (
                    <p className="article-youtube-description">
                      {blockData.description}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="article-youtube-frame">
                <iframe
                  src={embedUrl}
                  title={videoTitle}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </section>
          )
        }

        if (blockData.blockType === 'faq') {
          const faqItems = (blockData.items || []).filter(
            (item) => Boolean(item.question?.trim()) && Boolean(item.answer),
          )
          if (faqItems.length === 0) return null

          return (
            <section className="article-faq" key={`block-${index}`}>
              <h2 className="article-faq-heading">
                {blockData.heading || 'Pertanyaan yang Sering Ditanyakan'}
              </h2>

              <div className="article-faq-list">
                {faqItems.map((item, itemIndex) => (
                  <details
                    className="article-faq-item"
                    key={`faq-${index}-${itemIndex}`}
                  >
                    <summary className="article-faq-question">
                      <span>{item.question}</span>
                      <span className="article-faq-icon" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <div className="article-faq-answer">
                      {renderRichText(item.answer)}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )
        }

        return null
      })}
    </div>
  )
}

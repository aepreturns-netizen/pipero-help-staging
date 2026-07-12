import type { Block } from 'payload'

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'ArticleRichTextBlock',
  labels: {
    singular: 'Teks Artikel',
    plural: 'Teks Artikel',
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Isi',
    },
  ],
}

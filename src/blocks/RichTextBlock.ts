import type { Block } from 'payload'

import {
  BlocksFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { RichTextTableBlock } from './RichTextTableBlock'

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

      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [RichTextTableBlock],
          }),
        ],
      }),
    },
  ],
}

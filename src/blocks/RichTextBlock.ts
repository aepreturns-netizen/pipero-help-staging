import type { Block } from 'payload'

import {
  EXPERIMENTAL_TableFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

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
          EXPERIMENTAL_TableFeature(),
        ],
      }),
    },
  ],
}

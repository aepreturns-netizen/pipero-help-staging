import type { Block } from 'payload'

export const FAQBlock: Block = {
  slug: 'faq',
  interfaceName: 'ArticleFAQBlock',
  labels: {
    singular: 'FAQ',
    plural: 'FAQ',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Pertanyaan yang Sering Ditanyakan',
      label: 'Judul Bagian',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: {
        singular: 'Pertanyaan',
        plural: 'Pertanyaan',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
          label: 'Pertanyaan',
        },
        {
          name: 'answer',
          type: 'richText',
          required: true,
          label: 'Jawaban',
        },
      ],
    },
  ],
}

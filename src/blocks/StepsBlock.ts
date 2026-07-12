import type { Block } from 'payload'

export const StepsBlock: Block = {
  slug: 'steps',
  interfaceName: 'ArticleStepsBlock',
  labels: {
    singular: 'Langkah Bernomor',
    plural: 'Langkah Bernomor',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Judul Bagian',
    },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      labels: {
        singular: 'Langkah',
        plural: 'Langkah',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Judul Langkah',
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          label: 'Penjelasan',
        },
      ],
    },
  ],
}

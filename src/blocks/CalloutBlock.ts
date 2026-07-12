import type { Block } from 'payload'

export const CalloutBlock: Block = {
  slug: 'callout',
  interfaceName: 'ArticleCalloutBlock',
  labels: {
    singular: 'Kotak Informasi',
    plural: 'Kotak Informasi',
  },
  fields: [
    {
      name: 'style',
      type: 'select',
      required: true,
      defaultValue: 'info',
      label: 'Jenis',
      options: [
        { label: 'Informasi', value: 'info' },
        { label: 'Tips', value: 'tip' },
        { label: 'Peringatan', value: 'warning' },
        { label: 'Berhasil', value: 'success' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      label: 'Judul',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Isi',
    },
  ],
}

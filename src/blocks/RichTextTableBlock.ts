import type { Block } from 'payload'

export const RichTextTableBlock: Block = {
  slug: 'richTextTable',
  interfaceName: 'ArticleRichTextTableBlock',

  labels: {
    singular: 'Tabel',
    plural: 'Tabel',
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Judul Tabel',
      admin: {
        description: 'Opsional. Kosongkan jika tabel tidak memerlukan judul.',
      },
    },
    {
      name: 'columns',
      type: 'array',
      label: 'Kolom',
      required: true,
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Judul Kolom',
          required: true,
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Baris',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'cells',
          type: 'array',
          label: 'Isi Baris',
          required: true,
          minRows: 1,
          maxRows: 6,
          fields: [
            {
              name: 'value',
              type: 'text',
              label: 'Isi',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Catatan',
      admin: {
        description: 'Opsional. Ditampilkan di bawah tabel.',
      },
    },
  ],
}

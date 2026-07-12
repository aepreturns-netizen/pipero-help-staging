import type { Block } from 'payload'

export const ImageBlock: Block = {
  slug: 'articleImage',
  interfaceName: 'ArticleImageBlock',
  labels: {
    singular: 'Gambar / Screenshot',
    plural: 'Gambar / Screenshot',
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Gambar',
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Keterangan Gambar',
    },
    {
      name: 'altOverride',
      type: 'text',
      label: 'Teks Alternatif Khusus',
      admin: {
        description: 'Opsional. Jika kosong, gunakan alt text dari Media.',
      },
    },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'full',
      label: 'Lebar Tampilan',
      options: [
        { label: 'Lebar Penuh', value: 'full' },
        { label: 'Lebar Sedang', value: 'medium' },
      ],
    },
  ],
}

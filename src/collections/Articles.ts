import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { publishedOrAuthenticated } from '../access/publishedOrAuthenticated'
import { CalloutBlock } from '../blocks/CalloutBlock'
import { FAQBlock } from '../blocks/FAQBlock'
import { ImageBlock } from '../blocks/ImageBlock'
import { RichTextBlock } from '../blocks/RichTextBlock'
import { StepsBlock } from '../blocks/StepsBlock'
import { YouTubeBlock } from '../blocks/YouTubeBlock'
import { slugField } from '../fields/slugField'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: 'Artikel',
    plural: 'Artikel',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', '_status', 'updatedAt'],
    group: 'Help Center',
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  defaultSort: 'order',
  versions: {
    drafts: true,
    maxPerDoc: 30,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Konten',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              label: 'Judul Artikel',
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              maxLength: 240,
              label: 'Ringkasan',
              admin: {
                description:
                  'Ditampilkan pada hasil pencarian dan bagian atas artikel.',
              },
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              required: true,
              label: 'Kategori',
              filterOptions: {
                isActive: {
                  equals: true,
                },
              },
            },
            {
              name: 'body',
              type: 'blocks',
              required: true,
              minRows: 1,
              label: 'Isi Artikel',
              blocks: [
                RichTextBlock,
                CalloutBlock,
                StepsBlock,
                ImageBlock,
                YouTubeBlock,
                FAQBlock,
              ],
              admin: {
                initCollapsed: false,
              },
            },
          ],
        },
        {
          label: 'Relasi & Pencarian',
          fields: [
            {
              name: 'tags',
              type: 'array',
              label: 'Tag',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  label: 'Tag',
                },
              ],
            },
            {
              name: 'relatedArticles',
              type: 'relationship',
              relationTo: 'articles',
              hasMany: true,
              label: 'Artikel Terkait',
            },
            {
              name: 'searchKeywords',
              type: 'textarea',
              label: 'Kata Kunci Tambahan',
              admin: {
                description:
                  'Kata yang mungkin dicari pengguna tetapi tidak tertulis pada judul.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: 'Pengaturan SEO',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  maxLength: 65,
                  label: 'SEO Title',
                },
                {
                  name: 'description',
                  type: 'textarea',
                  maxLength: 170,
                  label: 'Meta Description',
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Gambar Share / Open Graph',
                },
                {
                  name: 'noIndex',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Jangan tampilkan di mesin pencari',
                },
              ],
            },
          ],
        },
      ],
    },

    slugField('title'),

    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      min: 0,
      label: 'Urutan Artikel',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Artikel Unggulan',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'estimatedReadMinutes',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 60,
      label: 'Estimasi Waktu Baca',
      admin: {
        description: 'Dalam menit.',
        position: 'sidebar',
      },
    },
  ],
}

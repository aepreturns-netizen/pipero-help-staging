import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { slugField } from '../fields/slugField'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Kategori',
    plural: 'Kategori',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order', 'isActive'],
    group: 'Help Center',
  },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      label: 'Nama Kategori',
    },
    slugField('name'),
    {
      name: 'description',
      type: 'textarea',
      label: 'Deskripsi',
    },
    {
      name: 'icon',
      type: 'text',
      defaultValue: '📘',
      label: 'Ikon',
      admin: {
        description: 'Untuk tahap awal dapat diisi emoji.',
        position: 'sidebar',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 100,
      min: 0,
      label: 'Urutan',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Tampilkan kategori',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}

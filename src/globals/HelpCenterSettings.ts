import type { GlobalConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const HelpCenterSettings: GlobalConfig = {
  slug: 'help-center-settings',
  label: 'Pengaturan Help Center',
  admin: {
    group: 'Pengaturan',
  },
  access: {
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'supportWhatsApp',
      type: 'text',
      required: true,
      defaultValue: '6287877898277',
      label: 'Nomor WhatsApp Support',
      admin: {
        description: 'Gunakan format internasional tanpa tanda +.',
      },
    },
    {
      name: 'supportButtonLabel',
      type: 'text',
      defaultValue: 'Tanya Support',
      label: 'Teks Tombol Support',
    },
    {
      name: 'searchPlaceholder',
      type: 'text',
      defaultValue: 'Cari solusi, fitur, atau topik...',
      label: 'Placeholder Pencarian',
    },
    {
      name: 'defaultSeoTitle',
      type: 'text',
      defaultValue: 'Pipero Help Center',
      label: 'SEO Title Default',
    },
    {
      name: 'defaultSeoDescription',
      type: 'textarea',
      defaultValue:
        'Panduan penggunaan Pipero untuk membantu bisnis melayani pelanggan, mengelola penjualan, dan menjalankan otomatisasi.',
      label: 'Meta Description Default',
    },
  ],
}

import type { Field } from 'payload'
import { formatSlug } from '../utilities/formatSlug'

export const slugField = (sourceField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    description: 'Alamat artikel. Dibuat otomatis dari judul dan masih dapat diedit.',
    position: 'sidebar',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        const sourceValue =
          data && typeof data === 'object'
            ? (data as Record<string, unknown>)[sourceField]
            : undefined

        return formatSlug(String(value || sourceValue || ''))
      },
    ],
  },
})

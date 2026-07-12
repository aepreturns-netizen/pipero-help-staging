import type { Block } from 'payload'

export const YouTubeBlock: Block = {
  slug: 'youtubeVideo',
  interfaceName: 'ArticleYouTubeBlock',
  labels: {
    singular: 'Video YouTube',
    plural: 'Video YouTube',
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Link YouTube',
      validate: (value: unknown) => {
        if (!value) return 'Link YouTube wajib diisi.'

        try {
          const url = new URL(String(value))
          const allowedHosts = [
            'youtube.com',
            'www.youtube.com',
            'youtu.be',
            'www.youtu.be',
          ]

          return allowedHosts.includes(url.hostname)
            ? true
            : 'Gunakan link YouTube atau youtu.be yang valid.'
        } catch {
          return 'Format link YouTube tidak valid.'
        }
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Judul Video',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Deskripsi Singkat',
    },
  ],
}

import { defineConfig } from 'vitepress'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getLogbookSidebar, getConceptsSidebar } from './utils/sidebar.ts'
import { wikilinksPlugin } from './utils/wikilinks.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '..')

// Base path: otomatis mendeteksi nama repo jika dijalankan di GitHub Actions
const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : ''
const base = (process.env.BASE_URL || (repo && !repo.endsWith('.github.io') ? `/${repo}/` : '/')) as `/${string}/`

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base,
  title: "Laporan Harian",
  description: "Dokumentasi Laporan Harian & Konsep Pembelajaran Magang - Septio Nugroho",
  lang: 'id-ID',

  head: [
    ['link', { rel: 'icon', href: `${base}favicon.ico` }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${base}favicon-32x32.png` }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: `${base}favicon-16x16.png` }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: `${base}apple-touch-icon.png` }],
    ['link', { rel: 'manifest', href: `${base}site.webmanifest` }]
  ],

  markdown: {
    config: (md) => {
      // Aktifkan Obsidian-style wikilinks: [[target|teks]] atau [[target]]
      md.use(wikilinksPlugin({ docsDir, base }))
    }
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Beranda', link: '/' },
      { text: 'Laporan Harian', link: '/logbook/september-2026/2026-09-01' },
      { text: 'Konsep', link: '/concepts/' }
    ],

    sidebar: {
      '/logbook/': getLogbookSidebar(docsDir),
      '/concepts/': getConceptsSidebar(docsDir)
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: 'Cari catatan atau konsep...',
                buttonAriaLabel: 'Cari catatan atau konsep'
              },
              modal: {
                noResultsText: 'Tidak ada hasil untuk',
                resetButtonTitle: 'Hapus pencarian',
                footer: {
                  selectText: 'untuk memilih',
                  navigateText: 'untuk navigasi',
                  closeText: 'untuk menutup'
                }
              }
            }
          }
        }
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/nseptio' }
    ],

    footer: {
      message: 'Dokumentasi Catatan Pembelajaran Magang',
      copyright: 'Copyright © 2026 Septio Nugroho'
    },

    outline: {
      label: 'Daftar Isi Halaman',
      level: [2, 3]
    },

    docFooter: {
      prev: 'Sebelumnya',
      next: 'Selanjutnya'
    }
  }
})

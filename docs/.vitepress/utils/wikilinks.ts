import fs from 'node:fs'
import path from 'node:path'

export interface WikilinksOptions {
  docsDir: string
  base?: string
}

export function wikilinksPlugin(options: WikilinksOptions) {
  const { docsDir, base = '/' } = options
  let fileMapCache: Map<string, string> | null = null

  function getFileMap(): Map<string, string> {
    if (fileMapCache) {
      return fileMapCache
    }

    const map = new Map<string, string>()

    function scan(dir: string, base: string = '') {
      if (!fs.existsSync(dir)) return

      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'cache' || entry.name === 'dist') {
          continue
        }

        const fullPath = path.join(dir, entry.name)
        const relPath = base ? `${base}/${entry.name}` : entry.name

        if (entry.isDirectory()) {
          scan(fullPath, relPath)
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const nameWithoutExt = entry.name.replace(/\.md$/, '')
          // Normalisasi ke forward slash untuk web routing
          const route = '/' + relPath.replace(/\\/g, '/').replace(/\.md$/, '')

          // 1. Map nama file saja (misal: "ara-arb" -> "/concepts/pasar-modal/ara-arb")
          map.set(nameWithoutExt.toLowerCase(), route)

          // 2. Map path relatif (misal: "concepts/pasar-modal/ara-arb")
          map.set(relPath.replace(/\\/g, '/').replace(/\.md$/, '').toLowerCase(), route)
        }
      }
    }

    scan(docsDir)
    fileMapCache = map
    return map
  }

  return (md: any) => {
    md.inline.ruler.before('link', 'wikilinks', (state: any, silent: boolean) => {
      const src: string = state.src
      const pos: number = state.pos

      // Periksa apakah diawali dengan '[['
      if (src.charCodeAt(pos) !== 0x5b || src.charCodeAt(pos + 1) !== 0x5b) {
        return false
      }

      // Cari penutup ']]'
      const end = src.indexOf(']]', pos + 2)
      if (end === -1) {
        return false
      }

      if (silent) {
        return true
      }

      const rawContent = src.slice(pos + 2, end).trim()
      if (!rawContent) {
        return false
      }

      // Format Obsidian: [[target|Label Kustom]] atau [[target]]
      const parts = rawContent.split('|')
      const target = parts[0].trim()
      const label = parts.length > 1 ? parts.slice(1).join('|').trim() : target

      // Deteksi anchor (#bagian-halaman)
      let targetFile = target
      let hash = ''
      const hashIndex = target.indexOf('#')
      if (hashIndex !== -1) {
        targetFile = target.slice(0, hashIndex).trim()
        hash = target.slice(hashIndex)
      }

      const fileMap = getFileMap()
      let href: string | null = null

      if (!targetFile && hash) {
        // Tautan hanya anchor ke heading di halaman aktif: [[#definisi]]
        href = hash
      } else {
        const resolvedRoute = fileMap.get(targetFile.toLowerCase())
        if (resolvedRoute) {
          href = resolvedRoute + hash
        }
      }

      if (href) {
        // Halaman ditemukan -> render link navigasi aktif
        const tokenOpen = state.push('link_open', 'a', 1)
        tokenOpen.attrs = [['href', href]]

        const tokenText = state.push('text', '', 0)
        tokenText.content = label

        state.push('link_close', 'a', -1)
      } else {
        // Halaman belum dibuat (unresolved wikilink ala Obsidian) -> render span berpenanda
        const tokenOpen = state.push('html_inline', '', 0)
        tokenOpen.content = `<span class="wikilink-unresolved" title="Halaman konsep belum dibuat: ${target}" style="color: var(--vp-c-text-3); text-decoration: underline dotted; cursor: help;">`

        const tokenText = state.push('text', '', 0)
        tokenText.content = label

        const tokenClose = state.push('html_inline', '', 0)
        tokenClose.content = `</span>`
      }

      // Geser pointer markdown reader
      state.pos = end + 2
      return true
    })
  }
}

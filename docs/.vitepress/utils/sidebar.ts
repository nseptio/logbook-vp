import fs from 'node:fs'
import path from 'node:path'

const MONTH_NAMES_ID: Record<string, string> = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember'
}

function formatName(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function extractTitle(filePath: string, fallback: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    // 1. Cek frontmatter: title: "..."
    const fmMatch = content.match(/^---\r?\n[\s\S]*?title:\s*["']?([^"'\r\n]+)["']?[\s\S]*?\r?\n---/)
    if (fmMatch && fmMatch[1]) {
      return fmMatch[1].trim()
    }
    // 2. Cek heading h1: # Judul
    const h1Match = content.match(/^#\s+(.+)$/m)
    if (h1Match && h1Match[1]) {
      return h1Match[1].trim()
    }
  } catch {
    // fallback jika gagal baca
  }
  return fallback
}

function getDisplayTitle(fileNameWithoutExt: string, filePath: string): string {
  // Prioritas utama: jika nama file berformat tanggal YYYY-MM-DD (e.g. 2026-09-01),
  // selalu paksa tampilkan hanya tanggal murni seperti "1 September" di sidebar.
  const dateMatch = fileNameWithoutExt.match(/^\d{4}-(\d{2})-(\d{2})$/)
  if (dateMatch) {
    const monthNum = dateMatch[1]
    const dayNum = parseInt(dateMatch[2], 10)
    const monthName = MONTH_NAMES_ID[monthNum] || monthNum
    return `${dayNum} ${monthName}`
  }

  // Jika bukan format tanggal, baru baca title dari file atau format namanya
  const rawTitle = extractTitle(filePath, '')
  if (rawTitle) {
    return rawTitle
  }

  return formatName(fileNameWithoutExt)
}

export function getLogbookSidebar(docsDir: string) {
  const logbookDir = path.resolve(docsDir, 'logbook')
  const sidebarItems: any[] = []

  if (!fs.existsSync(logbookDir)) {
    return sidebarItems
  }

  // Dapatkan folder bulan (contoh: september-2026)
  const monthEntries = fs.readdirSync(logbookDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== '.vitepress')
    .sort((a, b) => a.name.localeCompare(b.name))

  for (const monthEntry of monthEntries) {
    const monthName = monthEntry.name
    const monthPath = path.join(logbookDir, monthName)
    const monthTitle = formatName(monthName) // e.g. "September 2026"

    const files = fs.readdirSync(monthPath, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .sort((a, b) => a.name.localeCompare(b.name))

    const dayItems = files.map(file => {
      const filePath = path.join(monthPath, file.name)
      const baseName = file.name.replace(/\.md$/, '')
      const title = getDisplayTitle(baseName, filePath)

      return {
        text: title,
        link: `/logbook/${monthName}/${baseName}`
      }
    })

    if (dayItems.length > 0) {
      sidebarItems.push({
        text: monthTitle,
        collapsed: false,
        items: dayItems
      })
    }
  }

  return sidebarItems
}

export function getConceptsSidebar(docsDir: string) {
  const conceptsDir = path.resolve(docsDir, 'concepts')
  const sidebarItems: any[] = [
    {
      text: 'Semua Konsep',
      link: '/concepts/'
    }
  ]

  if (!fs.existsSync(conceptsDir)) {
    return sidebarItems
  }

  const categoryEntries = fs.readdirSync(conceptsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))

  for (const catEntry of categoryEntries) {
    const catName = catEntry.name
    const catPath = path.join(conceptsDir, catName)
    const catTitle = formatName(catName)

    const files = fs.readdirSync(catPath, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .sort((a, b) => a.name.localeCompare(b.name))

    const conceptItems = files.map(file => {
      const filePath = path.join(catPath, file.name)
      const baseName = file.name.replace(/\.md$/, '')
      const title = extractTitle(filePath, baseName)

      return {
        text: title,
        link: `/concepts/${catName}/${baseName}`
      }
    })

    if (conceptItems.length > 0) {
      sidebarItems.push({
        text: catTitle,
        collapsed: false,
        items: conceptItems
      })
    }
  }

  return sidebarItems
}

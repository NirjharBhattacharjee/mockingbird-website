// The docs pages are mockingbird's own docs/*.md, copied into content/docs
// with `bun run docs:sync` and rendered with Bun's built-in Markdown parser.

import { links } from './ui/links.ts'

export interface DocMeta {
  slug: string
  file: string
  title: string
  blurb: string
}

export const DOCS: DocMeta[] = [
  { slug: '', file: 'README.md', title: 'User guide', blurb: 'Install, every command, permissions, troubleshooting' },
  { slug: 'philosophy', file: 'PHILOSOPHY.md', title: 'Philosophy', blurb: 'Why it exists, and what it must never become' },
  { slug: 'architecture', file: 'ARCHITECTURE.md', title: 'Architecture', blurb: 'The stack, the pipeline, and who owns what' },
  { slug: 'models', file: 'MODELS.md', title: 'Models', blurb: 'Every model it runs, and why' },
  { slug: 'privacy', file: 'SECURITY_PRIVACY.md', title: 'Security & privacy', blurb: 'What it touches, and what it never does' },
  { slug: 'database', file: 'DATABASE.md', title: 'Database', blurb: 'The SQLite schema, in full' },
  { slug: 'tui', file: 'TUI.md', title: 'Terminal UI', blurb: 'The Catppuccin TUI and its screens' },
]

export interface Doc extends DocMeta {
  html: string
  toc: { id: string; text: string }[]
}

export const docHref = (slug: string) => (slug ? `/docs/${slug}` : '/docs')

// GitHub's heading anchors, so links written for GitHub keep working:
// "16. Known gaps — scope" becomes "16-known-gaps--scope".
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-')
}

const stripTags = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

/** Points links between docs at these pages, and the rest of the repo at GitHub. */
export function rewriteHref(href: string): string {
  let doc = href.match(/^\.\/([A-Z_]+\.md)(#.*)?$/)
  if (doc) {
    let target = DOCS.find((d) => d.file === doc[1])
    if (target) return docHref(target.slug) + (doc[2] ?? '')
  }
  if (href.startsWith('../')) return `${links.repo}/blob/main/${href.slice(3)}`
  if (href.startsWith('./')) return `${links.repo}/blob/main/docs/${href.slice(2)}`
  return href
}

export function renderMarkdown(markdown: string): Pick<Doc, 'html' | 'toc'> {
  let toc: Doc['toc'] = []
  let seen = new Map<string, number>()
  let html = Bun.markdown
    .html(markdown)
    .replace(/<h([1-4])>([\s\S]*?)<\/h\1>/g, (_, level: string, inner: string) => {
      let text = stripTags(inner)
      // a repeated heading gets -1, -2, ... like on GitHub
      let base = slugify(text)
      let n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      let id = n ? `${base}-${n}` : base
      if (level === '2') toc.push({ id, text })
      return `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${level}>`
    })
    .replace(/href="([^"]+)"/g, (_, href: string) => `href="${rewriteHref(href)}"`)
    // the first h1 is the page title, which the page draws itself
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '')
  return { html, toc }
}

// Rendering takes a millisecond or two, so there's no cache to go stale.
export async function loadDoc(slug: string): Promise<Doc | null> {
  let meta = DOCS.find((d) => d.slug === slug)
  if (!meta) return null
  let markdown = await Bun.file(new URL(`../content/docs/${meta.file}`, import.meta.url)).text()
  return { ...meta, ...renderMarkdown(markdown) }
}

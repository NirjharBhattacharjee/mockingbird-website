import type { Handle, RemixNode } from 'remix/component'
import { ImportMap } from 'remix/component/server'

import { scriptEntry } from '../assets.ts'

export interface DocumentProps {
  children?: RemixNode
  title?: string
  description?: string
}

const DEFAULT_TITLE = 'mockingbird — local voice dictation for macOS'
const DEFAULT_DESCRIPTION =
  'Hold Fn, speak, let go. Free forever, open source, and your voice never leaves your Mac.'

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    let { children, title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION } = handle.props
    let { href, importMap, preloads } = scriptEntry

    return (
      <html lang="en" data-flavor="mocha">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <title>{title}</title>
          <meta name="description" content={description} />
          <meta name="theme-color" content="#11111b" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <link rel="icon" type="image/png" href="/brand/logo.png" />
          <link rel="preload" href="/fonts/jetbrains-mono-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          <link rel="preload" href="/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          <link rel="stylesheet" href="/styles.css" />
          {/* blocking on purpose: sets the saved flavor and grid size before first paint */}
          <script src="/theme-init.js"></script>
          <ImportMap value={importMap} />
          {preloads.map((preloadHref) => (
            <link key={preloadHref} rel="modulepreload" href={preloadHref} />
          ))}
          <script type="module" src={href}></script>
        </head>
        <body>{children}</body>
      </html>
    )
  }
}

import { type Handle, unsafeHTML } from 'remix/component'

import { DOCS, type Doc, docHref } from '../docs.ts'
import { Footer, Nav } from '../ui/layout.tsx'
import { links } from '../ui/links.ts'
import { cx } from './public/lib/events.ts'
import { Document } from './document.tsx'

export function DocsPage(handle: Handle<{ doc: Doc }>) {
  return () => {
    let { doc } = handle.props
    return (
      <Document title={`${doc.title} — mockingbird docs`} description={doc.blurb} path={docHref(doc.slug)}>
        <Nav current={docHref(doc.slug)} />
        <div class="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-28 pb-24 md:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_14rem]">
          <nav aria-label="Docs" class="md:sticky md:top-24 md:self-start">
            <ul class="flex gap-x-4 gap-y-1 overflow-x-auto text-[15px] md:flex-col md:overflow-visible">
              {DOCS.map((d) => (
                <li class="shrink-0">
                  <a
                    href={docHref(d.slug)}
                    aria-current={d.slug === doc.slug ? 'page' : undefined}
                    class={cx(
                      'block border-l-2 py-1 pl-3',
                      d.slug === doc.slug ? 'border-sky font-bold text-text' : 'border-transparent text-soft hover:text-text',
                    )}
                  >
                    {d.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <main class="min-w-0">
            <h1 class="text-[38px] leading-[1.05] font-extrabold tracking-[-0.035em] text-text sm:text-[48px]">{doc.title}</h1>
            <p class="mt-3 text-[17px] text-soft">{doc.blurb}</p>
            <article class="doc mt-8" innerHTML={unsafeHTML(doc.html)} />
            <p class="mt-16 border-t border-surface0 pt-5 text-[14px] text-overlay">
              This page is <code>docs/{doc.file}</code> in the mockingbird repo.{' '}
              <a class="link" href={`${links.repo}/blob/main/docs/${doc.file}`}>
                Edit it on GitHub
              </a>
            </p>
          </main>

          {doc.toc.length > 1 && (
            <nav aria-label="On this page" class="hidden xl:sticky xl:top-24 xl:block xl:self-start">
              <p class="mb-2 text-[14px] font-bold text-text">On this page</p>
              <ul class="space-y-1.5 text-[14px]">
                {doc.toc.map((h) => (
                  <li>
                    <a href={`#${h.id}`} class="text-overlay hover:text-text">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
        <Footer />
      </Document>
    )
  }
}

export function NotFoundPage() {
  return () => (
    <Document title="Not found — mockingbird">
      <Nav />
      <main class="mx-auto max-w-[1200px] px-4 pt-40 pb-40">
        <h1 class="text-[38px] font-extrabold tracking-[-0.035em] text-text">There's no page here</h1>
        <p class="mt-3 text-[17px] text-soft">
          Check the address, or start from the <a class="link" href={links.docs}>user guide</a> or the{' '}
          <a class="link" href="/">home page</a>.
        </p>
      </main>
      <Footer />
    </Document>
  )
}

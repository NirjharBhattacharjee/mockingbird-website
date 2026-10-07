import { createController } from 'remix/router'

import { assets } from '../assets.ts'
import { loadDoc } from '../docs.ts'
import { routes } from '../routes.ts'
import { DocsPage, NotFoundPage } from './docs-page.tsx'
import { HomePage } from './home-page.tsx'

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },
    // For the host's health checks: answers without rendering anything.
    health() {
      return new Response('ok', { headers: { 'Cache-Control': 'no-store' } })
    },
    home(context) {
      return context.render(<HomePage />)
    },
    async docs(context) {
      let doc = await loadDoc(context.params.slug ?? '')
      if (!doc) return context.render(<NotFoundPage />, { status: 404 })
      return context.render(<DocsPage doc={doc} />)
    },
  },
})

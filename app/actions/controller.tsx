import { createController } from 'remix/router'

import { assets } from '../assets.ts'
import { routes } from '../routes.ts'
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
  },
})

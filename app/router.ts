import { createRouter, type MiddlewareContext } from 'remix/router'
import { compression } from 'remix/middleware/compression'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'

import controller from './actions/controller.tsx'
import { assets } from './assets.ts'
import { routes } from './routes.ts'

const renderMiddleware = render({ assets })
type AppContext = MiddlewareContext<[typeof renderMiddleware]>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}

export const router = createRouter<AppContext>({
  middleware: [
    compression(),
    // revalidate every time (a 304 when unchanged): styles.css keeps its
    // name across deploys, and an hour-old copy with new HTML breaks the page
    staticFiles('./public', { index: false, cacheControl: 'no-cache' }),
    renderMiddleware,
  ],
})

router.map(routes, controller)

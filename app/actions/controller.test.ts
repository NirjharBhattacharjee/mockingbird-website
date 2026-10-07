import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { router } from '../router.ts'
import { routes } from '../routes.ts'

const get = (path: string) => router.fetch(new URL(path, 'http://localhost'))

describe('root controller', () => {
  it('GET / returns the home page', async () => {
    let response = await get(routes.home.href())

    assert.equal(response.status, 200)
    assert.match(response.headers.get('Content-Type') ?? '', /text\/html/)
    assert.match(await response.text(), /<html[\s>]/)
  })

  it('GET /docs renders the user guide from the copied docs', async () => {
    let response = await get(routes.docs.href())
    let body = await response.text()

    assert.equal(response.status, 200)
    assert.match(body, /<h1[^>]*>User guide<\/h1>/)
    assert.match(body, /id="quick-start"/)
    // links between docs stay on the site, links into the repo go to GitHub
    assert.match(body, /href="\/docs\/philosophy"/)
    assert.match(body, /href="https:\/\/github\.com\/NirjharBhattacharjee\/mockingbird\/blob\/main\/scripts\/install\.sh"/)
  })

  it('GET /docs/philosophy keeps GitHub-style anchors', async () => {
    let body = await (await get(routes.docs.href({ slug: 'philosophy' }))).text()

    assert.match(body, /id="1-why-this-exists"/)
    assert.match(body, /href="#1-why-this-exists"/)
  })

  it('GET /docs/architecture keeps the double dash GitHub makes for an em dash', async () => {
    let body = await (await get(routes.docs.href({ slug: 'architecture' }))).text()

    assert.match(body, /id="16-known-gaps--scope-not-yet-decided"/)
  })

  it('GET /docs/<unknown> is a 404', async () => {
    let response = await get(routes.docs.href({ slug: 'nope' }))

    assert.equal(response.status, 404)
  })
})

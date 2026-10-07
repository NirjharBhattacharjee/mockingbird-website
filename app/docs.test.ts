import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { renderMarkdown } from './docs.ts'

describe('renderMarkdown', () => {
  it('numbers repeated headings like GitHub does', () => {
    let { html } = renderMarkdown('# Title\n\n## Setup\n\n## Setup\n\n### Setup')

    let ids = [...html.matchAll(/<h\d id="([^"]+)"/g)].map((m) => m[1])
    assert.deepEqual(ids, ['setup', 'setup-1', 'setup-2'])
  })
})

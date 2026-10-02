import * as http from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'

import { router } from './app/router.ts'

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 44100
const isProduction = process.env.NODE_ENV === 'production'

// In production the host's proxy terminates TLS, so trust its forwarded
// headers to get the real https:// URL and client address.
const server = http.createServer(createRequestListener(router.fetch, { trustProxy: isProduction }))

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})

let shuttingDown = false

function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  server.close(() => process.exit(0))
  server.closeAllConnections()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

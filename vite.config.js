import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const routes = {
  '/register': 'register', '/verify-pin': 'verifyPin', '/resend-pin': 'resendPin',
  '/forgot-password': 'forgotPassword', '/reset-password': 'resetPassword',
  '/notify-decision': 'notifyDecision',
}

const authApi = () => ({
  name: 'auth-api',
  configureServer(server) {
    const load = () => server.ssrLoadModule('/backend/controllers/authController.js')
      server.httpServer?.once('listening', () => {
        const { port } = server.httpServer.address()
        if (!process.env.APP_URL) process.env.APP_URL = `http://localhost:${port}`
        if (!globalThis.__notifWorker) {
          globalThis.__notifWorker = load().then((m) => m.startNotificationWorker()).catch((e) => console.error('[auth-api]', e.message))
        }
      })

    server.middlewares.use('/api/auth', async (req, res, next) => {
      const fn = routes[req.url.split('?')[0]]
      if (req.method !== 'POST' || !fn) return next()
      let raw = ''
      for await (const c of req) raw += c
      req.body = raw ? JSON.parse(raw) : {}
      res.status = (code) => { res.statusCode = code; return res }
      res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)) }
      ;(await load())[fn](req, res)
    })
  },
})

export default defineConfig({ plugins: [react(), authApi()] })
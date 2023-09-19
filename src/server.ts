import fastify from 'fastify'
import fastifyHelmet from '@fastify/helmet'
import fs from 'node:fs'
import path from 'node:path'
import fastifySecureSession from '@fastify/secure-session'
import userRoutes from '@routes/user'

const buildServer = () => {
  const server = fastify({ logger: true })
  server.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  })

  server.register(fastifySecureSession, {
    sessionName: 'session',
    cookieName: 'session-cookie',
    key: fs.readFileSync(path.join(__dirname, 'secret_key')),
    cookie: {
      path: '/',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
    },
  })

  server.register(userRoutes, { prefix: '/api/v1/user' })
  return server
}

export default buildServer

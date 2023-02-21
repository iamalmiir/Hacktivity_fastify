import Router from 'koa-router'
import prisma from '@common/db'

const _ = new Router()

_.get('/auth/user/me', async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    // Get user from database using the id from the session
    const user = await prisma.user.findUnique({
      where: {
        id: ctx.state.user.id,
      },
    })

    // Remove password from user object before sending it to the client
    if (user && user.name && user.email) {
      // Send user object to the client
      ctx.body = {
        success: true,
        message: 'Successfully logged in',
        user: {
          name: user.name,
          email: user.email,
        },
      }
    }
  }

  await next()
})

export default _

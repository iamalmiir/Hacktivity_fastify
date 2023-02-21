import passport from 'koa-passport'
import Router from 'koa-router'

const _ = new Router()

_.post(
  '/auth/local/login',
  passport.authenticate('local', {
    failureRedirect: '/failed/auth',
  }),
  async (ctx, next) => {
    if (ctx.isAuthenticated()) {
      ctx.body = {
        success: true,
        message: 'Successfully logged in',
      }
    }

    await next()
  }
)

_.get('/logout', async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    ctx.logout()
    ctx.body = {
      success: true,
      message: 'Successfully logged out',
    }
  }

  await next()
})

_.get('/failed/auth', async (ctx, next) => {
  ctx.body = {
    success: false,
    message: 'Failed to authenticate',
  }

  await next()
})
export default _

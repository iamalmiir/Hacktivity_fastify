import passport from 'koa-passport'
import Router from 'koa-router'

const _ = new Router()

// Login route for local strategy
_.post(
  '/auth/local/login',
  passport.authenticate('local', {
    // If authentication failed redirect to /failed/auth
    failureRedirect: '/failed/auth',
  }),
  async (ctx, next) => {
    // If authentication succeeded send success message to the client
    ctx.body = {
      success: true,
      message: 'Successfully logged in',
    }

    await next()
  }
)

// Logout route
_.get('/logout', async (ctx, next) => {
  // If user is authenticated log them out and send success message to the client
  // Otherwise send failed message to the client
  if (ctx.isAuthenticated()) {
    ctx.logout()
    ctx.body = {
      success: true,
      message: 'Successfully logged out',
    }
  } else {
    ctx.body = {
      success: false,
      message: 'Failed to logout',
    }
  }

  await next()
})

// Failed authentication route
_.get('/failed/auth', async (ctx, next) => {
  ctx.body = {
    success: false,
    message: 'Failed to authenticate',
  }

  await next()
})
export default _

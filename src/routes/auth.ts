import passport from 'koa-passport'
import Router from 'koa-router'

const _ = new Router()

// Login route for local strategy
_.post(
  '/auth/local/login',
  passport.authenticate('local', {
    failureRedirect: '/failed/auth',
  }),
  async (ctx, next) => {
    // If authentication succeeded send success message to the client
    ctx.body = {
      success: true,
      message: "You've been logged in!",
    }

    await next()
  }
)

// Logout route
_.get('/logout', async (ctx, next) => {
  // If user is authenticated log them out and send success message to the client
  // Otherwise send failed message to the client
  if (ctx.isAuthenticated()) {
    try {
      ctx.logOut()
      ctx.body = {
        success: true,
        message: "You've been logged out!",
      }
    } catch (err) {
      ctx.body = {
        success: false,
        message: "Uh oh, that didn't work!",
      }
    }
  }

  await next()
})

// Failed authentication route
_.get('/failed/auth', async (ctx, next) => {
  ctx.body = {
    success: false,
    message: "Uh oh, that did't work! Please check your info.",
  }

  await next()
})

export default _.routes()

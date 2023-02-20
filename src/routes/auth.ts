import passport from 'koa-passport'

import Router from 'koa-router'
const _ = new Router()

_.get('/', async (ctx, next) => {
  ctx.body = {
    data: 'Hello world!',
  }

  await next()
})

_.post(
  '/auth/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  async (ctx, next) => {
    ctx.body = {
      data: ctx.state.user,
    }

    await next()
  }
)

_.get('/logout', async (ctx, next) => {
  ctx.logout()
  ctx.redirect('/')

  await next()
})

export default _

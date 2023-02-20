import prisma from '@common/db'

import Router from 'koa-router'
const _ = new Router()

_.get('/', async (ctx, next) => {
  const users = await prisma.user.findMany()

  ctx.body = {
    message: 'Hello World!',
    status: 'success',
    data: users,
  }

  await next()
})

export default _

import Router from 'koa-router'
import { UserInfo } from '../types/UserTypes'
import { prisma, registerValidator, hashPassword } from '@common/index'

const _ = new Router()

/*
  * Register route
  @POST /account/register

  @body name: string
  @body username: string
  @body email: string
  @body password: string

*/
_.post('/account/register', async (ctx, next) => {
  // If user is authenticated redirect them to /auth/user/me
  if (ctx.isAuthenticated()) {
    ctx.redirect('/auth/user/me')
    return
  }

  // Validate request body using using Joi @common/validators.ts
  let { error } = registerValidator.validate(ctx.request.body)
  // If validation failed send error message to the client
  // Otherwise continue with the request
  if (error) {
    ctx.body = {
      success: false,
      message:
        'Please ensure all required fields are filled in with valid data. If issues persist, contact support.',
    }
    return
  }

  try {
    // Extract user info from request body
    let { name, username, email, password } = ctx.request.body as UserInfo
    // Check if user already exists
    let userExists = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: username,
          },
          {
            email: email,
          },
        ],
      },
    })
    // If user doesn't exist create a new user
    if (!userExists) {
      await prisma.user.create({
        data: {
          name: name,
          username: username,
          email: email,
          password: await hashPassword(password),
        },
      })

      ctx.body = {
        success: true,
        message: 'Successfully registered user',
      }
      return
    }

    // If user already exists send error message to the client
    ctx.body = {
      success: false,
      message:
        'Something went wrong, please try again later. If issues persist, contact support.',
    }
  } catch (err) {
    // If something went wrong send error message to the client
    ctx.body = {
      success: false,
      message: "Couldn't register user",
    }
  }
  // Continue with the request
  await next()
})

export default _

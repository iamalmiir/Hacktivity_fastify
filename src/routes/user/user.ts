import Router from 'koa-router'

import prisma from '@common/db'
import { exclude } from '@utils/exclude'
import { UserInfo } from '@common/types/UserTypes'
import { userUpdateValidator, hashPassword } from '@utils/index'

const _ = new Router()
// API ENDPOINTS
const API_PATH = '/auth/user/me'

/*
  * Get user info
  @GET /auth/user/me

  @body name: string
  @body username: string
  @body email: string

*/
_.get(API_PATH, async (ctx, next) => {
  try {
    // If user is authenticated send user info to the client
    if (ctx.isAuthenticated()) {
      // Get user from database using the id from the session
      const user = await prisma.user.findUnique({
        where: {
          id: ctx.state.user.id,
        },
      })

      // Remove password from user object before sending it to the client
      if (user) {
        // Send user object to the client
        ctx.body = {
          success: true,
          message: 'OK',
          user: exclude(user, ['id', 'password', 'createdAt', 'updatedAt']),
        }
      }
    } else {
      // If user is not authenticated send failed message to the client
      throw 'User not authenticated!'
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err,
    }
  }

  await next()
})

/*
  * Update user info
  @PATCH /auth/user/me

  @body name: string
  @body email: string
  @body password: string

*/
_.patch(API_PATH, async (ctx, next) => {
  try {
    // If user is authenticated continue with the request
    if (ctx.isAuthenticated()) {
      const user = prisma.user.findUnique({
        where: {
          id: ctx.state.user.id,
        },
      })

      if (!user) {
        throw 'User not found!'
      }
    } else {
      // If user is not authenticated send failed message to the client
      throw 'User not authenticated!'
    }

    // Validate request body using using Joi @common/validators.ts
    const { error } = userUpdateValidator.validate(ctx.request.body)
    // If request body is invalid throw error
    if (error) {
      throw 'Invalid request body!'
    }
    // Destructure request body
    const { name, email, username, password } = ctx.request.body as UserInfo
    // If user input is the same as the current user info throw error
    // or if there is no user input
    if (
      name === ctx.state.user.name ||
      email === ctx.state.user.email ||
      username === ctx.state.user.username ||
      (!name && !email && !username && !password)
    ) {
      throw 'No changes were made!'
    }
    // Check if user is trying to update email or username that is already in use
    const userExists = await prisma.user.findFirst({
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

    if (userExists) {
      throw 'Email or username already in use!'
    }

    // Update user in database
    await prisma.user.update({
      where: {
        id: ctx.state.user.id,
      },
      data: {
        name: name,
        email: email,
        username: username,
        password: password && (await hashPassword(password)),
      },
    })
    // Send success message to the client
    ctx.body = {
      success: true,
      message: 'Successfully updated user',
    }
  } catch (err) {
    // Send error message to the client
    ctx.body = {
      success: false,
      message: err,
    }
  }

  await next()
})

/*
  * Delete user
  @DELETE /auth/user/me

*/
_.delete(API_PATH, async (ctx, next) => {
  // Allow only authenticated users to access this route
  if (!ctx.isAuthenticated()) {
    ctx.redirect('/failed/auth')
    return
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: ctx.state.user.id,
      },
    })

    // If user doesn't exist send error message to the client
    if (!user) {
      throw "Couldn't find user"
    }

    // Check if user has a profile
    const hasProfile = await prisma.profile.findUnique({
      where: {
        userId: ctx.state.user.id,
      },
    })

    // Delete user profile from the database if it exists
    if (hasProfile) {
      await prisma.profile.delete({
        where: {
          userId: ctx.state.user.id,
        },
      })
    }

    // Delete user from the database including their posts and profile
    await prisma.user.delete({
      where: {
        id: ctx.state.user.id,
      },
    })

    // Log user out of the session
    ctx.logout()
    // Send success message to the client
    ctx.body = {
      success: true,
      message: 'Successfully deleted account',
    }
  } catch (err) {
    // If something went wrong send error message to the client
    ctx.body = {
      success: false,
      message: err,
    }
  }

  await next()
})

export default _.routes()

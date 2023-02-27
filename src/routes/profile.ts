import Router from 'koa-router'
import { ProfileTypes } from '@common/types/ProfileTypes'
import { prisma, profileValidator } from '@common/index'

const _ = new Router()

/*
  * Create a profile route
  @POST /account/profile

  @body bio: string?

*/
_.post('/account/profile', async (ctx, next) => {
  try {
    if (ctx.isAuthenticated()) {
      // Validate request body using using Joi @common/validators.ts
      const { error } = profileValidator.validate(ctx.request.body)
      if (error) {
        throw 'Please ensure all required fields are filled in with valid data. If issues persist, contact support.'
      }
      // Extract profile info from request body
      const { bio } = ctx.request.body as ProfileTypes
      // Create a new profile
      await prisma.profile.create({
        data: {
          bio: bio,
          userId: ctx.state.user.id,
        },
      })
      // Send success message to the client
      ctx.body = {
        success: true,
        message: 'Your profile has been created!',
      }
    } else {
      throw "Uh oh, that didn't work!"
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
  * Update a profile route
  @PUT /account/profile

  @body bio: string

*/
_.put('/account/profile', async (ctx, next) => {
  // Allow only authenticated users to access this route
  if (!ctx.isAuthenticated()) {
    ctx.redirect('/failed/auth')
    return
  }

  try {
    // Validate request body using using Joi @common/validators.ts
    const { error } = profileValidator.validate(ctx.request.body)
    if (error) {
      throw 'Please ensure all required fields are filled in with valid data. If issues persist, contact support.'
    }

    // Extract profile info from request body
    const { bio } = ctx.request.body as ProfileTypes
    // Find user profile
    const profile = await prisma.profile.findUnique({
      where: {
        userId: ctx.state.user.id,
      },
    })

    // If profile doesn't exist send error message to the client
    if (!profile) {
      throw "Couldn't find profile"
    }

    // Update profile in the database
    await prisma.profile.update({
      where: {
        id: profile.id,
      },
      data: {
        bio: bio,
      },
    })

    // Send success message to the client
    ctx.body = {
      success: true,
      message: 'Successfully updated profile',
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
  * Delete account route
  @DELETE /account/profile

*/
_.delete('/account/profile', async (ctx, next) => {
  // Allow only authenticated users to access this route
  if (!ctx.isAuthenticated()) {
    ctx.redirect('/failed/auth')
    return
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: {
        userId: ctx.state.user.id,
      },
    })

    // If user doesn't exist send error message to the client
    if (!profile) {
      throw "Couldn't find profile"
    }

    // Delete user from the database including their posts and profile
    await prisma.profile.delete({
      where: {
        id: profile.id,
      },
    })

    // Send success message to the client
    ctx.body = {
      success: true,
      message: 'Successfully deleted profile',
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

export default _

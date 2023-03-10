import slugify from 'slugify'
import Router from 'koa-router'

import prisma from '@common/db'
import { UserInfo, PostTypes } from '@common/types/UserTypes'
import { userUpdateValidator, hashPassword, postValidator } from '@common/index'

const _ = new Router()
// API ENDPOINTS
const API_PATH = '/auth/user/me'

/*
  * Get user info
  @GET /auth/user/me

  @body name: string
  @body email: string
  @body bio: string
  @body posts: Post[]

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
        include: {
          profile: true,
          posts: true,
        },
      })

      // Remove password from user object before sending it to the client
      if (user) {
        // Send user object to the client
        ctx.body = {
          success: true,
          message: 'OK',
          user: {
            name: user.name,
            profile: {
              bio: user.profile?.bio,
            },
            posts: user.posts,
          },
        }
      }
    } else {
      // If user is not authenticated send failed message to the client
      throw new Error()
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: 'Failed to get user',
    }
  }

  await next()
})

/*
  * Update user info
  @PUT /auth/user/me

  @body name: string
  @body email: string
  @body password: string
  @body bio: string

*/
_.put(API_PATH, async (ctx, next) => {
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

    // Delete user profile from the database
    await prisma.profile.delete({
      where: {
        userId: ctx.state.user.id,
      },
    })

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

/*
    * Create a post
    @POST /auth/user/post/me

    @body title: string
    @body content: string
*/

const PATH = '/auth/user/post/me'
_.post(PATH, async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    // If user does not have a profile send error message to the client
    const userProfile = await prisma.profile.findUnique({
      where: {
        userId: ctx.state.user.id,
      },
    })

    if (!userProfile) {
      ctx.body = {
        success: false,
        message: 'You need to create a profile before you can create a post!',
      }
      return
    }
    // If user is authenticated and has a profile continue with the request
    try {
      // Validate request body
      const { error } = postValidator.validate(ctx.request.body)

      if (error) {
        throw 'Invalid request body!'
      }
      // Destructure request body
      const { title, content } = ctx.request.body as PostTypes
      // Create post in database
      await prisma.post.create({
        data: {
          slug: slugify(title, {
            lower: true,
            strict: true,
          }),
          title: title,
          content: content,
          published: true,
          authorId: ctx.state.user.id,
        },
      })

      // Send success message to the client
      ctx.body = {
        success: true,
        message: 'Successfully created post',
      }
    } catch (err) {
      ctx.body = {
        success: false,
        message: err,
      }
    }
  } else {
    ctx.body = {
      success: false,
      message: "Uh oh, that didn't work!",
    }
  }
  await next()
})

/* 
    * GET a single post
    @GET user/post/:slug

*/
_.get('/user/post/:slug', async (ctx, next) => {
  try {
    // Look for the post
    const post = await prisma.post.findUnique({
      where: {
        slug: ctx.params.slug,
      },
    })
    // If post does not exist send error message to the client
    if (!post) {
      throw "Couldn't find post"
    }

    // Send post to the client
    ctx.body = {
      success: true,
      data: post,
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
    * Update a post
   
   @body title: string
   @body content: string

*/
_.put(`${PATH}/:slug`, async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    try {
      const { slug } = ctx.params
      const post = await prisma.post.findUnique({
        where: {
          slug: slug,
        },
      })
      // If post exists and the user is the author of the post continue with the request
      if (post && ctx.state.user.id === post.authorId) {
        // Validate request body
        const { error } = postValidator.validate(ctx.request.body)
        if (error) {
          throw 'Invalid request body!'
        }
        // Destructure request body
        const { title, content } = ctx.request.body as PostTypes
        // Update post in database
        await prisma.post.update({
          where: {
            slug: slug,
          },
          data: {
            slug: slugify(title, {
              lower: true,
              strict: true,
            }),
            title: title,
            content: content,
          },
        })
        // Send success message to the client
        ctx.body = {
          success: true,
          message: 'Successfully updated post',
        }
      } else {
        // If post doesn't exist or the user is not the author of the post send error message to the client
        ctx.body = {
          success: false,
          message: 'Post not found!',
        }
      }
    } catch (err) {
      ctx.body = {
        success: false,
        message: err,
      }
    }
  }

  await next()
})

/*
  * Delete a post
  @DELETE /auth/user/post/me/:id

  @param slug: string
*/
_.delete(`${PATH}/:slug`, async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    try {
      const { slug } = ctx.params

      // Find post in database by slug
      const post = await prisma.post.findUnique({
        where: {
          slug: slug,
        },
      })

      if (!post) {
        throw 'Post not found!'
      } else if (post.authorId !== ctx.state.user.id) {
        // If author of the post is not the current user throw an error
        throw 'You are not authorized to delete this post!'
      } else {
        await prisma.post.delete({
          where: {
            id: post.id,
          },
        })
      }
      // Send success message to the client
      ctx.body = {
        success: true,
        message: 'Successfully deleted post',
      }
    } catch (err) {
      ctx.body = {
        success: false,
        message: 'Something went wrong!',
      }
    }
  }
  await next()
})

export default _.routes()

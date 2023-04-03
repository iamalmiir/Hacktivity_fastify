import Router from 'koa-router'
import slugify from 'slugify'

import prisma from '@common/db'
import { postValidator } from '@utils/index'
import { PostTypes } from '@common/types/UserTypes'

const _ = new Router()
const API_PATH = '/auth/user/post/me'
const LIKE_API_PATH = '/auth/user/post/like/:slug'

/*
    * Create a post
    @POST /auth/user/post/me

    @body title: string
    @body content: string

*/
_.post(API_PATH, async (ctx, next) => {
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
      let slug = slugify(title, {
        lower: true,
        strict: true,
      })

      let counter = 0
      // Check if slug already exists
      while (await prisma.post.findUnique({ where: { slug: slug } })) {
        slug = slugify(title + counter, {
          lower: true,
          strict: true,
        })
        counter++
      }

      // Create post in database
      await prisma.post.create({
        data: {
          slug: slug,
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
      * Update a post
     
     @body title: string
     @body content: string
  
  */
_.patch(`${API_PATH}/:slug`, async (ctx, next) => {
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
_.delete(`${API_PATH}/:slug`, async (ctx, next) => {
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
        message: err,
      }
    }
  }
  await next()
})

/*
    * Like a post
   
    @param slug: string

*/
_.post(`${LIKE_API_PATH}`, async (ctx, next) => {
  // If user is authenticated continue with the request
  if (ctx.isAuthenticated()) {
    try {
      // Find post in database by slug
      const post = await prisma.post.findUnique({
        where: {
          slug: ctx.params.slug,
        },
      })

      if (!post) {
        throw 'Post not found!'
      }

      // Check if user has already liked the post
      const likedPost = await prisma.post.findFirst({
        where: {
          id: post.id,
          likes: {
            some: {
              id: ctx.state.user.id,
            },
          },
        },
      })

      if (likedPost) {
        throw 'You have already liked this post!'
      }

      /*
       TODO: Check if user has already liked the post
       TODO: If user has already liked the post throw an error
       TODO: If user has not liked the post create a like in the database
       */

      // Send success message to the client
      ctx.body = {
        success: true,
        message: 'Successfully liked post',
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
  * Remove the like
 
  @param slug: string

*/
_.delete(`${LIKE_API_PATH}`, async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    try {
      // Find post in database by slug
      const post = await prisma.post.findUnique({
        where: {
          slug: ctx.params.slug,
        },
      })

      if (!post) {
        throw 'Post not found!'
      }

      // Delete like in database
      const like = await prisma.like.findFirst({
        where: {
          postId: post.id,
          userId: ctx.state.user.id,
        },
      })

      if (!like) {
        throw 'Like not found!'
      }

      await prisma.like.delete({
        where: {
          id: like.id,
        },
      })

      // Send success message to the client
      ctx.body = {
        success: true,
        message: 'Successfully unliked post',
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

export default _.routes()

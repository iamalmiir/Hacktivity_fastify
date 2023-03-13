import Router from 'koa-router'

import prisma from '@common/db'
import { exclude, excludeArray } from '@utils/exclude'

const _ = new Router()
const API_PATH = '/api/post'

/*
    * GET all posts
    @GET api/post


*/
_.get(`${API_PATH}/all`, async (ctx, next) => {
  try {
    // Get all posts
    // TODO - Include comments
    const allPosts = await prisma.post.findMany({
      where: {
        published: true,
      },
      include: {
        likes: true, // Include likes
      },
    })
    // If no posts are found, throw an error
    if (!allPosts) {
      throw "Couldn't find any posts, please check back later!"
    }

    // Send all posts to the client
    ctx.body = {
      success: true,
      data: excludeArray(allPosts, [
        'id',
        'published',
        'createdAt',
        'updatedAt',
        'authorId',
      ]),
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
    * GET a single post
    @GET api/post/:slug

*/
_.get(`${API_PATH}/single/:slug`, async (ctx, next) => {
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
      data: exclude(post, [
        'id',
        'published',
        'authorId',
        'createdAt',
        'updatedAt',
      ]),
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err,
    }
  }

  await next()
})

export default _.routes()

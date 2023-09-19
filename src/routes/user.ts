import { FastifyInstance } from 'fastify'
import { createUserValidator } from '@utils/validators'
import prisma from '@config/db'
import { comparePassword, hashPassword } from '@utils/hashing'

interface UserInfo {
  id: string
  username: string
  email: string
  password: string
  name: string
}

const userRoutes = async (app: FastifyInstance) => {
  /**
   * @api {post} /api/v1/user/create Create a new user
   * @apiName CreateUser
   * @apiGroup User
   * @apiVersion 1.0.0
   * @apiParam {String} name User's name
   * @apiParam {String} username User's username
   * @apiParam {String} email User's email
   * @apiParam {String} password User's password
   */

  app.post('/create', async (req, reply) => {
    try {
      const { error } = createUserValidator.validate(req.body)
      if (error) {
        throw 'Please ensure all required fields are filled in with valid data. If issues persist, contact support.'
      }
      const { name, email, password } = req.body as UserInfo

      let userExists = await prisma.user.findFirst({
        where: {
          email: email,
        },
      })
      if (userExists) {
        throw 'Username or email is already taken.'
      }

      await prisma.user.create({
        data: {
          name: name,
          email: email,
          password: await hashPassword(password),
        },
      })

      reply.status(201).send({
        message: 'User created successfully.',
        success: true,
        status: 'OK',
      })
    } catch (err) {
      reply.status(400).send({
        message: err,
        success: false,
        status: 'ERROR',
      })
    }
  })

  /**
   * @api {post} /api/v1/user/login Login a user
   * @apiName LoginUser
   * @apiGroup User
   * @apiVersion 1.0.0
   * @apiParam {String} username User's username
   * @apiParam {String} password User's password
   */

  app.post('/login', async (req, reply) => {
    try {
      const { email, password } = req.body as UserInfo
      const user = await prisma.user.findFirstOrThrow({
        where: {
          email: email,
        },
      })
      if (user.password) {
        const validPassword = await comparePassword(password, user.password)

        if (!validPassword) {
          throw 'Invalid username or password.'
        }
      }

      reply.status(200).send({
        message: 'User logged in successfully.',
        success: true,
        status: 'OK',
        user: {
          name: user.name,
          email: user.email,
        },
      })
    } catch (err) {
      reply.status(400).send({
        message: err,
        success: false,
        status: 'ERROR',
      })
    }
  })
}

export default userRoutes

import passport from 'koa-passport'
import prisma from '@common/db'
import { Strategy as LocalStrategy } from 'passport-local'
import { comparePassword } from '@common/encrypt'

passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    })

    if (!user) {
      return done(null, false)
    }

    return done(null, user)
  } catch (error) {
    return done(error)
  }
})

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        })

        if (!user) {
          return done(null, false, { message: 'Incorrect email.' })
        }

        if (!(await comparePassword(password, user.password))) {
          return done(null, false, { message: 'Incorrect password.' })
        }

        return done(null, user)
      } catch (error) {
        return done(error)
      }
    }
  )
)

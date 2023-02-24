import passport from 'koa-passport'
import prisma from '@common/db'
import { Strategy as LocalStrategy } from 'passport-local'
import { comparePassword } from '@common/encrypt'

// Serialize user
passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

// Deserialize user
passport.deserializeUser(async (id: string, done) => {
  try {
    // Find user in database
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    })

    // If user not found, return false
    if (!user) {
      return done(null, false)
    }
    // If user found, return user
    return done(null, user)
  } catch (error) {
    return done(error)
  }
})

// Local Strategy
passport.use(
  new LocalStrategy(
    {
      // Set username field to email or username
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, done) => {
      try {
        // Find user in database by email
        const user = await prisma.user.findUnique({
          where: {
            username,
          },
        })

        // If user not found, return false along with error message
        if (!user) {
          return done(null, false, {
            message: "Uh oh, that did't work! Please check your info.",
          })
        }
        // If user found, compare password with hashed password
        if (!(await comparePassword(password, user.password))) {
          return done(null, false, {
            message: "Uh oh, that did't work! Please check your info.",
          })
        }

        // If password matches, return user
        return done(null, user)
      } catch (error) {
        // If error, return error
        return done(error, false, {
          message: "Uh oh, that did't work! Please check your info.",
        })
      }
    }
  )
)

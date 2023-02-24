import 'dotenv/config'

// Koa server
import Koa from 'koa'
const app = new Koa()

// Body parser
import bodyParser from 'koa-bodyparser'
app.use(bodyParser())

// Session
import { CONFIG } from '@common/constants'
app.keys = [CONFIG.keys]
import session from 'koa-session'
app.use(session(CONFIG, app))

// Passport authentication
import passport from 'koa-passport'
import './config/localAuthStrategy'
app.use(passport.initialize())
app.use(passport.session())

// Routes from @routes
import auth from '@routes/auth'
import userRoutes from '@routes/user'
import accountRoutes from '@routes/account'
app.use(auth.routes())
app.use(userRoutes.routes())
app.use(accountRoutes.routes())

// Run the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

import 'dotenv/config'

// Koa server
import * as Koa from 'koa'
const app = new Koa()

// Body parser
import * as bodyParser from 'koa-bodyparser'
app.use(bodyParser())

// Session
import { CONFIG } from '@common/constants'
app.keys = [CONFIG.keys]
import * as session from 'koa-session'
app.use(session(CONFIG, app))

// Passport authentication
import * as passport from 'koa-passport'
app.use(passport.initialize())
app.use(passport.session())

// Routes from @routes
import HomeRoutes from '@routes/index'
app.use(HomeRoutes.routes())

// Run the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

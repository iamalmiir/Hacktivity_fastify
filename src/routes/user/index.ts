import Router from 'koa-router'

const router = new Router()

router.use(require('./auth').default)
router.use(require('./post').default)
router.use(require('./user').default)
router.use(require('./profile').default)

export default router.routes()

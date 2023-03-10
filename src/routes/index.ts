import Router from 'koa-router'

const router = new Router()

router.use(require('./account').default)
router.use(require('./auth').default)
router.use(require('./profile').default)
router.use(require('./user').default)

export default router

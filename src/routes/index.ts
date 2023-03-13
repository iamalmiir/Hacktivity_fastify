import Router from 'koa-router'

const router = new Router()

router.use(require('./user/index').default)
router.use(require('./post').default)

export default router

import 'dotenv/config'
import buildServer from './server'
const server = buildServer()

const main = async () => {
  try {
    const PORT = parseInt(process.env.PORT ?? '8080', 10)
    await server.listen({ port: PORT })
    console.log(`Server is running on port ${PORT}`)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()

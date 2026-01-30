import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const schemaPath = process.env.PRISMA_SCHEMA || 'prisma/schema.prisma'
const dbUrlVar = process.env.PRISMA_DB_URL_VAR || 'DATABASE_URL_USERS'

export default defineConfig({
    schema: schemaPath,
    datasource: {
        url: env(dbUrlVar as any),
    },
})

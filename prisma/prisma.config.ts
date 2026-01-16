import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './schema.prisma',
  database: {
    adapter: 'sqlite3',
    url: 'file:./dev.db'
  }
})
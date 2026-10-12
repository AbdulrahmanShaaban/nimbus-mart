import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

let client: PrismaClient | null = null

export function useDb(): PrismaClient {
  if (!client) {
    const connectionString =
      process.env.DATABASE_URL ||
      useRuntimeConfig().databaseUrl
    const adapter = new PrismaPg({ connectionString })
    client = new PrismaClient({ adapter })
  }
  return client
}

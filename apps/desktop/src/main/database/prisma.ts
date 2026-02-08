import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import { join } from 'path'

let prisma: PrismaClient | null = null

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const dbPath = join(app.getPath('userData'), 'finterm.db')
    process.env.DATABASE_URL = `file:${dbPath}`

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`,
        },
      },
    })

    console.log('[Database] Initialized Prisma client, DB at:', dbPath)
  }
  return prisma
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
    console.log('[Database] Prisma client disconnected')
  }
}

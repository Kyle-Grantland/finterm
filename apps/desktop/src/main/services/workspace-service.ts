import { getPrismaClient } from '../database/prisma'

class WorkspaceService {
  // Layouts
  async saveLayout(userId: string, name: string, layoutData: string) {
    const prisma = getPrismaClient()
    return prisma.workspaceLayout.upsert({
      where: {
        id: `${userId}-${name}`,
      },
      update: {
        layoutData,
        updatedAt: new Date(),
      },
      create: {
        id: `${userId}-${name}`,
        userId,
        name,
        layoutData,
      },
    })
  }

  async getLayout(layoutId: string) {
    const prisma = getPrismaClient()
    return prisma.workspaceLayout.findUnique({ where: { id: layoutId } })
  }

  async getDefaultLayout(userId: string) {
    const prisma = getPrismaClient()
    return prisma.workspaceLayout.findFirst({
      where: { userId, isDefault: true },
    })
  }

  async listLayouts(userId: string) {
    const prisma = getPrismaClient()
    return prisma.workspaceLayout.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async deleteLayout(layoutId: string) {
    const prisma = getPrismaClient()
    return prisma.workspaceLayout.delete({ where: { id: layoutId } })
  }

  async setDefaultLayout(userId: string, layoutId: string) {
    const prisma = getPrismaClient()
    // Unset all defaults for this user
    await prisma.workspaceLayout.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    })
    // Set the new default
    await prisma.workspaceLayout.update({
      where: { id: layoutId },
      data: { isDefault: true },
    })
  }

  // Watchlists
  async listWatchlists(userId: string) {
    const prisma = getPrismaClient()
    return prisma.watchlist.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async createWatchlist(userId: string, name: string) {
    const prisma = getPrismaClient()
    return prisma.watchlist.create({
      data: { userId, name },
      include: { items: true },
    })
  }

  async addWatchlistItem(watchlistId: string, symbol: string, name: string) {
    const prisma = getPrismaClient()
    return prisma.watchlistItem.create({
      data: { watchlistId, symbol, name },
    })
  }

  async removeWatchlistItem(watchlistId: string, symbol: string) {
    const prisma = getPrismaClient()
    return prisma.watchlistItem.deleteMany({
      where: { watchlistId, symbol },
    })
  }
}

let instance: WorkspaceService | null = null

export function getWorkspaceService(): WorkspaceService {
  if (!instance) {
    instance = new WorkspaceService()
  }
  return instance
}

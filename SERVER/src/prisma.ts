import { PrismaClient } from "@prisma/client";
import { roleDefaultAvatarUrl } from "./utils/defaultAvatarHelper";

// MARK: Middleware
const userMiddleware = {
  user: {
    async create({ args, query }) {
      if (!args.data.avatarUrl && args.data.role) {
        args.data.avatarUrl = roleDefaultAvatarUrl(args.data.role);
      }
      return query(args);
    },
    async findUnique({ args, query }) {
      const result = await query(args);
      if (result && result.role) {
        const hasNoAvatar = result.avatarUrl === null || result.avatarUrl === undefined || result.avatarUrl === '';

        if (hasNoAvatar) {
          result.avatarUrl = roleDefaultAvatarUrl(result.role);
        }
      }
      return result;
    },
    async findMany({ args, query }) {
      const results = await query(args);
      return results.map(user => {
        if (user.role) {
          const hasNoAvatar = user.avatarUrl === null || user.avatarUrl === undefined || user.avatarUrl === '';

          if (hasNoAvatar) {
            user.avatarUrl = roleDefaultAvatarUrl(user.role);
          }
        }
        return user;
      });
    },
  },
};

// MARK: Prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const extendedPrisma = new PrismaClient({
  log: ['query'],
  omit: {
    user: { password: true },
  },
}).$extends({
  query: {
    ...userMiddleware,
  },
});

const prisma = (globalForPrisma.prisma ?? extendedPrisma) as PrismaClient;

export default prisma;
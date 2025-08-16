import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as {
  prismaGlobal?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = prisma;
}



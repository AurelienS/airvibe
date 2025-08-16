import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// @ts-expect-error NextAuth typing can appear non-callable under bundler moduleResolution
export const { handlers, signIn, signOut, auth } = NextAuth(async () => {
  const isEdge = typeof (globalThis as Record<string, unknown>).EdgeRuntime !== "undefined";
  const base = {
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    callbacks: {
      async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
        try {
          const target = new URL(url, baseUrl);
          if (target.origin === baseUrl) return "/home";
          return baseUrl;
        } catch {
          return "/home";
        }
      },
    },
  } as const;

  if (isEdge) {
    return {
      ...base,
      session: { strategy: "jwt" as const },
    };
  }

  const [{ PrismaAdapter }, { prisma }] = await Promise.all([
    import("@auth/prisma-adapter"),
    import("@/lib/db"),
  ]);

  return {
    ...base,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" as const },
  };
});



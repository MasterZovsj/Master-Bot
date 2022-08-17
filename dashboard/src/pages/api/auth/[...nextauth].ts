import NextAuth, { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { env } from "../../../env/server.mjs";

export const authOptions: NextAuthOptions = {
  jwt: {
    maxAge: 60 * 60 * 24 * 30,
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.userId;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  // Configure one or more authentication providers
  providers: [
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
    // ...add more providers here
  ],
};

export default NextAuth(authOptions);

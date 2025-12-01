import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/drive.file"
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account }) {
      return true;
    },
    async session({ session, token }) {
        // Pass the refresh token to the client session
        session.refreshToken = token.refreshToken; 
        return session;
    },
    async jwt({ token, account }) {
        if (account?.refresh_token) {
            token.refreshToken = account.refresh_token;
        }
        return token;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
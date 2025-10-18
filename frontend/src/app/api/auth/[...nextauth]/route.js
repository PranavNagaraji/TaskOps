import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  // It links directly to NEXTAUTH_SECRET
  // in .env.local and prevents configuration errors and server crashes.
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          const user = await res.json();

          if (res.ok && user) {
            return user; // user object from backend
          }
          return null;
        } catch (err) {
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: { signIn: "/auth/signin" },

  callbacks: {
    // 🚀 JWT AND SESSION CALLBACKS
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }
      console.log("Token:", token);
      return token;
    },
    async session({ session, token }) {
      // We pass the data from the token to the session object,
      // which is then available on the client side.
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
      }
      console.log("Session: ", session);
      return session;
    },
  },
};
// console.log("NEXTAUTH_SECRET loaded:", process.env.NEXTAUTH_SECRET ? "✅ Yes" : "❌ No");
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
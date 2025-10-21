import NextAuth, {type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";


export const authOptions: NextAuthOptions = {
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET, // v4는 NEXTAUTH_SECRET 권장
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = credentials?.email ?? "";
          const password = credentials?.password ?? "";
  
          // 임시 규칙 (비밀번호: test1234)
          if (email && password === "test1234") {
            return {
              id: "test-user",
              email,
              name: "Test User",
            };
          }
          return null;
        },
      }),
      // GitHubProvider({
      //   clientId: process.env.GITHUB_ID!,
      //   clientSecret: process.env.GITHUB_SECRET!,
      // }),
    ],
    // 필요시 callbacks, pages 등 추가
    // callbacks: { async jwt(...) { ... }, async session(...) { ... } }
  };
  
  // v4에서는 이렇게 handler를 만들어서 GET/POST로 재수출합니다.
  const handler = NextAuth(authOptions);
  export { handler as GET, handler as POST };
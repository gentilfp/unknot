import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import { Resend } from "resend";

const resend = new Resend(process.env.AUTH_RESEND_KEY);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    EmailProvider({
      server: { host: "", port: 0, auth: { user: "", pass: "" } },
      from: "Unknot <onboarding@resend.dev>",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await resend.emails.send({
          from: "Unknot <onboarding@resend.dev>",
          to: email,
          subject: "Sign in to Unknot",
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #111;">Sign in to Unknot</h2>
              <p style="color: #555;">Click the button below to sign in to your account.</p>
              <a href="${url}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
                Sign in
              </a>
              <p style="color: #999; font-size: 12px; margin-top: 24px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=true",
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
});

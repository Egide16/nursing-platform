import { DefaultSession } from "next-auth";

type AppRole = "SUPER_ADMIN" | "INSPECTOR" | "COMPANY_ADMIN" | "STUDENT";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      companyId?: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role: AppRole;
    companyId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    companyId?: string | null;
  }
}

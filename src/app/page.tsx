import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  switch (session.user.role) {
    case "STUDENT":
      redirect("/dashboard");
    case "COMPANY_ADMIN":
      redirect("/company");
    default:
      redirect("/admin");
  }
}

import NavBar from "@/components/NavBar";
import { requireRole } from "@/lib/permissions";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["STUDENT"]);
  return (
    <div>
      <NavBar label="Student" links={[{ href: "/dashboard", text: "My training" }]} />
      {children}
    </div>
  );
}

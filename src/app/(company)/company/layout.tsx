import NavBar from "@/components/NavBar";
import { requireRole } from "@/lib/permissions";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["COMPANY_ADMIN"]);
  return (
    <div>
      <NavBar
        label="Company"
        links={[
          { href: "/company", text: "Overview" },
          { href: "/company/group-homes/new", text: "Add group home" },
          { href: "/company/students/new", text: "Add student" },
        ]}
      />
      {children}
    </div>
  );
}

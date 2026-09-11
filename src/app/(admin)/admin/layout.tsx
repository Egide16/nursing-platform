import NavBar from "@/components/NavBar";
import { requireRole } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["SUPER_ADMIN", "INSPECTOR"]);
  return (
    <div>
      <NavBar
        label="Admin"
        links={[
          { href: "/admin", text: "Overview" },
          { href: "/admin/companies", text: "Companies" },
          { href: "/admin/inspections", text: "Inspections" },
        ]}
      />
      {children}
    </div>
  );
}

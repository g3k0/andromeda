import type { ReactNode } from "react";
import { AdminManageTabs } from "@/components/admin/AdminManageTabs";

export default function AdminManageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <AdminManageTabs />
      {children}
    </div>
  );
}

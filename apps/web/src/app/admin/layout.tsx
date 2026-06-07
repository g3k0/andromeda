import type { ReactNode } from "react";
import { RouteGuard } from "@/components/navigation/RouteGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RouteGuard routeId="admin">{children}</RouteGuard>;
}

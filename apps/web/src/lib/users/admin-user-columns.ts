export type AdminUserColumnId = "address" | "role" | "status" | "createdAt";

export type AdminUserColumnDef = {
  id: AdminUserColumnId;
  label: string;
  editable: boolean;
};

export const USER_ADMIN_COLUMNS: AdminUserColumnDef[] = [
  { id: "address", label: "Address", editable: false },
  { id: "role", label: "Role", editable: true },
  { id: "status", label: "Status", editable: true },
  { id: "createdAt", label: "Created", editable: false },
];

export function getEditableAdminUserColumnIds(): AdminUserColumnId[] {
  return USER_ADMIN_COLUMNS.filter((column) => column.editable).map(
    (column) => column.id,
  );
}

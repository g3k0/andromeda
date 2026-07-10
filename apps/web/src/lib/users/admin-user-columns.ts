export type AdminUserColumnId = "address" | "role" | "status" | "createdAt";

export type AdminUserColumnDef = {
  id: AdminUserColumnId;
  label: string;
  editable: boolean;
};

export function getEditableAdminUserColumnIds(
  columns: readonly AdminUserColumnDef[],
): AdminUserColumnId[] {
  return columns.filter((column) => column.editable).map((column) => column.id);
}

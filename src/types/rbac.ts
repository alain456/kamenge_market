export type PermissionAction = "read" | "create" | "update" | "delete" | "validate";

export type PermissionScope = "all" | "own_records" | "assigned_area" | "own_collections";

export type Domain = 
  | "commerce"
  | "espaces"
  | "finances"
  | "rh"
  | "infrastructures"
  | "securite"
  | "documents"
  | "plaintes";

export interface Permission {
  id: string; // Format: domain.action
  domain: Domain;
  action: PermissionAction;
  label: string;
  scope: PermissionScope;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[]; // Array of permission IDs
}

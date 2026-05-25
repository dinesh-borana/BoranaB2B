export const ALL_PERMISSIONS = [
  { key: "add_product",    label: "Add / edit products" },
  { key: "delete_product", label: "Delete products" },
  { key: "delete_party",   label: "Delete parties" },
  { key: "manage_orders",  label: "Manage orders" },
  { key: "place_order",    label: "Place order on behalf of party" },
  { key: "all",            label: "All powers (super admin)" },
] as const;

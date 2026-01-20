export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL;

// Roles
export const ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
};

// Default pagination
export const DEFAULT_PAGE_SIZE = 10;

// Menu dùng cho Sidebar
export const ADMIN_MENU = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Categories", href: "/categories" },
  { label: "Products", href: "/products" },
  { label: "Orders", href: "/orders" },
  { label: "Users", href: "/users" },
  { label: "Banners", href: "/banners" },
];

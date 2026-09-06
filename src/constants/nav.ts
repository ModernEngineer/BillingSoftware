import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Boxes,
  Users,
  Handshake,
  Contact,
  UsersRound,
  Factory,
  Wallet,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  module: string;
  href?: string;
  tourId?: string;
  children?: NavLink[];
}

export const NAV_GROUPS: NavGroup[] = [
  { label: "Dashboard", icon: LayoutDashboard, module: "DASHBOARD", href: "/dashboard", tourId: "nav-dashboard" },
  {
    label: "Sales",
    icon: ShoppingCart,
    module: "SALES",
    tourId: "nav-sales",
    children: [
      { label: "New Invoice", href: "/sales/new" },
      { label: "Sales History", href: "/sales/invoices" },
      { label: "Sales Return", href: "/sales/returns" },
    ],
  },
  {
    label: "Purchase",
    icon: Truck,
    module: "PURCHASE",
    tourId: "nav-purchase",
    children: [
      { label: "New Purchase", href: "/purchase/new" },
      { label: "Purchase History", href: "/purchase/invoices" },
      { label: "Purchase Return", href: "/purchase/returns" },
    ],
  },
  {
    label: "Products",
    icon: Package,
    module: "PRODUCTS",
    tourId: "nav-products",
    children: [
      { label: "Product List", href: "/products" },
      { label: "Categories", href: "/products/categories" },
      { label: "Units", href: "/products/units" },
    ],
  },
  {
    label: "Inventory",
    icon: Boxes,
    module: "INVENTORY",
    tourId: "nav-inventory",
    children: [
      { label: "Current Stock", href: "/inventory/stock" },
      { label: "Stock Adjustment", href: "/inventory/adjustment" },
      { label: "Stock History", href: "/inventory/history" },
      { label: "Low Stock", href: "/inventory/low-stock" },
    ],
  },
  { label: "Customers", icon: Users, module: "CUSTOMERS", href: "/customers" },
  { label: "Suppliers", icon: Handshake, module: "SUPPLIERS", href: "/suppliers" },
  { label: "CRM", icon: Contact, module: "CRM", href: "/crm/leads" },
  {
    label: "HR & Payroll",
    icon: UsersRound,
    module: "HR",
    children: [
      { label: "Employees", href: "/hr/employees" },
      { label: "Attendance", href: "/hr/attendance" },
      { label: "Payroll", href: "/hr/payroll" },
    ],
  },
  {
    label: "Manufacturing",
    icon: Factory,
    module: "MANUFACTURING",
    children: [
      { label: "Bill of Materials", href: "/manufacturing/bom" },
      { label: "Production Orders", href: "/manufacturing/production-orders" },
    ],
  },
  { label: "Expenses", icon: Wallet, module: "EXPENSES", href: "/expenses" },
  { label: "Payments", icon: CreditCard, module: "PAYMENTS", href: "/payments" },
  {
    label: "Reports",
    icon: BarChart3,
    module: "REPORTS",
    tourId: "nav-reports",
    children: [
      { label: "Sales Report", href: "/reports/sales" },
      { label: "Purchase Report", href: "/reports/purchase" },
      { label: "Profit Report", href: "/reports/profit" },
      { label: "Stock Report", href: "/reports/stock" },
      { label: "GST Report", href: "/reports/gst" },
      { label: "Customer Report", href: "/reports/customer" },
      { label: "Supplier Report", href: "/reports/supplier" },
      { label: "Payment Report", href: "/reports/payment" },
      { label: "Expense Report", href: "/reports/expense" },
    ],
  },
  {
    label: "Users & Roles",
    icon: ShieldCheck,
    module: "USERS",
    children: [
      { label: "Users", href: "/users" },
      { label: "Roles & Permissions", href: "/roles" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    module: "SETTINGS",
    children: [
      { label: "Business Profile", href: "/settings/business" },
      { label: "Invoice Settings", href: "/settings/invoice" },
      { label: "Number Series", href: "/settings/number-series" },
      { label: "Import Data", href: "/settings/import" },
      { label: "Backup", href: "/settings/backup" },
    ],
  },
];

import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Package as PackageIcon, Users, FileText, Printer, MapPin, ClipboardList, BookOpen, Home, Inbox, Phone, ListChecks, Presentation, UserPlus, Briefcase, Component, ShoppingCart, BarChart3, User } from 'lucide-react';

export const GOOGLE_MAPS_API_KEY_PLACEHOLDER = "YOUR_GOOGLE_MAPS_API_KEY";

// M-PESA DARAJA API CONFIGURATION
export const MPESA_CONFIG = {
  CONSUMER_KEY: "YOUR_CONSUMER_KEY",
  CONSUMER_SECRET: "YOUR_CONSUMER_SECRET",
  BUSINESS_SHORTCODE: "174379", 
  PASSKEY: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  CALLBACK_URL: "https://your-domain.com/api/mpesa/callback",
};

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'Point of Sale', icon: ShoppingCart },
  { href: '/stock', label: 'Laptops', icon: PackageIcon },
  { href: '/accessories', label: 'Accessories', icon: Component },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/leases', label: 'Leases', icon: FileText },
  { href: '/documents', label: 'Documents', icon: Printer },
  { href: '/tracking', label: 'Tracking', icon: MapPin },
  { href: '/crm', label: 'CRM', icon: ClipboardList },
  { href: '/books', label: 'Books', icon: BookOpen },
  { href: '/inventory', label: 'Inventory', icon: Home },
  { href: '/desk', label: 'Desk', icon: Inbox },
  { href: '/salesiq', label: 'SalesIQ', icon: Phone },
  { href: '/projects', label: 'Projects', icon: ListChecks },
  { href: '/campaigns', label: 'Campaigns', icon: Presentation },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/users', label: 'Users', icon: UserPlus },
  { href: '/resellers', label: 'Resellers', icon: Briefcase },
  { href: '/recruit', label: 'Recruit', icon: Briefcase },
  { href: '/profile', label: 'Profile', icon: User },
];

export const APP_NAME = "Professional ERP Suite";

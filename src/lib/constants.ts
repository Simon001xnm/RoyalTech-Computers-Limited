
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Package as PackageIcon, Users, Printer, MapPin, ClipboardList, BookOpen, Inbox, Phone, ListChecks, Presentation, UserPlus, BarChart3, User, ShieldCheck, History, ShoppingCart } from 'lucide-react';

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
  { href: '/stock', label: 'Asset Inventory', icon: PackageIcon },
  { href: '/accessories', label: 'Accessories', icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/documents', label: 'Documents', icon: Printer },
  { href: '/tracking', label: 'Asset Tracking', icon: MapPin },
  { href: '/books', label: 'Accounting', icon: BookOpen },
  { href: '/desk', label: 'Support Desk', icon: Inbox },
  { href: '/salesiq', label: 'Team Chat', icon: Phone },
  { href: '/projects', label: 'Project Board', icon: ListChecks },
  { href: '/campaigns', label: 'Marketing', icon: Presentation },
  { href: '/reports', label: 'Financials', icon: BarChart3 },
  { href: '/audit', label: 'Audit Trail', icon: History },
  { href: '/users', label: 'System Users', icon: UserPlus },
  { href: '/resellers', label: 'Resellers', icon: Briefcase },
  { href: '/recruit', label: 'Recruitment', icon: Briefcase },
  { href: '/profile', label: 'Settings', icon: User },
  { href: '/admin', label: 'Platform Admin', icon: ShieldCheck },
];

export const APP_NAME = "Professional ERP Suite";
import { Briefcase } from 'lucide-react';

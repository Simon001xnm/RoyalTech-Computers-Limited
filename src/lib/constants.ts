
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Printer, MapPin, ClipboardList, BookOpen, Inbox, Phone, ListChecks, Presentation, UserPlus, BarChart3, User, ShieldCheck, History, ShoppingCart, Briefcase, Package } from 'lucide-react';

export const GOOGLE_MAPS_API_KEY_PLACEHOLDER = "YOUR_GOOGLE_MAPS_API_KEY";

// M-PESA DARAJA API CONFIGURATION
export const MPESA_CONFIG = {
  CONSUMER_KEY: "accfhp4AIaRn1FIaANzAATOozNs5aUiPNSFd7aGiGPsAXYsz",
  CONSUMER_SECRET: "tPDcTn2CzF5OGSvYWMfN2uVswqC5sJ7nRSV2S6gg7M4QCRorWhVRnIUixJx41qO6",
  BUSINESS_SHORTCODE: "8560576", 
  PASSKEY: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  CALLBACK_URL: "https://businesshub.co.ke/api/mpesa/callback",
};

export interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', href: '/pos', label: 'Point of Sale', icon: ShoppingCart },
  { id: 'stock', href: '/stock', label: 'Inventory', icon: Package },
  { id: 'accessories', href: '/accessories', label: 'Accessories', icon: ShoppingCart },
  { id: 'customers', href: '/customers', label: 'Customers', icon: Users },
  { id: 'documents', href: '/documents', label: 'Documents', icon: Printer },
  { id: 'accounting', href: '/books', label: 'Accounting', icon: BookOpen },
  { id: 'financials', href: '/reports', label: 'Financials', icon: BarChart3 },
  { id: 'resellers', href: '/resellers', label: 'Resellers', icon: Briefcase },
  { id: 'users', href: '/users', label: 'System Users', icon: UserPlus },
  { id: 'settings', href: '/profile', label: 'Settings', icon: User },
];

export const APP_NAME = "Professional ERP Suite";

import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Printer, BookOpen, UserPlus, BarChart3, User, ShoppingCart, Briefcase, Package } from 'lucide-react';

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
  { id: 'dashboard', href: '/', label: 'Home', icon: LayoutDashboard },
  { id: 'pos', href: '/pos', label: 'Sell Items', icon: ShoppingCart },
  { id: 'stock', href: '/stock', label: 'Inventory', icon: Package },
  { id: 'accessories', href: '/accessories', label: 'Chargers & More', icon: ShoppingCart },
  { id: 'customers', href: '/customers', label: 'Clients', icon: Users },
  { id: 'documents', href: '/documents', label: 'Papers', icon: Printer },
  { id: 'accounting', href: '/books', label: 'Money In/Out', icon: BookOpen },
  { id: 'financials', href: '/reports', label: 'Profit Reports', icon: BarChart3 },
  { id: 'resellers', href: '/resellers', label: 'Partners', icon: Briefcase },
  { id: 'users', href: '/users', label: 'Staff Members', icon: UserPlus },
  { id: 'settings', href: '/profile', label: 'My Shop Settings', icon: User },
];

export const APP_NAME = "Shop Manager";

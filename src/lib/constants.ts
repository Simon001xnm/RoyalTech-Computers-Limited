import type { LucideIcon } from 'lucide-react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Package, 
    Users, 
    FileText, 
    BookOpen, 
    Settings,
    LineChart,
    UserCog,
    Wallet
} from 'lucide-react';

export const GOOGLE_MAPS_API_KEY_PLACEHOLDER = "YOUR_GOOGLE_MAPS_API_KEY";

// M-PESA DARAJA API CONFIGURATION
export const MPESA_CONFIG = {
  CONSUMER_KEY: "accfhp4AIaRn1FIaANzAATOozNs5aUiPNSFd7aGiGPsAXYsz",
  CONSUMER_SECRET: "tPDcTn2CzF5OGSvYWMfN2uVswqC5sJ7nRSV2S6gg7M4QCRorWhVRnIUixJx41qO6",
  BUSINESS_SHORTCODE: "8560576", 
  PASSKEY: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  CALLBACK_URL: "https://businesshub.co.ke/api/mpesa/callback",
};

export type BusinessCategory = 'retail' | 'tech' | 'service' | 'sacco' | 'hospitality' | 'barber' | 'other';

export interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
  businessTypes?: BusinessCategory[]; 
}

/**
 * SIMPLE NAVIGATION
 * Using basic English for all users.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', href: '/', label: 'Main Dashboard', icon: LayoutDashboard },
  
  // SALES
  { id: 'pos', href: '/pos', label: 'Sell Items', icon: ShoppingCart },
  { id: 'documents', href: '/documents', label: 'Paperwork', icon: FileText },
  
  // STOCK & CLIENTS
  { id: 'stock', href: '/stock', label: 'Items in Shop', icon: Package },
  { id: 'customers', href: '/customers', label: 'Client List', icon: Users },
  { id: 'receivables', href: '/receivables', label: 'Money Owed', icon: Wallet },
  
  // MONEY
  { id: 'books', href: '/books', label: 'Money Spent', icon: BookOpen },
  { id: 'reports', href: '/reports', label: 'Profit Reports', icon: LineChart },
  
  // TOOLS
  { id: 'users', href: '/users', label: 'Staff Members', icon: UserCog },
  { id: 'settings', href: '/profile', label: 'Shop Settings', icon: Settings },
];

export const APP_NAME = "Shop Manager";

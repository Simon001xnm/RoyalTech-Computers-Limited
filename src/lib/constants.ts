import type { LucideIcon } from 'lucide-react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Package, 
    Users, 
    FileText, 
    BookOpen, 
    History,
    Settings,
    ShieldCheck,
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
 * STANDALONE NAVIGATION
 * Full business suite restored for a complete operating node.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', href: '/', label: 'Command Center', icon: LayoutDashboard },
  
  // SALES & COMMERCE
  { id: 'pos', href: '/pos', label: 'Point of Sale', icon: ShoppingCart },
  { id: 'documents', href: '/documents', label: 'Documents', icon: FileText },
  
  // INVENTORY & CRM
  { id: 'stock', href: '/inventory', label: 'Inventory', icon: Package },
  { id: 'customers', href: '/customers', label: 'Client Directory', icon: Users },
  { id: 'receivables', href: '/receivables', label: 'Debt Ledger', icon: Wallet },
  
  // FINANCE
  { id: 'books', href: '/books', label: 'Expense Feed', icon: BookOpen },
  { id: 'reports', href: '/reports', label: 'P&L Reports', icon: LineChart },
  
  // SYSTEM
  { id: 'users', href: '/users', label: 'Staff Management', icon: UserCog },
  { id: 'settings', href: '/profile', label: 'Shop Settings', icon: Settings },
];

export const APP_NAME = "Shop Manager";

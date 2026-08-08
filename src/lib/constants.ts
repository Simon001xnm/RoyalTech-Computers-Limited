import type { LucideIcon } from 'lucide-react';
import { 
    LayoutDashboard, User, UserPlus, ShieldCheck, History
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
 * CLEAN SLATE NAVIGATION
 * Only core workspace management is active.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', href: '/', label: 'Home', icon: LayoutDashboard },
  
  // CORE MANAGEMENT
  { id: 'users', href: '/users', label: 'Staff Members', icon: UserPlus },
  { id: 'audit', href: '/audit', label: 'Audit Trail', icon: History },
  { id: 'settings', href: '/profile', label: 'Node Settings', icon: User },
];

export const APP_NAME = "Shop Manager";

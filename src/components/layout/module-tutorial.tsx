
"use client";

import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, CheckCircle2, Lightbulb } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TutorialContent {
  title: string;
  description: string;
  features: string[];
  tips: string[];
}

const TUTORIAL_DATA: Record<string, TutorialContent> = {
  "/": {
    title: "Executive Dashboard",
    description: "Your business at a glance. This command center provides real-time analytics and activity logs for your workspace.",
    features: [
      "Revenue Analytics: Track your sales trends over the last 7 days.",
      "KPI Cards: Monitor asset availability, client growth, and monthly volume.",
      "Recent Activity: A live feed of every transaction recorded in the system."
    ],
    tips: [
      "Hover over the chart points to see exact revenue figures.",
      "Use the summary cards to quickly identify stock shortages."
    ]
  },
  "/pos": {
    title: "Point of Sale (POS)",
    description: "The heartbeat of your retail operations. Process sales for hardware and accessories instantly.",
    features: [
      "Smart Basket: Add assets (Phones, Laptops, etc.) and accessories to a unified cart.",
      "M-Pesa Integration: Initiate STK Pushes directly to customer phones.",
      "Automatic Inventory Update: Items are marked as 'Sold' the moment you finalize.",
      "Custom VAT: Toggle 16% VAT on or off depending on the transaction type."
    ],
    tips: [
      "Use the 'Reference Code' field for Bank or Till payments to simplify reconciliation.",
      "You can generate a Delivery Note directly from the sales history log below the basket."
    ]
  },
  "/stock": {
    title: "Asset Inventory",
    description: "Manage your high-value hardware assets with serial-number precision.",
    features: [
      "Bulk Import: Paste CSV data to add hundreds of devices at once.",
      "Status Tracking: Monitor if an asset is Available, Sold, Under Repair, or with a Reseller.",
      "Tech Specs: Store RAM, Storage, and Processor details for every unit.",
      "Pricing Control: Set standard purchase prices and acquisition dates."
    ],
    tips: [
      "Use the search bar to find an asset by its Serial Number instantly.",
      "Ensure acquisition dates are accurate for better financial reporting."
    ]
  },
  "/accessories": {
    title: "Accessory Inventory",
    description: "Track non-serialized items like chargers, protective cases, and cables.",
    features: [
      "Quantity Management: Keep track of stock levels for generic components.",
      "Status Badges: Quickly see what is available for sale.",
      "Pricing: Set selling prices for retail components."
    ],
    tips: [
      "Update quantities regularly after manual sales not processed through the POS."
    ]
  },
  "/customers": {
    title: "Customer Management (CRM)",
    description: "Your database of individual clients and corporate accounts.",
    features: [
      "Customer Profiles: Store contact details, addresses, and avatars.",
      "Registration Tracking: See when each client joined your ecosystem.",
      "Centralized Data: These profiles power your POS and Documents."
    ],
    tips: [
      "Ensure emails are accurate, as they are used for generating professional invoices."
    ]
  },
  "/documents": {
    title: "Document Generation",
    description: "Professional, branded paperwork for every business stage.",
    features: [
      "Multiple Types: Invoices, Quotations, Proformas, LPOs, and Delivery Notes.",
      "Dynamic Branding: Documents automatically use your uploaded logo and brand colors.",
      "Smart Conversion: Turn a Quotation into an Invoice with a single click.",
      "Print & PDF: Export high-resolution A4 documents for your clients."
    ],
    tips: [
      "The 'powered by simonstyless' footer is mandatory for professional verification.",
      "Use the 'Proforma' option to provide billing details before final payment is received."
    ]
  },
  "/tracking": {
    title: "Asset Tracking",
    description: "Map-based visualization of your hardware assets in the field.",
    features: [
      "Real-time Map: See the last known GPS coordinates of your assets.",
      "Asset Selection: Filter the map to focus on a specific unit.",
      "Status Verification: See if a device is currently with a reseller or in the repair shop."
    ],
    tips: [
      "This feature requires a valid Google Maps API key in your system settings."
    ]
  }
};

export function ModuleTutorial() {
  const pathname = usePathname();
  const tutorial = TUTORIAL_DATA[pathname] || TUTORIAL_DATA["/"];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-primary hover:text-primary hover:bg-primary/10">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Module Guide</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
                <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            {tutorial.title} Tutorial
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {tutorial.description}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-6 pt-2">
          <div className="space-y-8">
            <section>
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                What this module offers
              </h4>
              <ul className="grid grid-cols-1 gap-3">
                {tutorial.features.map((feature, idx) => (
                  <li key={idx} className="text-sm bg-muted/30 p-3 rounded-lg border border-muted flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Professional Tips
              </h4>
              <ul className="space-y-2">
                {tutorial.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-primary/80 italic leading-relaxed">
                    &ldquo;{tip}&rdquo;
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </ScrollArea>
        
        <div className="p-6 border-t bg-muted/20 text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                System Support &bull; Powered by simonstyless technologies limited
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

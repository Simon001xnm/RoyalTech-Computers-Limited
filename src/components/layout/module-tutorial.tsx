
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
    description: "Your business at a glance. This command center provides real-time analytics and alerts.",
    features: [
      "Revenue Analytics: Track your sales trends over the last 7 days.",
      "KPI Cards: Monitor asset availability, active leases, and client growth.",
      "Renewal Alerts: See which leases are expiring in the next 30 days.",
      "Global Activity: A unified feed of every transaction recorded in the system."
    ],
    tips: [
      "Hover over the chart points to see exact revenue figures.",
      "The 'Days Remaining' badges are color-coded: Red means critical (under 7 days)."
    ]
  },
  "/pos": {
    title: "Point of Sale (POS)",
    description: "The heartbeat of your retail operations. Process sales for hardware and accessories instantly.",
    features: [
      "Smart Basket: Add laptops (by Serial Number) and accessories to a unified cart.",
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
    title: "Laptop Inventory",
    description: "Manage your high-value hardware assets with serial-number precision.",
    features: [
      "Bulk Import: Paste CSV data to add hundreds of laptops at once.",
      "Status Tracking: Monitor if a laptop is Available, Leased, Under Repair, or with a Reseller.",
      "Tech Specs: Store RAM, Storage, and Processor details for every unit.",
      "Pricing Control: Set standard purchase prices and monthly lease rates."
    ],
    tips: [
      "Use the search bar to find a laptop by its Serial Number instantly.",
      "Items marked as 'Leased' cannot be deleted to protect your data integrity."
    ]
  },
  "/accessories": {
    title: "Accessory Inventory",
    description: "Track non-serialized items like chargers, mice, and keyboards.",
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
      "Centralized Data: These profiles power your Leases, POS, and Documents."
    ],
    tips: [
      "Ensure emails are accurate, as they are used for generating professional invoices."
    ]
  },
  "/leases": {
    title: "Lease Tracking",
    description: "The core engine for hardware-as-a-service providers.",
    features: [
      "Automated Status: Leases move from 'Upcoming' to 'Active' to 'Expired' automatically.",
      "Asset Locking: Laptops assigned to a lease are automatically hidden from the POS basket.",
      "Digital Signatures: Capture the lessee's signature directly on your device.",
      "Payment Tracking: Mark monthly payments as Paid, Pending, or Overdue."
    ],
    tips: [
      "When a lease is 'Terminated', the associated laptop is instantly returned to 'Available' stock.",
      "Check the 'Days Remaining' column daily to manage renewals."
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
      "Use the 'Lease-based' invoice type to automatically calculate duration-based totals."
    ]
  },
  "/tracking": {
    title: "Laptop Tracking",
    description: "Map-based visualization of your leased assets.",
    features: [
      "Real-time Map: See the last known GPS coordinates of your laptops.",
      "Asset Selection: Filter the map to focus on a specific leased unit.",
      "Status Verification: See if a device is currently leased or in the repair shop."
    ],
    tips: [
      "This feature requires a valid Google Maps API key in your system settings."
    ]
  },
  "/books": {
    title: "Accounting (The Books)",
    description: "Keep your finances in order with local-first ledger tracking.",
    features: [
      "Transaction Recording: Manually log sales and business expenses.",
      "Profit Calculation: See your Net Profit after accounting for COGS and Expenses.",
      "Category Management: Group expenses by Rent, Salaries, Utilities, etc.",
      "Monthly Summaries: Get a snapshot of your financial health for the current month."
    ],
    tips: [
      "Record every small expense to ensure your Profit & Loss reports are accurate."
    ]
  },
  "/desk": {
    title: "Helpdesk",
    description: "Manage support requests and hardware repair workflows.",
    features: [
      "Support Tickets: Raise issues related to specific customers or leases.",
      "Priority Levels: Categorize tasks as Low, Medium, or High priority.",
      "Status Workflow: Track issues from 'Open' to 'In Progress' to 'Closed'.",
      "Asset Links: Link tickets directly to the hardware being serviced."
    ],
    tips: [
      "Close tickets as soon as they are resolved to keep your workspace clutter-free."
    ]
  },
  "/salesiq": {
    title: "SalesIQ Chat",
    description: "Internal team collaboration and messaging.",
    features: [
      "Real-time Chat: Message team members logged into the workspace.",
      "Sync: Messages are stored locally and synced across all your authorized devices.",
      "User Avatars: See exactly who is talking."
    ],
    tips: [
      "Use this for quick coordination between the field team and the office."
    ]
  },
  "/projects": {
    title: "Project Management",
    description: "Kanban-style planning for your business goals.",
    features: [
      "Visual Board: Drag tasks between Todo, In Progress, and Done.",
      "Deadlines: Assign due dates to critical projects.",
      "Descriptions: Store detailed plans and goals for every project."
    ],
    tips: [
      "Break large goals into smaller projects to track progress more effectively."
    ]
  },
  "/campaigns": {
    title: "Marketing Campaigns",
    description: "Design and manage your outreach strategies.",
    features: [
      "Draft Templates: Compose email or social media copy.",
      "Audience Tracking: Define who you are targeting with each campaign.",
      "Status Control: Move campaigns from Draft to Sent to Archived."
    ],
    tips: [
      "Use this to plan your Q3/Q4 sales pushes ahead of time."
    ]
  },
  "/reports": {
    title: "Financial Reports",
    description: "High-level analysis for executive decision-making.",
    features: [
      "Profit & Loss (P&L): Generate accrual-basis income statements.",
      "COGS Breakdown: See exactly what you spent on stock vs. what you sold.",
      "Date Range Filtering: Generate reports for any specific time period.",
      "Branded Export: Download reports with your logo and brand colors."
    ],
    tips: [
      "The Net Income figure is your ultimate success metric—keep it in the green!"
    ]
  },
  "/users": {
    title: "User Management",
    description: "Control who has access to your business workspace.",
    features: [
      "Role-Based Access (RBAC): Assign users as 'Admin' or standard 'User'.",
      "Security: Admins can see everything; standard users are restricted from management tools.",
      "Account Control: Reset passwords or deactivate accounts locally."
    ],
    tips: [
      "Only give Admin access to trusted managers, as they can modify financial records."
    ]
  },
  "/resellers": {
    title: "Reseller Network",
    description: "Manage external sales agents who sell stock on your behalf.",
    features: [
      "Asset Issuance: Hand over laptops to resellers while keeping ownership.",
      "Sales Tracking: When a reseller sells an item, it's recorded as your revenue.",
      "Return Logic: Mark items as 'Returned' if the reseller didn't close the deal.",
      "Dashboards: Every reseller gets a specific view of what items they currently hold."
    ],
    tips: [
      "Use the 'Export Issued Items' tool to generate audit lists for your agents."
    ]
  },
  "/recruit": {
    title: "Recruitment Suite",
    description: "HR tools for managing job openings and candidates.",
    features: [
      "Job Postings: Create detailed listings for your company departments.",
      "Applicant Tracking: Store resumes and notes for every candidate.",
      "Hiring Workflow: Move applicants from Screening to Interview to Hired.",
      "Status Badges: Quickly see who was rejected and who is promising."
    ],
    tips: [
      "Link resume URLs (Dropbox/Drive) to keep all candidate data in one place."
    ]
  },
  "/profile": {
    title: "Workspace & Profile",
    description: "Configure your system identity and branding colors.",
    features: [
      "Brand Palette: Choose the primary color used for the entire system UI.",
      "Logo Management: Upload your corporate logo for all PDFs.",
      "Personal Identity: Update your name, avatar, and password."
    ],
    tips: [
      "Changes to 'Primary Color' take effect across all modules instantly."
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

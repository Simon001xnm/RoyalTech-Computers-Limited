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
    title: "Main Dashboard",
    description: "Your shop at a glance. See your monthly sales, profit, and money owed by clients.",
    features: [
      "Monthly Metrics: View your total money in and net profit for this month.",
      "Sales Progress: Track how well you are selling today compared to the week.",
      "Daily Feed: A list of every activity recorded in the shop today."
    ],
    tips: [
      "Watch the 'Money Owed' card to see if clients are paying on time.",
      "Profit is calculated by subtracting costs and expenses from your sales."
    ]
  },
  "/pos": {
    title: "Sell Items",
    description: "Process sales for items in your shop instantly.",
    features: [
      "Basket: Add items to a list to calculate the total price.",
      "Payments: Record if the client paid cash, M-Pesa, or took it on credit.",
      "Instant Updates: Stock levels are updated the moment you save a sale."
    ],
    tips: [
      "Always select a client first to ensure their debt history is updated.",
      "You can print a small thermal receipt or a big A4 invoice after saving."
    ]
  },
  "/receivables": {
    title: "Money Owed",
    description: "A permanent list of everyone who owes the shop money, no matter how old the debt is.",
    features: [
      "Account History: See every sale a customer has ever made.",
      "Debt Tracking: Balances stay on the list even if they are 1 year old.",
      "Payment Logging: Add payments to reduce a customer's total debt."
    ],
    tips: [
      "Records remain even after payment is finished for your future reference.",
      "Download a Statement to show a customer exactly what they bought and paid for."
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
          <span className="hidden sm:inline">Guide</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 border-none shadow-2xl">
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
                Features
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
                Tips
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
            <p className="text-[10px] text-muted-foreground tracking-widest lowercase">
                &copy; 2026 shopmanager &bull; simple English version
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

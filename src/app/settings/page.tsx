import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Save, Bell, Palette, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  // Mock settings data
  const settings = {
    enableEmailNotifications: true,
    theme: "light", // 'light', 'dark', 'system'
    lowStockThreshold: 5,
    leaseExpiryReminderDays: 7,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Application Settings" description="Configure application-wide preferences." />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/> Notifications</CardTitle>
            <CardDescription>Manage how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 shadow-sm">
              <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receive important updates via email.
                </span>
              </Label>
              <Switch id="email-notifications" defaultChecked={settings.enableEmailNotifications} aria-label="Email notifications"/>
            </div>
            <div>
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input id="lowStockThreshold" type="number" defaultValue={settings.lowStockThreshold} />
              <p className="text-sm text-muted-foreground mt-1">Alert when stock for an item falls below this number.</p>
            </div>
            <div>
              <Label htmlFor="leaseExpiryReminderDays">Lease Expiry Reminder (Days)</Label>
              <Input id="leaseExpiryReminderDays" type="number" defaultValue={settings.leaseExpiryReminderDays} />
              <p className="text-sm text-muted-foreground mt-1">Send reminders this many days before a lease expires.</p>
            </div>
          </CardContent>
           <CardFooter>
            <Button className="ml-auto"><Save className="mr-2 h-4 w-4"/> Save Notification Settings</Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5"/> Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 shadow-sm">
              <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
                <span>Theme Mode</span>
                 <span className="font-normal leading-snug text-muted-foreground">
                  Choose between light, dark, or system default. (UI not implemented)
                </span>
              </Label>
              {/* This is a visual placeholder; actual theme switching needs more setup */}
              <Switch id="theme-mode" defaultChecked={settings.theme === 'dark'} aria-label="Theme Mode"/>
            </div>
            {/* More appearance settings can go here */}
          </CardContent>
           <CardFooter>
            <Button className="ml-auto"><Save className="mr-2 h-4 w-4"/> Save Appearance Settings</Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5"/> Security</CardTitle>
            <CardDescription>Manage security related settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 shadow-sm">
              <Label htmlFor="two-factor-auth" className="flex flex-col space-y-1">
                <span>Two-Factor Authentication</span>
                 <span className="font-normal leading-snug text-muted-foreground">
                  Enhance your account security. (UI not implemented)
                </span>
              </Label>
              <Switch id="two-factor-auth" disabled aria-label="Two factor authentication"/>
            </div>
            {/* More security settings can go here */}
          </CardContent>
           <CardFooter>
            <Button className="ml-auto" disabled><Save className="mr-2 h-4 w-4"/> Save Security Settings</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

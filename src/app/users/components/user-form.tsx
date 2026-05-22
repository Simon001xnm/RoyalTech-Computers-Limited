
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { User } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { USER_ROLES, roleDescriptions } from "@/lib/roles";
import { NAV_ITEMS } from "@/lib/constants";
import { Loader2, ShieldCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES),
  permissions: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const defaultValues: Partial<FormValues> = user
    ? { 
        name: user.name || "", 
        email: user.email, 
        phone: user.phone || "", 
        role: user.role, 
        permissions: user.permissions || [] 
      }
    : {
        name: "",
        email: "",
        phone: "",
        role: "user",
        permissions: ["dashboard", "pos", "stock", "customers", "documents"], // Default set
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });
  
  const selectedRole = form.watch("role");

  // Filter out system items for permission selection
  const permissionModules = NAV_ITEMS.filter(i => !['settings', 'users', 'audit'].includes(i.id));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Jane Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 0712345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jane.smith@example.com" {...field} disabled={!!user} />
                </FormControl>
                {user ? (
                    <FormDescription className="text-xs">Email cannot be changed after account link.</FormDescription>
                ) : (
                    <FormDescription className="text-xs">User must sign up with this exact email to link to your workspace.</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        
        <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>System Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Workspace Owner)</SelectItem>
                    <SelectItem value="user">Staff (Restricted Access)</SelectItem>
                  </SelectContent>
                </Select>
                 {selectedRole && <FormDescription className="text-[10px] font-bold uppercase text-primary mt-1">{roleDescriptions[selectedRole]}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        
        {selectedRole === 'user' && (
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Module Access Selection</h3>
                </div>
                <p className="text-xs text-muted-foreground">Select which modules this user can see and interact with.</p>
                
                <ScrollArea className="h-60 rounded-xl border p-4 bg-muted/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {permissionModules.map((item) => (
                        <FormField
                            key={item.id}
                            control={form.control}
                            name="permissions"
                            render={({ field }) => {
                            return (
                                <FormItem
                                    key={item.id}
                                    className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                                >
                                <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...field.value, item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                    (value) => value !== item.id
                                                )
                                                )
                                        }}
                                    />
                                </FormControl>
                                <div className="flex items-center gap-2">
                                    <item.icon className="h-4 w-4 text-muted-foreground opacity-50" />
                                    <FormLabel className="text-xs font-bold cursor-pointer">{item.label}</FormLabel>
                                </div>
                                </FormItem>
                            )
                            }}
                        />
                        ))}
                    </div>
                </ScrollArea>
            </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="font-black uppercase tracking-widest">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (user ? "Update Access" : "Provision User")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

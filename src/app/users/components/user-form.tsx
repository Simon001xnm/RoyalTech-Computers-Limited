
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
import { USER_ROLES, roleDescriptions } from "@/lib/roles";

// Base schema for fields that are always present
const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES),
});

// Schema for creating a new user (password is required)
const createUserSchema = baseSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters."),
});

// Schema for editing an existing user (password is optional)
const editUserSchema = baseSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
});


type FormValues = z.infer<typeof createUserSchema>;

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {

  const formSchema = user ? editUserSchema : createUserSchema;

  const defaultValues: Partial<FormValues> = user
    ? { ...user, phone: user.phone || '', password: '' }
    : {
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "user",
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const selectedRole = form.watch("role");

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
                  <Input placeholder="e.g., (123) 456-7890" {...field} value={field.value ?? ''} />
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
                  <Input type="email" placeholder="e.g., jane.smith@example.com" {...field} disabled={!!user} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        
          <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{user ? 'New Password' : 'Initial Password'}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    {user ? "Leave blank to keep the current password." : "The new user will be prompted to change this on first login."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        
        <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {USER_ROLES.map(role => <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
                 {selectedRole && <FormDescription>{roleDescriptions[selectedRole]}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (user ? "Saving..." : "Creating User...") : (user ? "Save Changes" : "Create User")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

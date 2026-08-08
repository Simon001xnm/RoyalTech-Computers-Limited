
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Product } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Box, Tag, DollarSign } from "lucide-react";

const productFormSchema = z.object({
  name: z.string().min(2, "Product name is required."),
  description: z.string().optional().default(""),
  category: z.string().min(2, "Category is required."),
  currentStock: z.coerce.number().min(0, "Quantity cannot be negative."),
  buyingPrice: z.coerce.number().min(0, "Buying price is required."),
  sku: z.string().min(2, "SKU is required."),
  unit: z.string().default("Pcs"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface AssetFormProps {
  asset?: Product | null;
  onSubmit: (data: ProductFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AssetForm({ asset, onSubmit, onCancel, isLoading }: AssetFormProps) {
  const defaultValues: ProductFormValues = asset
    ? {
        name: asset.name || "",
        description: asset.description || "",
        category: asset.category || "",
        currentStock: asset.currentStock || 0,
        buyingPrice: asset.buyingPrice || 0,
        sku: asset.sku || "",
        unit: asset.unit || "Pcs",
      }
    : {
        name: "",
        description: "",
        category: "",
        currentStock: 0,
        buyingPrice: 0,
        sku: "",
        unit: "Pcs",
      };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
            <Box className="h-4 w-4" />
            Product Details
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fiber Optic Patch Cord SC/APC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU / Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. FOPC-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g. 3m single-mode SC/APC patch cord" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Fiber Accessories" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
              <Tag className="h-4 w-4" />
              Stock
            </div>
            <FormField
              control={form.control}
              name="currentStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
              <DollarSign className="h-4 w-4" />
              Price
            </div>
            <FormField
              control={form.control}
              name="buyingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buying Price (KES) *</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-12 px-8 font-bold">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="h-12 px-12 font-black uppercase tracking-widest shadow-xl">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (asset ? "Update Product" : "Save Product")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

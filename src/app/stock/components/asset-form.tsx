"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Box, Tag, DollarSign, Layers } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const variantSchema = z.object({
  name: z.string().min(1, "Attribute name required"),
  value: z.string().min(1, "Value required"),
  sku: z.string().optional().default(""),
  priceAdjustment: z.coerce.number().default(0),
});

const productFormSchema = z.object({
  name: z.string().min(2, "Product name is required (min 2 chars)."),
  sku: z.string().min(2, "SKU is required."),
  barcode: z.string().optional().default(""),
  category: z.string().min(2, "Category is required."),
  brand: z.string().optional().default(""),
  model: z.string().optional().default(""),
  description: z.string().optional().default(""),
  unit: z.string().min(1, "Base unit is required (e.g., Pcs)."),
  buyingPrice: z.coerce.number().min(0, "Buying price is required."),
  sellingPriceRetail: z.coerce.number().min(0, "Retail price is required."),
  sellingPriceWholesale: z.coerce.number().min(0, "Wholesale price is required."),
  minStock: z.coerce.number().min(0, "Min stock level is required."),
  currentStock: z.coerce.number().min(0, "Initial stock is required."),
  reorderQty: z.coerce.number().min(0, "Reorder quantity is required."),
  supplier: z.string().optional().default(""),
  locationBin: z.string().optional().default(""),
  hasSerialNumber: z.boolean().default(false),
  warrantyPeriod: z.string().optional().default(""),
  taxStatus: z.enum(["Taxable", "Exempt", "ZeroRated"]),
  variants: z.array(variantSchema).optional().default([]),
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
        ...asset,
        barcode: asset.barcode ?? "",
        brand: asset.brand ?? "",
        model: asset.model ?? "",
        description: asset.description ?? "",
        locationBin: asset.locationBin ?? "",
        supplier: asset.supplier ?? "",
        warrantyPeriod: asset.warrantyPeriod ?? "",
        variants: asset.variants || [],
      } as ProductFormValues
    : {
        name: "",
        sku: "",
        barcode: "",
        category: "",
        brand: "",
        model: "",
        description: "",
        unit: "Pcs",
        buyingPrice: 0,
        sellingPriceRetail: 0,
        sellingPriceWholesale: 0,
        minStock: 5,
        currentStock: 0,
        reorderQty: 10,
        supplier: "",
        locationBin: "",
        hasSerialNumber: false,
        warrantyPeriod: "",
        taxStatus: "Taxable",
        variants: [],
      };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
            <Box className="h-4 w-4" />
            Product Identity
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fiber Cable" {...field} />
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
                  <FormLabel>SKU / Internal Code <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. FB-SM-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Networking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Huawei" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Single Mode" {...field} />
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
                <FormLabel>Detailed Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe technical features..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
            <Tag className="h-4 w-4" />
            Stock Control
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Unit <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Pcs, Meters, Kg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Stock <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Stock Level <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reorderQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Quantity <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="locationBin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse Location / Bin</FormLabel>
                  <FormControl>
                    <Input placeholder="Shelf A, Row 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="Supplier Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
            <DollarSign className="h-4 w-4" />
            Financial Configuration
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="buyingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buying Price (KES) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellingPriceRetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retail Price (KES) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellingPriceWholesale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wholesale Price (KES) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="taxStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Treatment <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Taxable">Taxable (16% VAT)</SelectItem>
                    <SelectItem value="Exempt">Exempt</SelectItem>
                    <SelectItem value="ZeroRated">Zero Rated</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
              <Layers className="h-4 w-4" />
              Product Variants
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", value: "", priceAdjustment: 0 })}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Variant
            </Button>
          </div>
          
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-xl bg-muted/10 items-end">
                <FormField
                  control={form.control}
                  name={`variants.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px]">Attribute</FormLabel>
                      <FormControl><Input placeholder="e.g. Core" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px]">Value</FormLabel>
                      <FormControl><Input placeholder="e.g. 48 Core" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.priceAdjustment`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px]">Price Adj (+/-)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive h-10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-12 px-8 font-bold">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="h-12 px-12 font-black uppercase tracking-widest shadow-xl">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (asset ? "Save Changes" : "Create Product")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

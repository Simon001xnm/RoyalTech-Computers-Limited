"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import type { Product, TaxStatus } from "@/types";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Box, Tag, DollarSign, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const variantSchema = z.object({
  name: z.string().min(1, "Variant name required (e.g. Core)"),
  value: z.string().min(1, "Value required (e.g. 4 Core)"),
  sku: z.string().optional(),
  priceAdjustment: z.coerce.number().default(0),
});

const productFormSchema = z.object({
  name: z.string().min(2, "Product name required."),
  sku: z.string().min(2, "SKU required."),
  barcode: z.string().optional(),
  category: z.string().min(2, "Category required."),
  brand: z.string().optional(),
  model: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().min(1, "Unit required (e.g. Pcs)."),
  buyingPrice: z.coerce.number().min(0, "Buying price required."),
  sellingPriceRetail: z.coerce.number().min(0, "Retail price required."),
  sellingPriceWholesale: z.coerce.number().min(0, "Wholesale price required."),
  minStock: z.coerce.number().min(0, "Minimum stock required."),
  currentStock: z.coerce.number().min(0, "Current stock required."),
  reorderQty: z.coerce.number().min(0, "Reorder quantity required."),
  supplier: z.string().optional(),
  locationBin: z.string().optional(),
  hasSerialNumber: z.boolean().default(false),
  warrantyPeriod: z.string().optional(),
  taxStatus: z.enum(["Taxable", "Exempt", "ZeroRated"]),
  variants: z.array(variantSchema).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface AssetFormProps {
  asset?: Product | null;
  onSubmit: (data: ProductFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AssetForm({ asset, onSubmit, onCancel, isLoading }: AssetFormProps) {
  // Ensure all fields have a defined initial value to prevent uncontrolled-to-controlled warnings
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

  const handleSubmit = (data: ProductFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 py-4">
        {/* Basic Identity */}
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
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fiber Cable" {...field} value={field.value ?? ""} />
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
                  <FormLabel>SKU / Internal Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. FB-SM-001" {...field} value={field.value ?? ""} />
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
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Networking" {...field} value={field.value ?? ""} />
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
                    <Input placeholder="e.g. Huawei" {...field} value={field.value ?? ""} />
                  </FormControl>
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
                    <Input placeholder="e.g. Single Mode" {...field} value={field.value ?? ""} />
                  </FormControl>
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
                  <Textarea placeholder="Describe technical features..." {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Inventory & Units */}
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
                  <FormLabel>Base Unit *</FormLabel>
                  <FormControl>
                    <Input placeholder="Pcs, Meters, Kg" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Stock</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Stock Level</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reorderQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value ?? ""} />
                  </FormControl>
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
                    <Input placeholder="Shelf A, Row 2" {...field} value={field.value ?? ""} />
                  </FormControl>
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
                    <Input placeholder="Supplier Name" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Pricing & Tax */}
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
                  <FormLabel>Buying Price (KES)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellingPriceRetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retail Price (KES)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellingPriceWholesale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wholesale Price (KES)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="taxStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Treatment</FormLabel>
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

        {/* Variants Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
              <Layers className="h-4 w-4" />
              Product Variants (Core, Length, Type)
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", value: "", priceAdjustment: 0 })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Variant
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
                      <FormLabel className="text-[10px]">Attribute (e.g. Cores)</FormLabel>
                      <FormControl><Input placeholder="Cores" {...field} value={field.value ?? ""} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px]">Value (e.g. 48 Core)</FormLabel>
                      <FormControl><Input placeholder="48 Core" {...field} value={field.value ?? ""} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.priceAdjustment`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px]">Price Adj (+/-)</FormLabel>
                      <FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl>
                    </FormItem>
                  )}
                />
                <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic text-center py-4">No variants defined for this product.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-11 px-6">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="h-11 px-10 font-black uppercase tracking-widest shadow-lg">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (asset ? "Update Product" : "Create Product")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

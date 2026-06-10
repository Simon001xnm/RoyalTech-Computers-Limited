"use client"

import { useState, useMemo } from 'react';
import type { Accessory, Asset } from '@/types';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Component as ComponentIcon, Plus, X, ShoppingCart, Laptop } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Item = (Accessory | Asset) & { type: 'accessory' | 'asset' };

interface IssueItemFormProps {
    availableItems: Item[];
    onSubmit: (data: { items: {id: string, type: 'accessory' | 'asset'}[] }) => void;
    onCancel: () => void;
}

export function IssueItemForm({ availableItems, onSubmit, onCancel }: IssueItemFormProps) {
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    const [search, setSearch] = useState("");

    const filteredAvailableItems = useMemo(() => {
        const unselectedItems = availableItems.filter(item => !selectedItems.some(s => s.id === item.id));
        if (!search) return unselectedItems;
        const searchLower = search.toLowerCase();
        return unselectedItems.filter(item => {
            const name = (item as Asset).model || (item as Accessory).name;
            return name.toLowerCase().includes(searchLower) || item.serialNumber.toLowerCase().includes(searchLower);
        });
    }, [availableItems, selectedItems, search]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) return;
        onSubmit({ items: selectedItems.map(i => ({ id: i.id, type: i.type })) });
    };

    const renderItem = (item: Item, action: 'add' | 'remove') => {
        const name = (item as Asset).model || (item as Accessory).name;
        const Icon = item.type === 'asset' ? Laptop : ComponentIcon;

        return (
            <div key={item.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl border border-transparent hover:border-black/5 transition-all mb-1">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-2 rounded-lg",
                        item.type === 'asset' ? "bg-primary/5 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black uppercase leading-tight">{name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">S/N: {item.serialNumber}</span>
                            <Badge variant="outline" className="text-[8px] h-4 uppercase py-0 leading-none">{item.type}</Badge>
                        </div>
                    </div>
                </div>
                {action === 'add' ? (
                    <Button type="button" variant="outline" size="sm" className="h-8 font-bold text-[10px] uppercase" onClick={() => setSelectedItems([...selectedItems, item])}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                ) : (
                    <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedItems(selectedItems.filter(i => i.id !== item.id))} className="h-8 w-8">
                        <X className="h-4 w-4 text-destructive" />
                    </Button>
                )}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Available Inventory</h3>
                        <p className="text-[10px] text-muted-foreground">Laptops and accessories ready for distribution.</p>
                    </div>
                    <Input 
                        placeholder="Search model or serial..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="h-11 font-bold"
                    />
                    <ScrollArea className="h-80 w-full rounded-2xl border bg-muted/5 p-2">
                        <div className="space-y-1">
                            {filteredAvailableItems.length > 0 ? (
                                filteredAvailableItems.map(item => renderItem(item, 'add'))
                            ) : (
                                <div className="py-20 text-center opacity-20 italic text-xs">No matching items found.</div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                 <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" /> Issuance Cart
                        </h3>
                        <p className="text-[10px] text-muted-foreground">Items selected for partner node.</p>
                    </div>
                    <Card className="h-[432px] border-none ring-1 ring-black/5 shadow-inner bg-card/50">
                        <CardContent className="p-2 h-full">
                            <ScrollArea className="h-full">
                                {selectedItems.length > 0 ? (
                                    selectedItems.map(item => renderItem(item, 'remove'))
                                ) : (
                                    <div className="h-full flex items-center justify-center py-20 text-center opacity-20">
                                        <div className="space-y-2">
                                            <ShoppingCart className="h-10 w-10 mx-auto" />
                                            <p className="font-bold uppercase tracking-tighter text-[10px]">Select items to begin</p>
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DialogFooter className="border-t pt-6 gap-2">
                <Button type="button" variant="outline" onClick={onCancel} className="h-12 px-6 font-bold">Cancel</Button>
                <Button type="submit" disabled={selectedItems.length === 0} className="h-12 px-10 font-black uppercase tracking-widest shadow-xl">
                    Confirm Issuance ({selectedItems.length} Units)
                </Button>
            </DialogFooter>
        </form>
    );
}

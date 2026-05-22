
"use client"

import { useState, useMemo } from 'react';
import type { Accessory } from '@/types';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Component as ComponentIcon, Plus, X, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Item = Accessory & { type: 'accessory' };

interface IssueItemFormProps {
    availableItems: Item[];
    onSubmit: (data: { items: {id: string, type: 'accessory'}[] }) => void;
    onCancel: () => void;
}

export function IssueItemForm({ availableItems, onSubmit, onCancel }: IssueItemFormProps) {
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    const [search, setSearch] = useState("");

    const filteredAvailableItems = useMemo(() => {
        const unselectedItems = availableItems.filter(item => !selectedItems.some(s => s.id === item.id));
        if (!search) return unselectedItems;
        const searchLower = search.toLowerCase();
        return unselectedItems.filter(item => item.name.toLowerCase().includes(searchLower) || item.serialNumber.toLowerCase().includes(searchLower));
    }, [availableItems, selectedItems, search]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) return;
        onSubmit({ items: selectedItems.map(i => ({ id: i.id, type: i.type })) });
    };

    const renderItem = (item: Item, action: 'add' | 'remove') => (
        <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
            <div className="flex items-center gap-3">
                <ComponentIcon className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col"><span className="text-sm font-medium">{item.name}</span><span className="text-xs text-muted-foreground">S/N: {item.serialNumber}</span></div>
            </div>
            {action === 'add' ? (
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedItems([...selectedItems, item])}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            ) : (
                <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedItems(selectedItems.filter(i => i.id !== item.id))} className="h-8 w-8"><X className="h-4 w-4 text-destructive" /></Button>
            )}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Available Accessories</h3>
                    <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <ScrollArea className="h-72 w-full rounded-md border">
                        <div className="p-2">{filteredAvailableItems.map(item => renderItem(item, 'add'))}</div>
                    </ScrollArea>
                </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center"><ShoppingCart className="h-5 w-5 mr-2" /> Cart</h3>
                    <Card className="h-80"><CardContent className="p-0 h-full"><ScrollArea className="h-full"><div className="p-2">{selectedItems.map(item => renderItem(item, 'remove'))}</div></ScrollArea></CardContent></Card>
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={selectedItems.length === 0}>Issue {selectedItems.length} Item(s)</Button>
            </DialogFooter>
        </form>
    );
}

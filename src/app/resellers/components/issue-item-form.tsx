"use client"

import { useState, useMemo } from 'react';
import type { Laptop, Accessory } from '@/types';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LaptopIcon, Component, Plus, X, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Define a proper discriminated union for items to ensure type safety 
 * during build-time filtering and rendering.
 */
type Item = 
  | (Laptop & { type: 'laptop' }) 
  | (Accessory & { type: 'accessory' });

interface IssueItemFormProps {
    availableItems: Item[];
    onSubmit: (data: { items: {id: string, type: 'laptop' | 'accessory'}[] }) => void;
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
            // TypeScript now correctly narrows 'item' based on the 'type' property
            const displayName = item.type === 'laptop' ? item.model : item.name;
            
            return displayName.toLowerCase().includes(searchLower) ||
                   item.serialNumber.toLowerCase().includes(searchLower);
        });
    }, [availableItems, selectedItems, search]);

    const handleSelect = (item: Item) => {
        setSelectedItems(prev => [...prev, item]);
    };

    const handleRemove = (itemId: string) => {
        setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            alert("Please select at least one item to issue.");
            return;
        }
        onSubmit({ items: selectedItems.map(i => ({ id: i.id, type: i.type })) });
    };

    const renderItem = (item: Item, action: 'add' | 'remove') => {
        const displayName = item.type === 'laptop' ? item.model : item.name;
        return (
            <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                <div className="flex items-center gap-3">
                    {item.type === 'laptop' ? <LaptopIcon className="h-5 w-5 text-muted-foreground" /> : <Component className="h-5 w-5 text-muted-foreground" />}
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{displayName}</span>
                        <span className="text-xs text-muted-foreground">S/N: {item.serialNumber}</span>
                    </div>
                </div>
                {action === 'add' ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleSelect(item)}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                ) : (
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(item.id)} className="h-8 w-8">
                        <X className="h-4 w-4 text-destructive" />
                    </Button>
                )}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Available Items Pane */}
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Available Items</h3>
                    <Input 
                        placeholder="Search by name or serial number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <ScrollArea className="h-72 w-full rounded-md border">
                        <div className="p-2">
                        {filteredAvailableItems.length > 0 ? (
                            filteredAvailableItems.map(item => renderItem(item, 'add'))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center p-4">No available items match your search.</p>
                        )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Selected Items Pane (Cart) */}
                 <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center">
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Issuance Cart
                    </h3>
                    <Card className="h-80">
                      <CardContent className="p-0 h-full">
                        <ScrollArea className="h-full">
                          <div className="p-2">
                            {selectedItems.length === 0 ? (
                                <div className="flex items-center justify-center h-full min-h-72">
                                <p className="text-sm text-muted-foreground text-center p-4">
                                    Select items from the left to add them here.
                                </p>
                                </div>
                            ) : (
                                selectedItems.map(item => renderItem(item, 'remove'))
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={selectedItems.length === 0}>
                    Issue {selectedItems.length} Item(s)
                </Button>
            </DialogFooter>
        </form>
    );
}

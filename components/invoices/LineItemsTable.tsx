"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { InvoiceLineItem } from "@/types/crm";

interface LineItemsTableProps {
    items: InvoiceLineItem[];
    currency: string;
    onItemsChange: (items: InvoiceLineItem[]) => void;
    disabled?: boolean;
}

export function LineItemsTable({
    items,
    currency,
    onItemsChange,
    disabled = false,
}: LineItemsTableProps) {
    const handleAddItem = () => {
        const newItem: InvoiceLineItem = {
            id: `item-${Date.now()}`,
            description: "",
            quantity: 1,
            price: 0,
            taxRate: 0,
            total: 0,
        };
        onItemsChange([...items, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        onItemsChange(items.filter((item) => item.id !== id));
    };

    const handleItemChange = (
        id: string,
        field: keyof InvoiceLineItem,
        value: string | number
    ) => {
        const updatedItems = items.map((item) => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };

                // Auto-calculate total
                if (field === "quantity" || field === "price" || field === "taxRate") {
                    const qty = field === "quantity" ? Number(value) : item.quantity;
                    const price = field === "price" ? Number(value) : item.price;
                    const taxRate = field === "taxRate" ? Number(value) : item.taxRate;

                    const subtotal = qty * price;
                    const tax = subtotal * (taxRate / 100);
                    updated.total = subtotal + tax;
                }

                return updated;
            }
            return item;
        });

        onItemsChange(updatedItems);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    disabled={disabled}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2 font-medium text-sm">Description</th>
                                <th className="text-center p-2 font-medium text-sm w-24">Qty</th>
                                <th className="text-right p-2 font-medium text-sm w-32">Price</th>
                                <th className="text-center p-2 font-medium text-sm w-24">Tax %</th>
                                <th className="text-right p-2 font-medium text-sm w-32">Total</th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No items added. Click "Add Item" to get started.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="p-2">
                                            <Input
                                                value={item.description}
                                                onChange={(e) =>
                                                    handleItemChange(item.id, "description", e.target.value)
                                                }
                                                placeholder="Item description"
                                                disabled={disabled}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    handleItemChange(item.id, "quantity", e.target.value)
                                                }
                                                className="text-center"
                                                disabled={disabled}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.price}
                                                onChange={(e) =>
                                                    handleItemChange(item.id, "price", e.target.value)
                                                }
                                                className="text-right"
                                                disabled={disabled}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={item.taxRate}
                                                onChange={(e) =>
                                                    handleItemChange(item.id, "taxRate", e.target.value)
                                                }
                                                className="text-center"
                                                disabled={disabled}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <div className="text-right font-medium">
                                                {currency} {item.total.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveItem(item.id)}
                                                disabled={disabled}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals Summary */}
                {items.length > 0 && (
                    <div className="mt-4 flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Items:</span>
                                <span className="font-medium">{items.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-medium">
                                    {currency}{" "}
                                    {items
                                        .reduce((sum, item) => sum + item.quantity * item.price, 0)
                                        .toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax:</span>
                                <span className="font-medium">
                                    {currency}{" "}
                                    {items
                                        .reduce(
                                            (sum, item) =>
                                                sum +
                                                item.quantity * item.price * (item.taxRate / 100),
                                            0
                                        )
                                        .toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-2">
                                <span>Total:</span>
                                <span>
                                    {currency} {items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Calculator } from "lucide-react";

export function InvoiceLineItems() {
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Line Items</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {fields.length} Items
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => append({ description: "", quantity: 1, price: 0, total: 0, taxRate: 0 })}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
                <div className="grid grid-cols-12 gap-4 p-3 bg-muted/40 font-semibold text-xs text-muted-foreground uppercase tracking-wider border-b dark:border-b-gray-700 ">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Total</div>
                </div>

                <div className="divide-y">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-4 p-3 items-start hover:bg-muted/10 transition-colors group">
                            <div className="col-span-6">
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input {...field} placeholder="Item or Service description" className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-offset-0 p-0 h-auto font-medium bg-transparent" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0.1"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                    className="text-right border-0 shadow-none focus-visible:ring-1 focus-visible:ring-offset-0 p-0 h-auto bg-transparent"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.price`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                    className="text-right border-0 shadow-none focus-visible:ring-1 focus-visible:ring-offset-0 p-0 h-auto bg-transparent"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-2">
                                <span className="text-sm font-mono font-medium">
                                    {(form.watch(`lineItems.${index}.quantity`) * form.watch(`lineItems.${index}.price`)).toFixed(2)}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {fields.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground bg-muted/10 border-dashed">
                            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No line items yet. Click "Add Item" to create one.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

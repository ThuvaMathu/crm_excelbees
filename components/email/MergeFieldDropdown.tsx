"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search } from "lucide-react";
import { mergeFieldCategories } from "@/lib/email/merge-fields";
import type { MergeFieldDefinition } from "@/types/email";

interface MergeFieldDropdownProps {
    onInsertField: (field: MergeFieldDefinition) => void;
    disabled?: boolean;
}

export function MergeFieldDropdown({
    onInsertField,
    disabled = false,
}: MergeFieldDropdownProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleInsert = (field: MergeFieldDefinition) => {
        onInsertField(field);
        setOpen(false);
        setSearchQuery("");
    };

    // Filter fields based on search
    const filteredCategories = Object.entries(mergeFieldCategories).reduce(
        (acc, [key, category]) => {
            const filteredFields = category.fields.filter(
                (field) =>
                    field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    field.key.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredFields.length > 0) {
                acc[key] = {
                    ...category,
                    fields: filteredFields,
                };
            }

            return acc;
        },
        {} as typeof mergeFieldCategories
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Insert Field
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0" align="start">
                <div className="p-3 border-b bg-slate-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search fields..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>

                <ScrollArea className="h-[420px]">
                    <div className="p-3 space-y-4">
                        {Object.entries(filteredCategories).map(([key, category]) => (
                            <div key={key}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    {category.label}
                                </div>
                                <div className="space-y-1 mt-2">
                                    {category.fields.map((field) => (
                                        <button
                                            key={field.key}
                                            type="button"
                                            onClick={() => handleInsert(field)}
                                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-slate-900 group-hover:text-purple-700">
                                                        {field.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        Example: {field.example}
                                                    </div>
                                                </div>
                                                <code className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded font-mono shrink-0">
                                                    {`{{${field.key}}}`}
                                                </code>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {Object.keys(filteredCategories).length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No fields found</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

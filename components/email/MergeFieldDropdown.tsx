"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-md"
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Insert Field
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[460px] p-0 shadow-2xl border-2 border-orange-200"
                align="end"
                side="bottom"
                sideOffset={8}
            >
                <div className="p-4 border-b-2 border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 sticky top-0 z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2 rounded-lg shadow-md">
                            <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Insert Merge Field</h3>
                            <p className="text-xs text-slate-500">Personalize your email with dynamic data</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search fields..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 bg-white border-slate-200 focus:border-orange-400 focus:ring-orange-400"
                        />
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    <div className="p-3 space-y-3">
                        {Object.entries(filteredCategories).map(([key, category]) => (
                            <div key={key}>
                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg mb-2 border border-orange-200">
                                    <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-amber-600 rounded-full"></div>
                                    <span className="text-xs font-bold text-orange-900 uppercase tracking-wide">
                                        {category.label}
                                    </span>
                                    <span className="ml-auto text-xs text-orange-600 font-semibold">
                                        {category.fields.length}
                                    </span>
                                </div>
                                <div className="space-y-1.5 pl-1">
                                    {category.fields.map((field) => (
                                        <button
                                            key={field.key}
                                            type="button"
                                            onClick={() => handleInsert(field)}
                                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-orange-50 hover:border-orange-300 border border-slate-200 transition-all group bg-white"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-slate-900 group-hover:text-orange-700 mb-0.5">
                                                        {field.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        Example: <span className="text-slate-700 font-medium">{field.example}</span>
                                                    </div>
                                                </div>
                                                <code className="text-xs text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md font-mono shrink-0 border border-orange-200 group-hover:bg-orange-100">
                                                    {`{{${field.key}}}`}
                                                </code>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {Object.keys(filteredCategories).length === 0 && (
                            <div className="text-center py-16 text-slate-400">
                                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Search className="h-8 w-8 text-slate-400" />
                                </div>
                                <p className="text-sm font-semibold text-slate-600">No fields found</p>
                                <p className="text-xs mt-1 text-slate-500">Try a different search term</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-3 border-t-2 border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
                    <p className="text-xs text-slate-600 text-center">
                        💡 <span className="font-medium">Tip:</span> Fields will be replaced with actual data when sending
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}

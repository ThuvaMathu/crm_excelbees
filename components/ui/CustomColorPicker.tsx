"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CustomColorPickerProps {
    value: string;
    onChange: (value: string) => void;
}

const presetColors = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#22C55E" },
    { name: "Purple", value: "#9333EA" },
    { name: "Red", value: "#EF4444" },
    { name: "Orange", value: "#F97316" },
    { name: "Teal", value: "#14B8A6" },
];

export function CustomColorPicker({ value, onChange }: CustomColorPickerProps) {
    return (
        <div className="space-y-3">
            <Label>Color Theme</Label>

            {/* Color Input */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="sr-only"
                        id="color-picker-input"
                    />
                    <label
                        htmlFor="color-picker-input"
                        className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-muted p-3 hover:border-primary/50 transition-colors"
                    >
                        <div
                            className="w-12 h-12 rounded-lg border-2 border-white shadow-md"
                            style={{ backgroundColor: value }}
                        />
                        <div>
                            <p className="text-sm font-medium">Selected Color</p>
                            <p className="text-xs text-muted-foreground font-mono">{value.toUpperCase()}</p>
                        </div>
                    </label>
                </div>

                {/* Hex Input */}
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        const hex = e.target.value;
                        if (/^#[0-9A-F]{0,6}$/i.test(hex)) {
                            onChange(hex);
                        }
                    }}
                    placeholder="#3B82F6"
                    className="w-28 font-mono uppercase"
                    maxLength={7}
                />
            </div>

            {/* Preset Colors */}
            <div>
                <p className="text-xs text-muted-foreground mb-2">Quick Select</p>
                <div className="grid grid-cols-6 gap-2">
                    {presetColors.map((preset) => (
                        <button
                            key={preset.value}
                            type="button"
                            onClick={() => onChange(preset.value)}
                            className={cn(
                                "w-full aspect-square rounded-lg border-2 transition-all",
                                "hover:scale-110 hover:shadow-md",
                                value === preset.value ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent"
                            )}
                            style={{ backgroundColor: preset.value }}
                            title={preset.name}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

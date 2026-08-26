"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface ColorThemePickerProps {
    value: "blue" | "green" | "purple";
    onChange: (value: "blue" | "green" | "purple") => void;
}

const themes = [
    {
        value: "blue" as const,
        label: "Blue",
        primary: "bg-blue-500",
        secondary: "bg-blue-100",
        gradient: "from-blue-500 to-blue-700",
    },
    {
        value: "green" as const,
        label: "Green",
        primary: "bg-green-500",
        secondary: "bg-green-100",
        gradient: "from-green-500 to-green-700",
    },
    {
        value: "purple" as const,
        label: "Purple",
        primary: "bg-purple-500",
        secondary: "bg-purple-100",
        gradient: "from-purple-500 to-purple-700",
    },
];

export function ColorThemePicker({ value, onChange }: ColorThemePickerProps) {
    return (
        <div className="space-y-3">
            <Label>Color Theme</Label>
            <RadioGroup value={value} onValueChange={onChange as (value: string) => void}>
                <div className="grid grid-cols-3 gap-4">
                    {themes.map((theme) => (
                        <div key={theme.value} className="relative">
                            <RadioGroupItem
                                value={theme.value}
                                id={theme.value}
                                className="peer sr-only"
                            />
                            <Label
                                htmlFor={theme.value}
                                className={cn(
                                    "flex flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 cursor-pointer transition-all",
                                    "hover:border-primary/50",
                                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                                )}
                            >
                                <div className={cn("w-12 h-12 rounded-full bg-gradient-to-br", theme.gradient)} />
                                <span className="text-sm font-medium">{theme.label}</span>
                            </Label>
                        </div>
                    ))}
                </div>
            </RadioGroup>
        </div>
    );
}

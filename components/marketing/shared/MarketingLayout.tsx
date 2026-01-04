import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MarketingLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
}

export function MarketingLayout({
    children,
    title,
    description,
    actions
}: MarketingLayoutProps) {
    return (
        <div className="flex flex-col h-full w-full">
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div>
                        <h1 className="text-lg font-semibold">{title}</h1>
                        {description && <p className="text-xs text-muted-foreground">{description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                {children}
            </main>
        </div>
    );
}

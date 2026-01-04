import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";

export default function MarketingSectionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MarketingLayout
            title="Marketing Suite"
            description="AI-powered tools to supercharge your growth engine."
        >
            {children}
        </MarketingLayout>
    );
}

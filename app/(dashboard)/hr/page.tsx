"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HRPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/hr/employees");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-muted-foreground">Redirecting...</div>
    </div>
  );
}

import { isDev, isMaintenance } from "@/lib/env";

export function EnvironmentBanner() {
  if (isDev) {
    return (
      <div className="sticky top-0 z-[9999] w-full bg-yellow-400 px-4 py-2 text-center text-sm font-semibold text-yellow-950">
        🚧 BETA — Development Environment. Not for production use.
      </div>
    );
  }

  if (isMaintenance) {
    return (
      <div className="sticky top-0 z-[9999] w-full bg-amber-600 px-4 py-2 text-center text-sm font-semibold text-white">
        🛠️ Maintenance in progress — sign-in and sign-up are temporarily unavailable.
      </div>
    );
  }

  return null;
}

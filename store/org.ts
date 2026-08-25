import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Organization, OrganizationMember, UserRole, UserPermissions } from "@/types/crm";

interface OrgState {
  // Currently active organization
  currentOrg: Organization | null;
  // Current user's member record for the active org (holds role + permissions)
  currentMember: OrganizationMember | null;
  // All orgs the user belongs to (for the org picker)
  userOrgs: Organization[];
  // Loading state while orgs are being fetched
  loading: boolean;

  // Actions
  setCurrentOrg: (org: Organization | null) => void;
  setCurrentMember: (member: OrganizationMember | null) => void;
  setUserOrgs: (orgs: Organization[]) => void;
  setLoading: (loading: boolean) => void;
  clearOrg: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      currentOrg: null,
      currentMember: null,
      userOrgs: [],
      loading: false,

      setCurrentOrg: (org) => set({ currentOrg: org }),
      setCurrentMember: (member) => set({ currentMember: member }),
      setUserOrgs: (orgs) => set({ userOrgs: orgs }),
      setLoading: (loading) => set({ loading }),
      clearOrg: () => set({ currentOrg: null, currentMember: null }),
    }),
    {
      name: "excelbees-org",
      // Only persist the current org selection; re-fetch membership on load
      partialize: (state) => ({ currentOrg: state.currentOrg }),
    }
  )
);

// Convenience selectors
export const useCurrentOrg = () => useOrgStore((s) => s.currentOrg);
export const useOrgRole = (): UserRole | undefined =>
  useOrgStore((s) => s.currentMember?.role);
export const useOrgPermissions = (): UserPermissions | undefined =>
  useOrgStore((s) => s.currentMember?.permissions);

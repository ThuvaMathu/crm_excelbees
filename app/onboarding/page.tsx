"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { updateUserProfile, getUserProfile } from "@/lib/firestore/users";
import { getUserOrganizations, createOrganization, generateSlug, generateUniqueOrgSlug } from "@/lib/firestore/organizations";
import { useOrgStore } from "@/store/org";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import {
    User, Phone, Briefcase, Building2, ArrowRight, Check,
} from "lucide-react";
import { toast } from "sonner";

// ─── Step definitions ─────────────────────────────────────────────────────────

type StepId = "profile" | "workspace";

const STEPS: { id: StepId; label: string; icon: React.ElementType }[] = [
    { id: "profile",   label: "Your Profile",  icon: User      },
    { id: "workspace", label: "Your Workspace", icon: Building2 },
];

// ─── Main wizard ──────────────────────────────────────────────────────────────

function OnboardingWizard() {
    const router     = useRouter();
    const { user, hydrated } = useAuth();
    const { setCurrentOrg } = useOrgStore();

    const [step,         setStep]         = useState<StepId>("profile");
    const [checkingOrgs, setCheckingOrgs] = useState(false);
    const [resuming,     setResuming]     = useState(true);

    // Profile step state
    const [firstName,  setFirstName]  = useState(user?.displayName?.split(" ")[0] ?? "");
    const [lastName,   setLastName]   = useState(user?.displayName?.split(" ").slice(1).join(" ") ?? "");
    const [phone,      setPhone]      = useState("");
    const [position,   setPosition]   = useState("");
    const [profileSaving, setProfileSaving] = useState(false);

    // Workspace step state
    const [orgName,     setOrgName]     = useState("");
    const [orgSlug,     setOrgSlug]     = useState("");
    const [slugEdited,  setSlugEdited]  = useState(false);
    const [workspaceSaving, setWorkspaceSaving] = useState(false);

    // Guard: redirect unauthenticated users to login, and already-onboarded
    // users directly to the org picker so they don't re-enter the wizard.
    useEffect(() => {
        if (!hydrated) return;
        if (!user) { router.replace("/login"); return; }
        if (user.isOnboarded === true) { router.replace("/org"); return; }
    }, [user, hydrated, router]);

    // Resume in-progress onboarding: the wizard's step is local component
    // state, so a refresh or interrupted navigation (e.g. after the profile
    // step saved but before a workspace was created) would otherwise always
    // restart at "profile" with blank fields. On mount, re-derive where the
    // user actually left off from Firestore instead of assuming step 1.
    useEffect(() => {
        if (!hydrated || !user) return;
        let cancelled = false;

        (async () => {
            const { user: profile } = await getUserProfile(user.uid);
            if (cancelled) return;

            if (profile) {
                setFirstName((prev) => prev || profile.firstName || "");
                setLastName((prev) => prev || profile.lastName || "");
                setPhone((prev) => prev || profile.phone || "");
                setPosition((prev) => prev || profile.position || "");
            }

            const profileComplete = !!(profile?.firstName && profile?.phone && profile?.position);
            if (!profileComplete) { setResuming(false); return; }

            // Profile step already completed in a previous session — check
            // whether a workspace was also already created before deciding
            // whether to resume on the workspace step or finish outright.
            const { orgs } = await getUserOrganizations(user.uid);
            if (cancelled) return;

            if (orgs && orgs.length > 0) {
                await finishOnboarding();
                return;
            }
            setStep("workspace");
            setResuming(false);
        })();

        return () => { cancelled = true; };
        // Only re-run when the user identity actually changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydrated, user?.uid]);

    // Pre-fill from Google display name when user data loads
    useEffect(() => {
        if (user?.displayName && !firstName) {
            const parts = user.displayName.split(" ");
            setFirstName(parts[0] ?? "");
            setLastName(parts.slice(1).join(" "));
        }
    }, [user?.uid]);

    const currentStepIndex = STEPS.findIndex((s) => s.id === step);

    // ── Step 1: Profile ───────────────────────────────────────────────────────

    async function handleProfileNext(e: React.FormEvent) {
        e.preventDefault();
        if (!firstName.trim() || !phone.trim() || !position.trim()) return;
        if (!user) return;

        const phoneDigits = phone.replace(/[^\d]/g, "");
        if (phoneDigits.length < 7 || !/^[\d\s()+.-]+$/.test(phone.trim())) {
            toast.error("Please enter a valid phone number (at least 7 digits).");
            return;
        }

        setProfileSaving(true);
        const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const { error } = await updateUserProfile(user.uid, {
            firstName:   firstName.trim(),
            lastName:    lastName.trim(),
            displayName,
            phone:       phone.trim(),
            position:    position.trim(),
        });
        setProfileSaving(false);

        if (error) { toast.error("Failed to save profile. Please try again."); return; }

        // Check if user already has org memberships (e.g. joined via invite)
        setCheckingOrgs(true);
        const { orgs } = await getUserOrganizations(user.uid);
        setCheckingOrgs(false);

        if (orgs && orgs.length > 0) {
            // Already in an org — skip workspace step
            await finishOnboarding();
        } else {
            setStep("workspace");
        }
    }

    // ── Step 2: Workspace ─────────────────────────────────────────────────────

    function handleOrgNameChange(value: string) {
        setOrgName(value);
        if (!slugEdited) setOrgSlug(generateSlug(value));
    }

    function handleOrgSlugChange(value: string) {
        setOrgSlug(generateSlug(value));
        setSlugEdited(true);
    }

    async function handleWorkspaceCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !orgName.trim()) return;

        setWorkspaceSaving(true);
        // Use unique slug: prefer user-edited slug, otherwise auto-generate with collision detection
        const slug = slugEdited && orgSlug.trim()
            ? orgSlug.trim()
            : await generateUniqueOrgSlug(orgName.trim());
        const { success, org, error } = await createOrganization(
            { name: orgName.trim(), slug },
            user.uid
        );
        setWorkspaceSaving(false);

        if (!success || !org) {
            toast.error(error || "Failed to create workspace. Please try again.");
            return;
        }

        setCurrentOrg(org);
        await finishOnboarding();
    }

    // ── Shared: mark onboarding complete ─────────────────────────────────────

    async function finishOnboarding() {
        if (!user) return;
        const { error } = await updateUserProfile(user.uid, { isOnboarded: true } as any);
        if (error) {
            toast.error("Failed to save onboarding status. Please try again.");
            return;
        }
        router.replace("/org");
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    if (!hydrated || resuming) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 flex items-center justify-center p-4">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Logo width={180} height={48} />
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-0 mb-8">
                    {STEPS.map((s, i) => {
                        const isDone    = STEPS.findIndex((x) => x.id === step) > i;
                        const isCurrent = s.id === step;
                        return (
                            <div key={s.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-colors",
                                        isDone    ? "bg-primary border-primary text-white"
                                        : isCurrent ? "border-primary bg-primary/10 text-primary"
                                        : "border-muted-foreground/30 text-muted-foreground/50 bg-transparent"
                                    )}>
                                        {isDone
                                            ? <Check className="h-4 w-4" />
                                            : <s.icon className="h-4 w-4" />
                                        }
                                    </div>
                                    <span className={cn(
                                        "text-xs mt-1.5 font-medium",
                                        isCurrent ? "text-primary" : "text-muted-foreground/60"
                                    )}>{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={cn(
                                        "h-0.5 w-16 mx-2 mb-5 rounded",
                                        isDone ? "bg-primary" : "bg-muted-foreground/20"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step panels */}
                <div className="bg-card rounded-2xl shadow-2xl border border-border p-8">

                    {/* ── Step 1: Profile ── */}
                    {step === "profile" && (
                        <form onSubmit={handleProfileNext} className="space-y-5">
                            <div className="text-center mb-2">
                                <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <h1 className="text-xl font-bold">Tell us about yourself</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    This helps your teammates know who you are.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="ob-fn">
                                        First Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="ob-fn"
                                        placeholder="Jane"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ob-ln">Last Name</Label>
                                    <Input
                                        id="ob-ln"
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ob-phone">
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5" />
                                        Phone Number <span className="text-destructive">*</span>
                                    </span>
                                </Label>
                                <Input
                                    id="ob-phone"
                                    type="tel"
                                    placeholder="+61 400 000 000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ob-position">
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase className="h-3.5 w-3.5" />
                                        Job Title / Position <span className="text-destructive">*</span>
                                    </span>
                                </Label>
                                <Input
                                    id="ob-position"
                                    placeholder="e.g. Sales Manager, Business Owner"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11"
                                disabled={profileSaving || checkingOrgs || !firstName.trim() || !phone.trim() || !position.trim()}
                            >
                                {(profileSaving || checkingOrgs)
                                    ? <LoadingSpinner size="sm" className="mr-2" />
                                    : <ArrowRight className="h-4 w-4 mr-2" />
                                }
                                {profileSaving ? "Saving…" : checkingOrgs ? "Checking…" : "Continue"}
                            </Button>
                        </form>
                    )}

                    {/* ── Step 2: Workspace ── */}
                    {step === "workspace" && (
                        <form onSubmit={handleWorkspaceCreate} className="space-y-5">
                            <div className="text-center mb-2">
                                <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <h1 className="text-xl font-bold">Create your workspace</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Set up your organization to start managing your CRM.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ob-org-name">
                                    Organization Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="ob-org-name"
                                    placeholder="e.g. Excelbees Pty Ltd"
                                    value={orgName}
                                    onChange={(e) => handleOrgNameChange(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ob-org-slug">Workspace URL</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                        excelbees.com/org/
                                    </span>
                                    <Input
                                        id="ob-org-slug"
                                        placeholder="excelbees-inc"
                                        value={orgSlug}
                                        onChange={(e) => handleOrgSlugChange(e.target.value)}
                                        className="flex-1"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Lowercase letters, numbers, and hyphens only.
                                </p>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setStep("profile")}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-11"
                                    disabled={workspaceSaving || !orgName.trim()}
                                >
                                    {workspaceSaving
                                        ? <LoadingSpinner size="sm" className="mr-2" />
                                        : <ArrowRight className="h-4 w-4 mr-2" />
                                    }
                                    {workspaceSaving ? "Creating…" : "Create Workspace"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-muted-foreground mt-5">
                    Step {currentStepIndex + 1} of {STEPS.length}
                </p>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <AuthProvider>
            <OnboardingWizard />
        </AuthProvider>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Logo } from "@/components/ui/logo";
import { verifyInviteAction, acceptInviteAction } from "@/app/actions/invite-actions";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth/auth-service";
import { createUserProfile } from "@/lib/firestore/users";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { toast } from "sonner";
import { Building2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { logger } from "@/lib/logger/client";

type Step = "loading" | "invalid" | "sign-in" | "ready" | "accepting" | "done";
type AuthMode = "sign-in" | "sign-up";

interface InviteInfo {
    organizationId:   string;
    organizationName: string;
    role:             string;
    expiresAt:        string;
}

export default function InviteAcceptancePage() {
    const { token }  = useParams<{ token: string }>();
    const router     = useRouter();

    const [step,       setStep]       = useState<Step>("loading");
    const [invite,     setInvite]     = useState<InviteInfo | null>(null);
    const [inviteError,setInviteError] = useState<string | null>(null);
    const [currentUser,setCurrentUser] = useState<User | null | undefined>(undefined);

    // Auth form state
    const [authMode,   setAuthMode]   = useState<AuthMode>("sign-in");
    const [email,      setEmail]      = useState("");
    const [password,   setPassword]   = useState("");
    const [firstName,  setFirstName]  = useState("");
    const [lastName,   setLastName]   = useState("");
    const [authBusy,   setAuthBusy]   = useState(false);
    const [authError,  setAuthError]  = useState<string | null>(null);

    // ── 1. Verify invite on mount ─────────────────────────────────────────────

    useEffect(() => {
        verifyInviteAction(token).then((res) => {
            if (res.valid && res.organizationId) {
                setInvite({
                    organizationId:   res.organizationId,
                    organizationName: res.organizationName!,
                    role:             res.role!,
                    expiresAt:        res.expiresAt!,
                });
            } else {
                setInviteError(res.error ?? "Invalid invite link.");
                setStep("invalid");
            }
        }).catch((err) => {
            // Without this, a failed/slow server action call left the page
            // stuck on "Verifying invite link…" forever with no way out.
            logger.error("verifyInviteAction failed", { module: "auth", action: "verify", error: err });
            setInviteError("Something went wrong while verifying this invite. Please try again.");
            setStep("invalid");
        });
    }, [token]);

    // ── 2. Watch auth state once invite is known ──────────────────────────────

    useEffect(() => {
        if (!invite) return;
        const unsub = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setStep(user ? "ready" : "sign-in");
        });
        return unsub;
    }, [invite]);

    // ── Accept invite ─────────────────────────────────────────────────────────

    async function handleAccept() {
        if (!currentUser || !invite) return;
        setStep("accepting");
        const userToken = await currentUser.getIdToken(true);
        const result    = await acceptInviteAction({ token, userToken });

        if (result.success) {
            setStep("done");
            // AuthGate will redirect to /onboarding if isOnboarded is false,
            // then on to /org after completion. For existing users, it goes straight to the org.
            setTimeout(() => router.replace("/org"), 1500);
        } else if (result.error?.includes("already a member")) {
            setStep("done");
            setTimeout(() => router.replace("/org"), 1500);
        } else {
            toast.error(result.error ?? "Failed to accept invite.");
            setStep("ready");
        }
    }

    // ── Auth handlers ─────────────────────────────────────────────────────────

    async function handleSignIn(e: React.FormEvent) {
        e.preventDefault();
        setAuthBusy(true); setAuthError(null);
        const { error } = await signInWithEmail(email, password);
        setAuthBusy(false);
        if (error) setAuthError(error);
        // auth state change will move to "ready"
    }

    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault();
        if (!firstName.trim()) { setAuthError("First name is required."); return; }
        setAuthBusy(true); setAuthError(null);
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const { user: newUser, error } = await signUpWithEmail(email, password, fullName);
        if (error) { setAuthError(error); setAuthBusy(false); return; }
        // Create Firestore user doc so AuthProvider/AuthGate can read isOnboarded
        if (newUser) {
            await createUserProfile(newUser.uid, {
                email,
                displayName: fullName,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                role: "team",
                provider: "password",
                isFirstLogin: false,
            });
        }
        setAuthBusy(false);
        // auth state change will move to "ready"
    }

    async function handleGoogleSignIn() {
        setAuthBusy(true); setAuthError(null);
        const { user: googleUser, isNewUser, error } = await signInWithGoogle();
        if (error) { setAuthError(error); setAuthBusy(false); return; }
        // Create Firestore doc for brand-new Google users
        if (googleUser && isNewUser) {
            await createUserProfile(googleUser.uid, {
                email: googleUser.email ?? "",
                displayName: googleUser.displayName ?? "",
                photoURL: googleUser.photoURL ?? "",
                role: "team",
                provider: "google.com",
                isFirstLogin: false,
            });
        }
        setAuthBusy(false);
    }

    // ── Render helpers ────────────────────────────────────────────────────────

    const roleLabel = invite?.role === "manager" ? "Manager" : "Team Member";

    // Note: `currentUser` is intentionally not part of this guard. It's only
    // ever set together with `step` inside the onAuthStateChanged callback
    // below (which itself only runs once a *valid* invite is confirmed), so
    // by the time `step` moves off "loading", currentUser is already
    // resolved. Checking `currentUser === undefined` here as well used to
    // create a permanent deadlock for invalid invites (expired/used/not
    // found): `step` correctly became "invalid", but the auth-watching
    // effect — the only place currentUser leaves its initial `undefined` —
    // never even started because it's gated on `invite` being set, which
    // never happens on an invalid invite. Result: the page was stuck on
    // "Verifying invite link…" forever despite verification having finished.
    if (step === "loading") {
        return (
            <PageShell>
                <div className="flex flex-col items-center gap-3 py-12">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-muted-foreground">Verifying invite link…</p>
                </div>
            </PageShell>
        );
    }

    if (step === "invalid") {
        return (
            <PageShell>
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <XCircle className="h-12 w-12 text-destructive" />
                    <h2 className="text-lg font-semibold">Invite Invalid</h2>
                    <p className="text-sm text-muted-foreground max-w-sm">{inviteError}</p>
                    <Button variant="outline" className="mt-2" onClick={() => router.push("/login")}>
                        Go to Login
                    </Button>
                </div>
            </PageShell>
        );
    }

    if (step === "done") {
        return (
            <PageShell>
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <h2 className="text-lg font-semibold">You&apos;re in!</h2>
                    <p className="text-sm text-muted-foreground">
                        Redirecting to {invite?.organizationName}…
                    </p>
                    <LoadingSpinner size="sm" className="mt-1" />
                </div>
            </PageShell>
        );
    }

    if (step === "accepting") {
        return (
            <PageShell>
                <div className="flex flex-col items-center gap-3 py-12">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-muted-foreground">Joining workspace…</p>
                </div>
            </PageShell>
        );
    }

    if (step === "ready" && invite) {
        return (
            <PageShell>
                <div className="space-y-6 py-4">
                    {/* Invite card */}
                    <div className="flex items-start gap-4 rounded-xl border bg-muted/40 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">You&apos;ve been invited to join</p>
                            <p className="font-semibold text-lg leading-tight">{invite.organizationName}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                as a <span className="font-medium text-foreground">{roleLabel}</span>
                            </p>
                        </div>
                    </div>

                    {/* Signed in as */}
                    <div className="text-sm text-muted-foreground text-center">
                        Signing in as <span className="font-medium text-foreground">{currentUser?.email}</span>
                    </div>

                    <Button className="w-full gap-2" onClick={handleAccept}>
                        Accept Invite
                        <ArrowRight className="h-4 w-4" />
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        Expires {new Date(invite.expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </p>
                </div>
            </PageShell>
        );
    }

    // step === "sign-in"
    return (
        <PageShell>
            <div className="space-y-5 py-2">
                {invite && (
                    <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                        <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">{invite.organizationName}</p>
                            <p className="text-xs text-muted-foreground">Invited as {roleLabel}</p>
                        </div>
                    </div>
                )}

                {/* Google sign-in */}
                <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleGoogleSignIn}
                    disabled={authBusy}
                >
                    {authBusy ? <LoadingSpinner size="sm" /> : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                    )}
                    Continue with Google
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                </div>

                {/* Toggle */}
                <div className="flex rounded-lg border p-1 gap-1">
                    <button
                        className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${authMode === "sign-in" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => { setAuthMode("sign-in"); setAuthError(null); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${authMode === "sign-up" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => { setAuthMode("sign-up"); setAuthError(null); }}
                    >
                        Create Account
                    </button>
                </div>

                {authMode === "sign-in" ? (
                    <form onSubmit={handleSignIn} className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="inv-email">Email</Label>
                            <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="inv-pw">Password</Label>
                            <Input id="inv-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        {authError && <p className="text-xs text-destructive">{authError}</p>}
                        <Button type="submit" className="w-full" disabled={authBusy}>
                            {authBusy && <LoadingSpinner size="sm" className="mr-2" />}
                            Sign In &amp; Accept
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleSignUp} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="inv-fn">First Name</Label>
                                <Input id="inv-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="inv-ln">Last Name</Label>
                                <Input id="inv-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="inv-email2">Email</Label>
                            <Input id="inv-email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="inv-pw2">Password</Label>
                            <Input id="inv-pw2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                        </div>
                        {authError && <p className="text-xs text-destructive">{authError}</p>}
                        <Button type="submit" className="w-full" disabled={authBusy}>
                            {authBusy && <LoadingSpinner size="sm" className="mr-2" />}
                            Create Account &amp; Accept
                        </Button>
                    </form>
                )}
            </div>
        </PageShell>
    );
}

function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex justify-center">
                    <Logo width={140} height={36} />
                </div>
                <Card>
                    <CardContent className="pt-6">{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}

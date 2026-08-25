"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, updateUserProfile } from "@/lib/firestore/users";
import { uploadUserProfileImage } from "@/lib/storage/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Save } from "lucide-react";
import { toast } from "sonner";
import type { UserProfile } from "@/lib/firestore/users";
import { toJsDate } from "@/lib/utils";

export default function ProfilePage() {
    const { user }     = useAuth();
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile]     = useState<UserProfile | null>(null);
    const [formData, setFormData]   = useState({
        displayName: "",
        firstName:   "",
        lastName:    "",
        phone:       "",
    });

    useEffect(() => { if (user) fetchProfile(); }, [user]);

    const fetchProfile = async () => {
        if (!user) return;
        setLoading(true);
        const { user: userProfile } = await getUserProfile(user.uid);
        if (userProfile) {
            setProfile(userProfile);
            setFormData({
                displayName: userProfile.displayName || "",
                firstName:   userProfile.firstName   || "",
                lastName:    userProfile.lastName    || "",
                phone:       userProfile.phone       || "",
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        const { success, error } = await updateUserProfile(user.uid, {
            displayName: formData.displayName,
            firstName:   formData.firstName,
            lastName:    formData.lastName,
            phone:       formData.phone,
        });
        setSaving(false);
        if (success) { toast.success("Profile updated!"); fetchProfile(); }
        else toast.error("Failed to update: " + error);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files?.[0]) return;
        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) { toast.error("Upload an image file."); return; }
        if (file.size > 5 * 1024 * 1024)    { toast.error("Max size is 5MB."); return; }
        setUploading(true);
        const { url, error } = await uploadUserProfileImage(user.uid, file);
        if (url) {
            await updateUserProfile(user.uid, { photoURL: url });
            toast.success("Photo updated!");
            fetchProfile();
        } else {
            toast.error("Upload failed: " + error);
        }
        setUploading(false);
    };

    const field = (key: keyof typeof formData) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((f) => ({ ...f, [key]: e.target.value }));

    return (
        <>
            {/* Page heading */}
            <div className="px-8 pt-8 pb-4 border-b border-border shrink-0">
                <h1 className="text-xl font-semibold text-foreground">My Profile</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage your personal information.
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="max-w-2xl grid gap-6 md:grid-cols-3">

                        {/* Avatar */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Profile Photo</CardTitle>
                                <CardDescription className="text-xs">Upload your photo</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={profile?.photoURL || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                                        {profile?.displayName?.charAt(0)?.toUpperCase() ?? "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <input
                                    type="file"
                                    id="profile-photo"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => document.getElementById("profile-photo")?.click()}
                                    disabled={uploading}
                                >
                                    {uploading
                                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading…</>
                                        : <><Upload className="h-4 w-4 mr-2" />Upload Photo</>
                                    }
                                </Button>
                                <p className="text-xs text-muted-foreground">Max 5 MB</p>
                            </CardContent>
                        </Card>

                        {/* Personal info */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-sm">Personal Information</CardTitle>
                                <CardDescription className="text-xs">Update your details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="firstName" className="text-xs">First Name</Label>
                                        <Input id="firstName" value={formData.firstName} placeholder="John" onChange={field("firstName")} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                                        <Input id="lastName" value={formData.lastName} placeholder="Doe" onChange={field("lastName")} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="displayName" className="text-xs">Display Name</Label>
                                    <Input id="displayName" value={formData.displayName} placeholder="John Doe" onChange={field("displayName")} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Email</Label>
                                    <Input value={user?.email ?? ""} disabled className="bg-muted" />
                                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs">Phone</Label>
                                    <Input id="phone" type="tel" value={formData.phone} placeholder="+1 (555) 123-4567" onChange={field("phone")} />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button onClick={handleSave} disabled={saving} size="sm">
                                        {saving
                                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                                            : <><Save className="h-4 w-4 mr-2" />Save Changes</>
                                        }
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account details */}
                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle className="text-sm">Account Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Role</p>
                                        <p className="text-sm font-semibold capitalize mt-0.5">{profile?.role ?? "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <p className="text-sm font-semibold capitalize mt-0.5">{profile?.status ?? "active"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Member Since</p>
                                        <p className="text-sm font-semibold mt-0.5">
                                            {toJsDate(profile?.createdAt)?.toLocaleDateString() ?? "—"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </>
    );
}

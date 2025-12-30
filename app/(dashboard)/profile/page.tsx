"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, updateUserProfile, type UserProfile } from "@/lib/firestore/users";
import { uploadUserProfileImage } from "@/lib/storage/users";
import { User, Mail, Phone, Briefcase, Upload, Save } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState({
        displayName: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        employeeId: "",
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user) return;

        setLoading(true);
        const { user: userProfile } = await getUserProfile(user.uid);

        if (userProfile) {
            setProfile(userProfile);
            setFormData({
                displayName: userProfile.displayName || "",
                firstName: userProfile.firstName || "",
                lastName: userProfile.lastName || "",
                email: userProfile.email || "",
                phone: userProfile.phone || "",
                employeeId: userProfile.employeeId || "",
            });
        }
        setLoading(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        setUploading(true);

        const { url, error } = await uploadUserProfileImage(user.uid, file);

        if (error) {
            toast.error("Failed to upload image: " + error);
            setUploading(false);
            return;
        }

        if (url) {
            // Update profile with new image URL
            const { success } = await updateUserProfile(user.uid, { photoURL: url });

            if (success) {
                toast.success("Profile image updated!");
                fetchProfile();
            } else {
                toast.error("Failed to update profile");
            }
        }

        setUploading(false);
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);

        const { success, error } = await updateUserProfile(user.uid, {
            displayName: formData.displayName,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            employeeId: formData.employeeId,
        });

        setSaving(false);

        if (success) {
            toast.success("Profile updated successfully!");
            fetchProfile();
        } else {
            toast.error("Failed to update profile: " + error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Profile"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Profile" },
                ]}
                description="Manage your personal information and settings"
            />

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Image Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Picture</CardTitle>
                        <CardDescription>Upload your profile photo</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4">
                        <Avatar className="h-32 w-32">
                            <AvatarImage src={profile?.photoURL || undefined} />
                            <AvatarFallback className="bg-primary text-white text-3xl">
                                {profile?.displayName?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="w-full">
                            <input
                                type="file"
                                id="profile-image"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => document.getElementById("profile-image")?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Photo
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                Max size: 5MB
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Information Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your personal details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    placeholder="John"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="employeeId">Employee ID</Label>
                            <Input
                                id="employeeId"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleInputChange}
                                placeholder="EMP-001"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90"
                            >
                                {saving ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Information Card */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>View your account details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Role</p>
                                <p className="text-sm font-semibold capitalize">
                                    {profile?.role || "N/A"}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                <p className="text-sm font-semibold capitalize">
                                    {profile?.status || "N/A"}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                                <p className="text-sm font-semibold">
                                    {profile?.createdAt
                                        ? new Date(profile.createdAt.toDate()).toLocaleDateString()
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

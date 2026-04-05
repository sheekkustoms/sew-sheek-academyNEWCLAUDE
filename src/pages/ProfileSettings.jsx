import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, AlertCircle, Upload, Trash2, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDisplayName, updateUserDisplayName } from "@/components/shared/useDisplayName";
import { toast } from "sonner";
import ImageCropModal from "@/components/shared/ImageCropModal";
import NotificationSettings from "@/components/shared/NotificationSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);

  // Fetch current user
   const { data: user, isLoading: userLoading } = useQuery({
     queryKey: ["currentUser"],
     queryFn: async () => {
       const u = await base44.auth.me();
       console.log("[ProfileSettings] User fetched:", {
         userId: u.id,
         email: u.email,
         displayName: u.display_name,
         fullName: u.full_name,
       });
       return u;
     },
   });

   // Initialize form with fresh user data whenever user changes
   useEffect(() => {
     if (user) {
       const displayNameValue = getDisplayName(user);
       console.log("[ProfileSettings] Initializing form:", {
         userId: user.id,
         displayName: displayNameValue,
       });
       setDisplayName(displayNameValue);
       setOriginalName(displayNameValue);
       setError("");
       setSuccess(false);
     }
   }, [user]);

  const [notifStatus, setNotifStatus] = useState(Notification.permission);
  const [subscribing, setSubscribing] = useState(false);

  const handleEnableNotifications = async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission);
      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
          const keyResponse = await base44.functions.invoke('getVAPIDPublicKey', {});
          const vapidPublicKey = keyResponse.data?.publicKey;
          const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
          const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const applicationServerKey = new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
          subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
        }
        await base44.functions.invoke('subscribeToNotifications', { subscription: subscription.toJSON() });
        toast.success("Push notifications enabled!");
      }
    } catch (e) {
      toast.error("Could not enable notifications.");
    }
    setSubscribing(false);
  };

  const hasChanges = displayName.trim() !== originalName.trim();
  const isDisabled = saving || !hasChanges || !displayName.trim();

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error("Please select a valid image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    const url = URL.createObjectURL(file);
    setCropImageUrl(url);
    e.target.value = "";
  };

  const handleCroppedPhoto = async (blob) => {
    setCropImageUrl(null);
    setUploadingPhoto(true);
    try {
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
      const response = await base44.integrations.Core.UploadFile({ file });
      const newAvatarUrl = response.file_url;
      await base44.auth.updateMe({ avatar_url: newAvatarUrl });

      // Sync avatar to all community posts and comments
      const [userPosts, userComments] = await Promise.all([
        base44.entities.CommunityPost.filter({ author_email: user.email }),
        base44.entities.Comment.filter({ author_email: user.email }),
      ]);
      await Promise.all([
        ...userPosts.map(p => base44.entities.CommunityPost.update(p.id, { author_avatar: newAvatarUrl })),
        ...userComments.map(c => base44.entities.Comment.update(c.id, { author_avatar: newAvatarUrl })),
      ]);

      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Profile photo updated!");
    } catch (err) {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Display name cannot be empty");
      return;
    }

    const trimmedName = displayName.trim();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
       console.log("[ProfileSettings] Starting save:", {
         userId: user.id,
         email: user.email,
         oldName: originalName,
         newName: trimmedName,
       });

       // Step 1: Update user's display_name via auth (writes to auth system)
       await updateUserDisplayName(trimmedName);

       // Step 2: Update UserPoints record (for leaderboard/community display)
       console.log("[ProfileSettings] Step 2: Updating UserPoints...");
       const userPointsRecords = await base44.entities.UserPoints.filter({
         user_email: user.email,
       });
       if (userPointsRecords?.length > 0) {
         await base44.entities.UserPoints.update(userPointsRecords[0].id, {
           user_name: trimmedName,
         });
         console.log("[ProfileSettings] UserPoints updated");
       }

       // Step 3: Update CommunityPost records
       console.log("[ProfileSettings] Step 3: Updating CommunityPost records...");
       const userPosts = await base44.entities.CommunityPost.filter({
         author_email: user.email,
       });
       if (userPosts?.length > 0) {
         await Promise.all(
           userPosts.map((post) =>
             base44.entities.CommunityPost.update(post.id, {
               author_name: trimmedName,
             })
           )
         );
         console.log("[ProfileSettings] All CommunityPost records updated");
       }

       // Step 4: Update Comment records
       console.log("[ProfileSettings] Step 4: Updating Comment records...");
       const userComments = await base44.entities.Comment.filter({
         author_email: user.email,
       });
       if (userComments?.length > 0) {
         await Promise.all(
           userComments.map((comment) =>
             base44.entities.Comment.update(comment.id, {
               author_name: trimmedName,
             })
           )
         );
         console.log("[ProfileSettings] All Comment records updated");
       }

       // Step 5: Invalidate all related queries to force fresh data
       console.log("[ProfileSettings] Step 5: Invalidating all related queries...");
       queryClient.invalidateQueries({ queryKey: ["currentUser"] });
       queryClient.invalidateQueries({ queryKey: ["myPoints"] });
       queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
       queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
       queryClient.invalidateQueries({ queryKey: ["comments"] });
       queryClient.invalidateQueries({ queryKey: ["userDisplayName"] });

      // Step 6: Update local state and show success
      setDisplayName(trimmedName);
      setOriginalName(trimmedName);
      setSuccess(true);
      toast.success("Display name updated successfully!");
      console.log("[ProfileSettings] Save completed successfully");
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      const errorMsg = err.message || "Failed to save display name. Please try again.";
      console.error("[ProfileSettings] Save failed:", errorMsg);
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-700" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-pink-500 mb-2">
          Account Settings
        </h1>
        <p className="text-sm text-pink-500">
          Manage your profile information
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 space-y-8">
        {/* Profile Photo Section */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-900">
            Profile Photo
          </label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                  {(user?.full_name || user?.email)?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="photo-upload" className="block">
                <Button
                  asChild
                  variant="outline"
                  className="cursor-pointer border-gray-200 hover:bg-gray-50"
                  disabled={uploadingPhoto}
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {uploadingPhoto ? "Uploading..." : "Change Photo"}
                  </span>
                </Button>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                disabled={uploadingPhoto}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF (max 5MB)</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200" />

        {/* Display Name Section */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-900">
              Display Name
            </label>
            <p className="text-xs text-pink-500 mt-0.5">
              This name appears across the community, leaderboard, and all your
              activity
            </p>
          </div>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name..."
            disabled={saving}
            className="h-11 text-base border-gray-200 focus:border-pink-500 focus:ring-pink-500/20"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200" />

        {/* Read-Only Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-pink-500 uppercase tracking-wide">
              Email Address
            </label>
            <div className="h-11 bg-gray-100 border border-gray-200 rounded-lg px-4 flex items-center">
              <span className="text-base text-gray-900">{user?.email}</span>
            </div>
            <p className="text-xs text-pink-500">Cannot be changed</p>
          </div>

          {/* User ID */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-pink-500 uppercase tracking-wide">
              User ID
            </label>
            <div className="h-11 bg-gray-100 border border-gray-200 rounded-lg px-4 flex items-center">
              <span className="text-xs text-gray-900 font-mono">
                {user?.id}
              </span>
            </div>
            <p className="text-xs text-pink-500">System generated</p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-pink-500 uppercase tracking-wide">
              Account Type
            </label>
            <div className="h-11 bg-gray-100 border border-gray-200 rounded-lg px-4 flex items-center">
              <span className="text-base text-gray-900 capitalize">
                {user?.role || "User"}
              </span>
            </div>
            <p className="text-xs text-pink-500">Account role</p>
          </div>

          {/* Member Since */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-pink-500 uppercase tracking-wide">
              Member Since
            </label>
            <div className="h-11 bg-gray-100 border border-gray-200 rounded-lg px-4 flex items-center">
              <span className="text-base text-gray-900">
                {user?.created_date
                  ? new Date(user.created_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            <p className="text-xs text-pink-500">Account creation date</p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-900">
              Display name updated successfully.
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isDisabled}
            className="flex-1 h-11 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-600 transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Info Footer */}
      <p className="text-xs text-pink-500 mt-6 text-center">
        Your display name is used throughout the app. Changes are saved
        immediately.
      </p>

      {/* Crop Modal */}
      {cropImageUrl && (
        <ImageCropModal
          imageUrl={cropImageUrl}
          onCrop={handleCroppedPhoto}
          onCancel={() => setCropImageUrl(null)}
        />
      )}

      {/* Notification Preferences */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <NotificationSettings user={user} />
      </div>

      {/* Push Notifications Section */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="text-sm font-semibold text-gray-900">Push Notifications</h2>
        </div>
        <p className="text-xs text-gray-500">
          Get notified about new announcements, posts, and activity even when the app is closed.
        </p>
        {notifStatus === 'granted' ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            <Check className="w-4 h-4 shrink-0" /> Push notifications are enabled
          </div>
        ) : notifStatus === 'denied' ? (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <BellOff className="w-4 h-4 shrink-0" /> Notifications are blocked — please enable them in your browser settings
          </div>
        ) : (
          <Button
            onClick={handleEnableNotifications}
            disabled={subscribing}
            className="bg-black text-[#D4AF37] hover:bg-[#222] font-semibold gap-2"
          >
            {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            {subscribing ? "Enabling..." : "Enable Push Notifications"}
          </Button>
        )}
      </div>

      {/* Danger Zone */}
      <div className="mt-8 border border-red-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account, posts, comments, and progress. This action <strong>cannot be undone</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  const toastId = toast.loading("Deleting account data...");
                  try {
                    // Delete user's posts
                    const userPosts = await base44.entities.CommunityPost.filter({ author_email: user.email });
                    await Promise.all(userPosts.map(p => base44.entities.CommunityPost.delete(p.id)));

                    // Delete user's comments
                    const userComments = await base44.entities.Comment.filter({ author_email: user.email });
                    await Promise.all(userComments.map(c => base44.entities.Comment.delete(c.id)));

                    // Delete user's enrollments
                    const userEnrollments = await base44.entities.Enrollment.filter({ user_email: user.email });
                    await Promise.all(userEnrollments.map(e => base44.entities.Enrollment.delete(e.id)));

                    // Delete user points record
                    const userPoints = await base44.entities.UserPoints.filter({ user_email: user.email });
                    await Promise.all(userPoints.map(p => base44.entities.UserPoints.delete(p.id)));

                    // Delete notification subscriptions
                    const subs = await base44.entities.NotificationSubscription.filter({ user_email: user.email });
                    await Promise.all(subs.map(s => base44.entities.NotificationSubscription.delete(s.id)));

                    toast.dismiss(toastId);
                    toast.success("Account data deleted. Signing out...");
                    setTimeout(() => base44.auth.logout(), 1500);
                  } catch (err) {
                    toast.dismiss(toastId);
                    toast.error("Failed to delete all data. Signing out anyway...");
                    setTimeout(() => base44.auth.logout(), 2000);
                  }
                }}
              >
                Yes, Delete My Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
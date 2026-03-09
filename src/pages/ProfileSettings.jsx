import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Fetch current user
  const { data: user, isLoading: userLoading, refetch: refetchUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const u = await base44.auth.me();
      console.log("[ProfileSettings] User fetched:", {
        userId: u.id,
        email: u.email,
        fullName: u.full_name,
      });
      return u;
    },
  });

  // Fetch user's display_name from User entity
  const { data: userRecord } = useQuery({
    queryKey: ["userRecord", user?.email],
    queryFn: () => base44.entities.User.filter({ email: user.email }),
    enabled: !!user?.email,
  });

  // Initialize form with fresh user data whenever user changes
  useEffect(() => {
    if (user) {
      const displayNameValue = userRecord?.[0]?.display_name || user.full_name || "";
      console.log("[ProfileSettings] Initializing form with user data:", {
        userId: user.id,
        displayName: displayNameValue,
      });
      setDisplayName(displayNameValue);
      setOriginalName(displayNameValue);
      setError("");
      setSuccess(false);
    }
  }, [user, userRecord]);

  const hasChanges = displayName.trim() !== originalName.trim();
  const isDisabled = saving || !hasChanges || !displayName.trim();

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

       // Step 1: Get or create User entity record
       console.log("[ProfileSettings] Step 1: Getting User entity record...");
       let userRecordId = userRecord?.[0]?.id;
       if (!userRecordId) {
         // Create User entity record if it doesn't exist
         const created = await base44.entities.User.create({
           email: user.email,
           display_name: trimmedName,
         });
         userRecordId = created.id;
         console.log("[ProfileSettings] Created new User record:", { id: userRecordId });
       } else {
         // Update existing User record with new display_name
         await base44.entities.User.update(userRecordId, {
           display_name: trimmedName,
         });
         console.log("[ProfileSettings] Updated User record:", { id: userRecordId });
       }

      // Step 2: Update UserPoints record
       console.log("[ProfileSettings] Step 2: Updating UserPoints...");
       const userPointsRecords = await base44.entities.UserPoints.filter({
         user_email: user.email,
       });
       if (userPointsRecords?.length > 0) {
         await base44.entities.UserPoints.update(userPointsRecords[0].id, {
           user_name: trimmedName,
         });
         console.log("[ProfileSettings] UserPoints updated:", {
           recordId: userPointsRecords[0].id,
           newName: trimmedName,
         });
       }

       // Step 3: Update CommunityPost records
       console.log("[ProfileSettings] Step 3: Updating CommunityPost records...");
       const userPosts = await base44.entities.CommunityPost.filter({
         author_email: user.email,
       });
       if (userPosts?.length > 0) {
         await Promise.all(
           userPosts.map((post) => {
             console.log("[ProfileSettings] Updating post:", {
               postId: post.id,
               oldAuthorName: post.author_name,
               newAuthorName: trimmedName,
             });
             return base44.entities.CommunityPost.update(post.id, {
               author_name: trimmedName,
             });
           })
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
           userComments.map((comment) => {
             console.log("[ProfileSettings] Updating comment:", {
               commentId: comment.id,
               oldAuthorName: comment.author_name,
               newAuthorName: trimmedName,
             });
             return base44.entities.Comment.update(comment.id, {
               author_name: trimmedName,
             });
           })
         );
         console.log("[ProfileSettings] All Comment records updated");
       }

       // Step 5: Invalidate all related queries to clear old cache
       console.log("[ProfileSettings] Step 5: Invalidating all related queries...");
       await queryClient.invalidateQueries({ queryKey: ["userRecord", user.email] });
       await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
       await queryClient.invalidateQueries({ queryKey: ["myPoints"] });
       await queryClient.invalidateQueries({ queryKey: ["myPointsCommunity"] });
       await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
       await queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
       await queryClient.invalidateQueries({ queryKey: ["comments"] });
       console.log("[ProfileSettings] All queries invalidated");

      // Step 6: Update local state and show success
      setDisplayName(trimmedName);
      setOriginalName(trimmedName);
      setSuccess(true);
      console.log("[ProfileSettings] Save completed successfully");
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      const errorMsg = err.message || "Failed to save display name. Please try again.";
      console.error("[ProfileSettings] Save failed:", {
        error: errorMsg,
        userId: user.id,
        stack: err.stack,
      });
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
    </div>
  );
}
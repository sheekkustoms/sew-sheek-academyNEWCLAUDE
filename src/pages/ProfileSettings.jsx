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
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Initialize form with fresh user data whenever user changes
  useEffect(() => {
    if (user) {
      console.log("[ProfileSettings] User loaded", {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
      });
      setDisplayName(user.full_name || "");
      setOriginalName(user.full_name || "");
      setError("");
      setSuccess(false);
    }
  }, [user]);

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
      console.log("[ProfileSettings] Saving display name", {
        userId: user.id,
        oldName: originalName,
        newName: trimmedName,
      });

      // Update the user profile
      await base44.auth.updateMe({ full_name: trimmedName });
      console.log("[ProfileSettings] Auth update completed");

      // Update UserPoints if exists
      const userPointsRecords = await base44.entities.UserPoints.filter({
        user_email: user.email,
      });
      if (userPointsRecords?.length > 0) {
        await base44.entities.UserPoints.update(userPointsRecords[0].id, {
          user_name: trimmedName,
        });
        console.log("[ProfileSettings] UserPoints updated");
      }

      // Update all community posts by this user
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
        console.log("[ProfileSettings] CommunityPost records updated");
      }

      // Update all comments by this user
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
        console.log("[ProfileSettings] Comment records updated");
      }

      // Invalidate all queries to force fresh fetch
      queryClient.invalidateQueries();
      
      // Refetch current user to confirm save
      const refreshedUser = await queryClient.refetchQueries({
        queryKey: ["currentUser"],
      });
      
      console.log("[ProfileSettings] Save completed successfully", {
        userId: user.id,
        confirmedName: refreshedUser.data?.[0]?.full_name || trimmedName,
      });

      setOriginalName(trimmedName);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMsg =
        err.message || "Failed to save display name. Please try again.";
      console.error("[ProfileSettings] Save failed", {
        error: errorMsg,
        userId: user.id,
      });
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-charcoal" />
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
      <div className="bg-white border border-ivory-300 rounded-2xl shadow-sm p-8 space-y-8">
        {/* Display Name Section */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-charcoal">
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
            className="h-11 text-base border-ivory-300 focus:border-dusty-rose focus:ring-dusty-rose/20"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-ivory-200" />

        {/* Read-Only Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-pink-500 uppercase tracking-wide">
              Email Address
            </label>
            <div className="h-11 bg-ivory-100 border border-ivory-200 rounded-lg px-4 flex items-center">
              <span className="text-base text-charcoal">{user?.email}</span>
            </div>
            <p className="text-xs text-pink-500">Cannot be changed</p>
          </div>

          {/* User ID */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-pink-500 uppercase tracking-wide">
              User ID
            </label>
            <div className="h-11 bg-ivory-100 border border-ivory-200 rounded-lg px-4 flex items-center">
              <span className="text-xs text-charcoal font-mono">
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
            <div className="h-11 bg-ivory-100 border border-ivory-200 rounded-lg px-4 flex items-center">
              <span className="text-base text-charcoal capitalize">
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
            <div className="h-11 bg-ivory-100 border border-ivory-200 rounded-lg px-4 flex items-center">
              <span className="text-base text-charcoal">
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
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
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
            className="flex-1 h-11 bg-dusty-rose text-white font-semibold rounded-lg hover:bg-dusty-rose/90 disabled:bg-ivory-300 disabled:text-muted transition-colors"
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
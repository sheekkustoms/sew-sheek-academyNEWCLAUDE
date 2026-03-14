import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileStats from "../components/profile/ProfileStats";
import ProfileTabs from "../components/profile/ProfileTabs";
import { getDisplayName } from "../components/shared/useDisplayName";

export default function MemberProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get("email");

  const { data: currentUser } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  // If no email param, show own profile
  const targetEmail = profileEmail || currentUser?.email;

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsersForProfile"],
    queryFn: async () => {
      const res = await base44.functions.invoke('getAllUsers', {});
      return res.data?.users || [];
    },
    staleTime: 60000,
  });

  const profileUser = profileEmail
    ? allUsers.find(u => u.email === profileEmail) || null
    : currentUser;

  const { data: userPoints } = useQuery({
    queryKey: ["profilePoints", targetEmail],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: targetEmail }),
    enabled: !!targetEmail,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["profileEnrollments", targetEmail],
    queryFn: () => base44.entities.Enrollment.filter({ user_email: targetEmail }),
    enabled: !!targetEmail,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["allCourses"],
    queryFn: () => base44.entities.Course.list("-created_date", 200),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["profilePosts", targetEmail],
    queryFn: () => base44.entities.CommunityPost.filter({ author_email: targetEmail }),
    enabled: !!targetEmail,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["profileComments", targetEmail],
    queryFn: () => base44.entities.Comment.filter({ author_email: targetEmail }),
    enabled: !!targetEmail,
  });

  const points = userPoints?.[0];
  const displayName = profileUser
    ? (profileUser.data?.display_name || profileUser.full_name || profileUser.email?.split("@")[0])
    : getDisplayName(currentUser);

  const role = profileUser?.role === "admin"
    ? (profileUser?.data?.display_name === "MODERATOR" ? "moderator" : "coach")
    : "student";

  const avatarUrl = profileUser?.data?.avatar_url || profileUser?.avatar_url || null;

  if (!targetEmail) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 text-gray-400">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileHeader
        name={displayName}
        email={targetEmail}
        avatarUrl={avatarUrl}
        role={role}
        isOwnProfile={targetEmail === currentUser?.email}
      />

      <ProfileStats
        enrollmentsCount={enrollments.length}
        completedCount={enrollments.filter(e => e.is_completed).length}
        totalXP={points?.total_xp || 0}
        postsCount={posts.length}
      />

      <ProfileTabs
        targetEmail={targetEmail}
        enrollments={enrollments}
        courses={courses}
        posts={posts}
        comments={comments}
        points={points}
        currentUser={currentUser}
      />
    </div>
  );
}
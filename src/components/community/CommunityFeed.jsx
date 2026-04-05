import React from "react";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import CommunityPostCard from "./CommunityPostCard";

function useLiveAuthorData(posts) {
  const uniqueEmails = [...new Set(posts.map(p => p.author_email).filter(Boolean))];
  return useQuery({
    queryKey: ["liveAuthorData", uniqueEmails.sort().join(",")],
    queryFn: async () => {
      if (!uniqueEmails.length) return { avatars: {}, names: {} };
      const avatars = {};
      const names = {};
      await Promise.all(
        uniqueEmails.map(async (email) => {
          const result = await base44.functions.invoke('getUserAvatar', { email });
          if (result.data?.avatar_url) avatars[email] = result.data.avatar_url;
          if (result.data?.display_name) names[email] = result.data.display_name;
        })
      );
      return { avatars, names };
    },
    enabled: uniqueEmails.length > 0,
    staleTime: 30000,
  });
}

export default function CommunityFeed({ posts, isLoading, currentUser, adminEmails, myPoints, onLike, onPin, onDelete, onOpen, isAdmin }) {
  const { data: liveAuthorData = { avatars: {}, names: {} } } = useLiveAuthorData(posts);
  const liveAvatarMap = liveAuthorData.avatars;
  const liveNameMap = liveAuthorData.names;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-200" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
        <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No posts yet</p>
        <p className="text-sm text-gray-400 mt-1">Be the first to post in this category!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <CommunityPostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          adminEmails={adminEmails}
          myPoints={myPoints}
          onLike={onLike}
          onPin={onPin}
          onDelete={onDelete}
          onOpen={onOpen}
          isAdmin={isAdmin}
          index={i}
          liveAvatarMap={liveAvatarMap}
          liveNameMap={liveNameMap}
        />
      ))}
    </div>
  );
}
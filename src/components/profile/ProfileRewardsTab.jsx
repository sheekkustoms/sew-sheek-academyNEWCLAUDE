import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Zap, Trophy, Star } from "lucide-react";
import moment from "moment";

export default function ProfileRewardsTab({ points, targetEmail }) {
  // Fetch reward-related posts (shoutouts) for this user
  const { data: shoutouts = [] } = useQuery({
    queryKey: ["profileShoutouts", targetEmail],
    queryFn: async () => {
      const allPosts = await base44.entities.CommunityPost.list("-created_date", 200);
      return allPosts.filter(p =>
        p.category === "student_projects" &&
        (p.content?.includes(targetEmail) || p.author_name?.toLowerCase().includes("reward") || p.title?.toLowerCase().includes("reward"))
      ).slice(0, 10);
    },
    enabled: !!targetEmail,
  });

  return (
    <div className="space-y-6">
      {/* Points summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <Zap className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">{points?.total_xp || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total XP</p>
        </div>
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-violet-500 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">{points?.level || 1}</p>
          <p className="text-xs text-gray-500 mt-0.5">Level</p>
        </div>
        <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 text-center">
          <Star className="w-6 h-6 text-pink-500 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">{points?.courses_completed || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Courses Done</p>
        </div>
      </div>

      {/* Badges */}
      {points?.badges?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {points.badges.map((badge, i) => (
              <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Shoutouts */}
      {shoutouts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Community Shoutouts</h3>
          <div className="space-y-3">
            {shoutouts.map(post => (
              <div key={post.id} className="p-4 border border-gray-100 rounded-xl bg-amber-50/40">
                <p className="font-semibold text-gray-900 text-sm">{post.title}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                <p className="text-xs text-gray-400 mt-2">{moment(post.created_date).fromNow()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {shoutouts.length === 0 && !points && (
        <div className="text-center py-8 text-gray-400">
          <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm">No rewards yet. Keep learning!</p>
        </div>
      )}
    </div>
  );
}
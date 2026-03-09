import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Zap, Award, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RankBadge = ({ rank }) => {
  if (rank === 1) return <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-lg">🥇</div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-lg">🥈</div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-lg">🥉</div>;
  return <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-700">{rank}</div>;
};

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState("all");

  const { data: allPoints = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => base44.entities.UserPoints.list("-total_xp", 100),
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Calculate rankings
  const rankings = allPoints.map((p, idx) => ({
    ...p,
    rank: idx + 1,
    isCurrentUser: user?.email === p.user_email,
  }));

  const currentUserRank = rankings.find(r => r.isCurrentUser);
  const topMembers = rankings.slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Leaderboard</h1>
        <p className="text-lg text-gray-600">Celebrate the top sewing community members</p>
      </div>

      {/* Your Rank Card */}
      {currentUserRank && (
        <div className="bg-gradient-to-br from-yellow-50 to-pink-50 border border-yellow-200 rounded-xl p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RankBadge rank={currentUserRank.rank} />
              <div>
                <p className="text-sm text-gray-600 font-medium">YOUR RANKING</p>
                <h3 className="text-2xl font-bold text-gray-900">{currentUserRank.rank}{currentUserRank.rank === 1 ? "st" : currentUserRank.rank === 2 ? "nd" : currentUserRank.rank === 3 ? "rd" : "th"} Place</h3>
                <p className="text-sm text-gray-700 mt-1">{currentUserRank.user_name || currentUserRank.user_email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-medium mb-1">TOTAL XP</p>
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-600" />
                <p className="text-3xl font-bold text-gray-900">{currentUserRank.total_xp}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tabs */}
      <Tabs defaultValue="alltime" className="space-y-6">
        <TabsList className="bg-gray-100 rounded-lg p-1 inline-flex">
          <TabsTrigger value="alltime" className="rounded px-4 py-2 text-sm font-medium">All Time</TabsTrigger>
          <TabsTrigger value="month" className="rounded px-4 py-2 text-sm font-medium">This Month</TabsTrigger>
          <TabsTrigger value="week" className="rounded px-4 py-2 text-sm font-medium">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="alltime">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-6 bg-gray-50 border-b border-gray-200">
              <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">Rank</div>
              <div className="col-span-5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Member</div>
              <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">XP</div>
              <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">Courses</div>
              <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">Badges</div>
            </div>

            <div className="divide-y divide-gray-100">
              {topMembers.map((member) => (
                <div
                  key={member.id}
                  className={`grid grid-cols-12 gap-4 p-6 items-center hover:bg-gray-50 transition-colors ${
                    member.isCurrentUser ? "bg-yellow-50" : ""
                  }`}
                >
                  <div className="col-span-1">
                    <RankBadge rank={member.rank} />
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                      {(member.user_name || member.user_email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{member.user_name || member.user_email}</p>
                      <p className="text-xs text-gray-500">Level {Math.floor(member.total_xp / 100) + 1}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span className="font-bold text-gray-900">{member.total_xp}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-semibold text-gray-700">{member.courses_completed || 0}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Award className="w-4 h-4 text-pink-500" />
                      <span className="text-sm font-semibold text-gray-700">{member.badges?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="month">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Monthly leaderboard coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="week">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Weekly leaderboard coming soon</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Members</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{rankings.length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-yellow-600" />
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total XP Earned</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{rankings.reduce((sum, r) => sum + r.total_xp, 0).toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-6 h-6 text-pink-500" />
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Badges</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{(rankings.reduce((sum, r) => sum + (r.badges?.length || 0), 0) / rankings.length || 0).toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}
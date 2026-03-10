import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Zap, Award, Target, Flame, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { getLevelFromXP } from "@/components/shared/XPBar";
import AvatarWithFallback from "@/components/shared/AvatarWithFallback";

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

  // Fetch all user profiles to get avatar URLs
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUserProfiles"],
    queryFn: () => base44.entities.User.list(),
    staleTime: 60000,
  });

  // Create email->user map for avatar lookup
  const userMap = {};
  allUsers.forEach(user => {
    userMap[user.email] = user;
  });

  const { data: weeklyChallengeSettings = [] } = useQuery({
    queryKey: ["weeklyChallengeSettings"],
    queryFn: () => base44.entities.WeeklyChallengeSettings.list(),
  });

  const { data: weeklyChallengeQuestions = [] } = useQuery({
    queryKey: ["weeklyChallengeQuestions"],
    queryFn: () => base44.entities.WeeklyChallengeQuestion.list(),
  });

  const { data: dailyChallenges = [] } = useQuery({
    queryKey: ["myChallenges", user?.email],
    queryFn: () => user?.email ? base44.entities.DailyChallenge.filter({ user_email: user.email }, "-challenge_date", 10) : Promise.resolve([]),
    enabled: !!user?.email,
  });

  const weeklyChallengeSettings_item = weeklyChallengeSettings?.[0];
  const todayDate = new Date().toISOString().split('T')[0];
  const todayChallenge = dailyChallenges?.find(c => c.challenge_date === todayDate);
  const questionCount = weeklyChallengeQuestions?.length || 0;

  // Calculate rankings with avatar data
    const rankings = allPoints.map((p, idx) => {
      const userProfile = userMap[p.user_email];
      return {
        ...p,
        rank: idx + 1,
        isCurrentUser: user?.email === p.user_email,
        avatar_url: userProfile?.avatar_url || null,
      };
    });

   const memberRankings = rankings.filter(r => r.isCurrentUser === false && !allPoints.find((p, idx) => p.user_email === r.user_email && base44.entities.User.filter({ email: r.user_email }).then(users => users[0]?.role === "admin")));
   const currentUserRank = memberRankings.find(r => r.isCurrentUser);
   const currentUserLevel = user?.role === "admin" ? 10 : (currentUserRank ? getLevelFromXP(currentUserRank.total_xp) : 0);
  const topMembers = memberRankings.slice(0, 10);

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
              <p className="text-sm text-gray-600 font-medium mb-1">YOUR LEVEL</p>
              <div className="flex items-center justify-end gap-2">
                <Award className="w-6 h-6 text-yellow-600" />
                <p className="text-3xl font-bold text-gray-900">Level {currentUserLevel}</p>
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
                     <AvatarWithFallback
                       imageUrl={member.avatar_url}
                       name={member.user_name}
                       email={member.user_email}
                       size="md"
                     />
                     <div>
                      <p className="font-semibold text-gray-900">{member.user_name || member.user_email}</p>
                      <p className="text-xs text-gray-500">Level {getLevelFromXP(member.total_xp)}</p>
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

      {/* Weekly Challenge Section */}
      <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 rounded-xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Weekly Challenge</h2>
            </div>
            <p className="text-sm text-gray-600">{weeklyChallengeSettings_item?.week_label || "Answer daily sewing questions"}</p>
          </div>
          <Link to={createPageUrl("DailyChallenges")}>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <Calendar className="w-4 h-4" /> Take Challenge
            </Button>
          </Link>
        </div>

        {todayChallenge ? (
          <div className="bg-white rounded-lg p-4 border border-violet-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">{todayChallenge.score}/{todayChallenge.total_questions} Correct</p>
              {todayChallenge.perfect_score && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">Perfect Score! 🎉</span>}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-violet-500 to-pink-500 h-2 rounded-full" style={{ width: `${(todayChallenge.score / todayChallenge.total_questions) * 100}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">+{todayChallenge.xp_earned} XP earned today</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4 border border-violet-100 text-center">
            <p className="text-sm text-gray-600 mb-3">You haven't taken today's challenge yet!</p>
            <p className="text-xs text-gray-500 mb-3">{questionCount} questions available</p>
            <Link to={createPageUrl("DailyChallenges")}>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                Start Challenge
              </Button>
            </Link>
          </div>
        )}
      </div>

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
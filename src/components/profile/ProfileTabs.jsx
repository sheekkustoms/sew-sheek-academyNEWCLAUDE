import React, { useState } from "react";
import ProfileOverviewTab from "./ProfileOverviewTab";
import ProfileClassesTab from "./ProfileClassesTab";
import ProfileCommunityTab from "./ProfileCommunityTab";
import ProfileRewardsTab from "./ProfileRewardsTab";

const TABS = [
  { value: "overview",   label: "Overview" },
  { value: "classes",    label: "Classes" },
  { value: "community",  label: "Community" },
  { value: "rewards",    label: "Rewards" },
];

export default function ProfileTabs({ targetEmail, enrollments, courses, posts, comments, points, currentUser }) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 px-4">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${
              tab === t.value
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {tab === "overview"  && <ProfileOverviewTab enrollments={enrollments} courses={courses} posts={posts} comments={comments} />}
        {tab === "classes"   && <ProfileClassesTab enrollments={enrollments} courses={courses} />}
        {tab === "community" && <ProfileCommunityTab posts={posts} comments={comments} />}
        {tab === "rewards"   && <ProfileRewardsTab points={points} targetEmail={targetEmail} />}
      </div>
    </div>
  );
}
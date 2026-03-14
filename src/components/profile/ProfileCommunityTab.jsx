import React, { useState } from "react";
import { Heart, MessageSquare } from "lucide-react";
import moment from "moment";

export default function ProfileCommunityTab({ posts, comments }) {
  const [view, setView] = useState("posts");

  const sortedPosts = [...posts].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const sortedComments = [...comments].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setView("posts")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            view === "posts" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setView("comments")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            view === "comments" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Comments ({comments.length})
        </button>
      </div>

      {view === "posts" && (
        <div className="space-y-3">
          {sortedPosts.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No posts yet.</p>
          ) : sortedPosts.map(post => (
            <div key={post.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{post.title}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium capitalize shrink-0 ${
                  post.category === "announcement" ? "bg-red-100 text-red-700" :
                  post.category === "student_projects" ? "bg-emerald-100 text-emerald-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {post.category?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span>{moment(post.created_date).fromNow()}</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes?.length || 0}</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.comment_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "comments" && (
        <div className="space-y-3">
          {sortedComments.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No comments yet.</p>
          ) : sortedComments.map(comment => (
            <div key={comment.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{moment(comment.created_date).fromNow()}</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{comment.likes?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
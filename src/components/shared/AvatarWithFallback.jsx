import React from "react";

/**
 * Reusable avatar component that displays profile photo with fallback to initials
 * Standardizes avatar display across the entire app
 */
export default function AvatarWithFallback({
  imageUrl,
  name,
  email,
  size = "md",
  className = "",
}) {
  const sizeClasses = {
    xs: "w-6 h-6 text-[9px]",
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const initials = (name || email || "?")[0].toUpperCase();
  const displayName = name || email || "Member";

  // Console logging for debugging avatar source
  console.log("[AvatarWithFallback] Rendering avatar:", {
    name: displayName,
    hasImage: !!imageUrl,
    imageUrl: imageUrl || "none",
  });

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={displayName}
        title={displayName}
        className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200 shrink-0 ${className}`}
        onError={(e) => {
          console.warn("[AvatarWithFallback] Image failed to load:", imageUrl);
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center text-white font-bold border border-gray-200 shrink-0 ${className}`}
      title={displayName}
    >
      {initials}
    </div>
  );
}
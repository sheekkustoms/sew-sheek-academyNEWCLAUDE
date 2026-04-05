import { base44 } from "@/api/base44Client";

/**
 * Get display name with fallback chain:
 * 1. Check custom display_name in auth metadata
 * 2. Check auth full_name
 * 3. Extract from email prefix
 */
export function getDisplayName(user) {
  if (!user) return "Member";
  
  // Check for custom display_name in auth metadata
  if (user.display_name) return user.display_name;
  
  // Fallback to full_name
  if (user.full_name) return user.full_name;
  
  // Fallback to email prefix
  if (user.email) return user.email.split("@")[0];
  
  return "Member";
}

/**
 * Update user's display name via auth system
 */
export async function updateUserDisplayName(displayName) {
  if (!displayName?.trim()) {
    throw new Error("Display name cannot be empty");
  }
  
  const trimmed = displayName.trim();
  console.log("[useDisplayName] Updating display_name to:", trimmed);
  
  await base44.auth.updateMe({
    display_name: trimmed,
  });
  
  console.log("[useDisplayName] Display name saved successfully");
  return trimmed;
}
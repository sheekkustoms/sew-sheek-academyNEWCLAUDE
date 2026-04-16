/**
 * Returns the effective email to use for data queries.
 * When an admin is previewing as a specific member, returns that member's email.
 * Otherwise returns the real user's email.
 */
export function usePreviewEmail(user) {
  const previewEmail = localStorage.getItem("member_preview_email");
  const isPreviewMode = localStorage.getItem("member_preview_mode") === "true";
  if (isPreviewMode && previewEmail) return previewEmail;
  return user?.email || null;
}
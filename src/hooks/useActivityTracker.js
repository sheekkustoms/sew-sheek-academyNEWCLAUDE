import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Call this at the top of any page to log that the user visited it.
 * @param {object} user - current user object
 * @param {string} page - page name (e.g. "Dashboard")
 * @param {string} details - optional extra context (e.g. course title)
 */
export function useActivityTracker(user, page, details = "") {
  useEffect(() => {
    if (!user?.email || user?.role === "admin") return;

    base44.entities.ActivityLog.create({
      user_email: user.email,
      user_name: user.full_name || user.email,
      page,
      action: "visited",
      details: details || "",
    }).catch(() => {}); // silently ignore errors
  }, [user?.email, page]);
}
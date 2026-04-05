import { base44 } from "@/api/base44Client";
import { getLevelFromXP } from "./XPBar";

export async function getOrCreateUserPoints(user) {
  if (!user?.email) return null;
  const existing = await base44.entities.UserPoints.filter({ user_email: user.email });
  if (existing.length > 0) return existing[0];
  return await base44.entities.UserPoints.create({
    user_email: user.email,
    user_name: user.full_name || user.email,
    total_xp: 0,
    level: 1,
    courses_completed: 0,
    lessons_completed: 0,
    posts_created: 0,
    comments_made: 0,
    badges: [],
    streak_days: 0,
    last_activity_date: new Date().toISOString(),
  });
}

export async function awardXP(userPointsId, currentPoints, amount, extraUpdates = {}) {
  const newXP = (currentPoints.total_xp || 0) + amount;
  const newLevel = getLevelFromXP(newXP);
  const now = new Date().toISOString();
  const today = now.split("T")[0];
  const oldLevel = currentPoints.level || 1;

  const badges = [...(currentPoints.badges || [])];
  const newBadges = [];

  // Check badge eligibility
  const lessonsCompleted = (extraUpdates.lessons_completed || currentPoints.lessons_completed || 0);
  const coursesCompleted = (extraUpdates.courses_completed || currentPoints.courses_completed || 0);
  const postsCreated = (extraUpdates.posts_created || currentPoints.posts_created || 0);
  const commentsMade = (extraUpdates.comments_made || currentPoints.comments_made || 0);

  if (lessonsCompleted >= 1 && !badges.includes("First Lesson")) { badges.push("First Lesson"); newBadges.push("First Lesson"); }
  if (coursesCompleted >= 1 && !badges.includes("Course Complete")) { badges.push("Course Complete"); newBadges.push("Course Complete"); }
  if (coursesCompleted >= 5 && !badges.includes("Sharpshooter")) { badges.push("Sharpshooter"); newBadges.push("Sharpshooter"); }
  if (postsCreated >= 5 && !badges.includes("Community Star")) { badges.push("Community Star"); newBadges.push("Community Star"); }
  if (commentsMade >= 10 && !badges.includes("Commenter")) { badges.push("Commenter"); newBadges.push("Commenter"); }
  if (newLevel >= 5 && !badges.includes("Rocket Learner")) { badges.push("Rocket Learner"); newBadges.push("Rocket Learner"); }
  if (newLevel >= 10 && !badges.includes("Legend")) { badges.push("Legend"); newBadges.push("Legend"); }

  let streakDays = currentPoints.streak_days || 0;
  let personalBestStreak = currentPoints.personal_best_streak || 0;
  const lastActivityDate = currentPoints.last_activity_date ? currentPoints.last_activity_date.split("T")[0] : null;
  if (lastActivityDate !== today) {
    const lastDate = new Date(lastActivityDate);
    const todayDate = new Date(today);
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    streakDays = diffDays === 1 ? streakDays + 1 : 1;
  }

  const isNewStreakRecord = streakDays > personalBestStreak;
  if (isNewStreakRecord) personalBestStreak = streakDays;

  if (streakDays >= 7 && !badges.includes("On Fire")) { badges.push("On Fire"); newBadges.push("On Fire"); }

  const quizMaster = extraUpdates.quiz_master_badge;
  if (quizMaster && !badges.includes("Quiz Master")) { badges.push("Quiz Master"); newBadges.push("Quiz Master"); }

  const updateData = {
    total_xp: newXP,
    level: newLevel,
    badges,
    streak_days: streakDays,
    personal_best_streak: personalBestStreak,
    last_activity_date: now,
    ...extraUpdates,
  };

  await base44.entities.UserPoints.update(userPointsId, updateData);

  // Create notifications
  for (const badge of newBadges) {
    await base44.entities.Notification.create({
      recipient_email: currentPoints.user_email,
      type: "badge",
      message: `🏅 You unlocked the "${badge}" badge!`,
      is_read: false,
    });
  }

  if (newLevel > oldLevel) {
    await base44.entities.Notification.create({
      recipient_email: currentPoints.user_email,
      type: "announcement",
      message: `⭐ Congratulations! You reached Level ${newLevel}!`,
      is_read: false,
    });
  }

  if (isNewStreakRecord && streakDays > 0) {
    await base44.entities.Notification.create({
      recipient_email: currentPoints.user_email,
      type: "announcement",
      message: `🔥 New personal best! Your streak is now ${streakDays} days!`,
      is_read: false,
    });
  }

  return { total_xp: newXP, level: newLevel, badges, streak_days: streakDays };
}
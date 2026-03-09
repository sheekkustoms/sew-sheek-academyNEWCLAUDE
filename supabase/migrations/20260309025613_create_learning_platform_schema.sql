/*
  # Learning Platform Complete Database Schema

  1. New Tables
    
    **UserPoints** - Track user XP, badges, and progress
      - `id` (uuid, primary key)
      - `user_email` (text, indexed)
      - `user_name` (text)
      - `total_xp` (integer, default 0)
      - `courses_completed` (integer, default 0)
      - `lessons_completed` (integer, default 0)
      - `quizzes_completed` (integer, default 0)
      - `streak_days` (integer, default 0)
      - `last_activity_date` (date)
      - `badges` (jsonb, array of badge names)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    **Category** - Course categories
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique)
      - `description` (text)
      - `icon` (text)
      - `color` (text)
      - `created_at` (timestamptz)

    **Course** - Learning courses
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `thumbnail_url` (text)
      - `category_id` (uuid, FK to Category)
      - `difficulty_level` (integer, 1-5)
      - `required_level` (integer, default 1)
      - `is_published` (boolean, default false)
      - `xp_reward` (integer, default 100)
      - `created_by` (text, user email)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    **Lesson** - Individual lessons within courses
      - `id` (uuid, primary key)
      - `course_id` (uuid, FK to Course)
      - `title` (text)
      - `description` (text)
      - `video_url` (text)
      - `content` (text)
      - `order_index` (integer)
      - `duration_minutes` (integer)
      - `xp_reward` (integer, default 50)
      - `created_at` (timestamptz)

    **Enrollment** - User course enrollments
      - `id` (uuid, primary key)
      - `user_email` (text, indexed)
      - `course_id` (uuid, FK to Course)
      - `enrolled_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
      - `progress_percent` (integer, default 0)

    **LessonProgress** - Track lesson completion
      - `id` (uuid, primary key)
      - `user_email` (text, indexed)
      - `lesson_id` (uuid, FK to Lesson)
      - `course_id` (uuid, FK to Course)
      - `completed` (boolean, default false)
      - `completed_at` (timestamptz, nullable)
      - `watch_time_seconds` (integer, default 0)
      - `created_at` (timestamptz)

    **Quiz** - Quiz games and practice quizzes
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `quiz_type` (text, 'practice' or 'live')
      - `is_published` (boolean, default false)
      - `status` (text, 'waiting', 'active', 'completed')
      - `game_code` (text, unique, 6 chars for live games)
      - `xp_reward` (integer, default 100)
      - `time_limit_seconds` (integer, default 30)
      - `created_by` (text, user email)
      - `created_at` (timestamptz)
      - `starts_at` (timestamptz, nullable)

    **QuizQuestion** - Questions for quizzes
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, FK to Quiz)
      - `question_text` (text)
      - `options` (jsonb, array of answer options)
      - `correct_answer` (text)
      - `order_index` (integer)
      - `points` (integer, default 100)
      - `created_at` (timestamptz)

    **QuizAttempt** - User quiz attempts and scores
      - `id` (uuid, primary key)
      - `user_email` (text, indexed)
      - `quiz_id` (uuid, FK to Quiz)
      - `score` (integer)
      - `total_questions` (integer)
      - `time_taken_seconds` (integer)
      - `answers` (jsonb)
      - `completed_at` (timestamptz)
      - `xp_earned` (integer)

    **LiveQuizParticipant** - Track live quiz participants
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, FK to Quiz)
      - `user_email` (text, indexed)
      - `user_name` (text)
      - `current_score` (integer, default 0)
      - `joined_at` (timestamptz)
      - `last_answer_at` (timestamptz, nullable)

    **Post** - Community posts
      - `id` (uuid, primary key)
      - `author_email` (text, indexed)
      - `author_name` (text)
      - `author_avatar` (text)
      - `content` (text)
      - `image_url` (text, nullable)
      - `likes_count` (integer, default 0)
      - `comments_count` (integer, default 0)
      - `liked_by` (jsonb, array of user emails)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    **Comment** - Comments on posts
      - `id` (uuid, primary key)
      - `post_id` (uuid, FK to Post)
      - `author_email` (text, indexed)
      - `author_name` (text)
      - `author_avatar` (text)
      - `content` (text)
      - `created_at` (timestamptz)

    **Conversation** - Message conversations between users
      - `id` (uuid, primary key)
      - `participant_emails` (jsonb, array of 2 emails)
      - `last_message` (text)
      - `last_message_at` (timestamptz)
      - `created_at` (timestamptz)

    **Message** - Individual messages
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, FK to Conversation)
      - `sender_email` (text, indexed)
      - `content` (text)
      - `is_read` (boolean, default false)
      - `created_at` (timestamptz)

    **Notification** - User notifications
      - `id` (uuid, primary key)
      - `recipient_email` (text, indexed)
      - `type` (text, 'like', 'comment', 'message', 'badge', 'announcement')
      - `message` (text)
      - `from_email` (text, nullable)
      - `from_name` (text, nullable)
      - `is_read` (boolean, default false)
      - `link_page` (text, nullable)
      - `created_at` (timestamptz)

    **LiveClass** - Scheduled live classes
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `instructor_email` (text)
      - `instructor_name` (text)
      - `instructor_avatar` (text)
      - `video_url` (text)
      - `meeting_link` (text)
      - `scheduled_at` (timestamptz)
      - `duration_minutes` (integer)
      - `max_participants` (integer)
      - `registered_count` (integer, default 0)
      - `status` (text, 'upcoming', 'live', 'completed')
      - `created_at` (timestamptz)

    **DailyChallenge** - Weekly/daily challenges
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `challenge_type` (text)
      - `requirements` (jsonb)
      - `xp_reward` (integer)
      - `badge_reward` (text, nullable)
      - `starts_at` (timestamptz)
      - `ends_at` (timestamptz)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

    **ChallengeSubmission** - User challenge submissions
      - `id` (uuid, primary key)
      - `challenge_id` (uuid, FK to DailyChallenge)
      - `user_email` (text, indexed)
      - `submission_data` (jsonb)
      - `completed` (boolean, default false)
      - `xp_earned` (integer, default 0)
      - `submitted_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for authenticated users
    - Admins can manage all content
    - Users can only modify their own data

  3. Indexes
    - Create indexes on foreign keys and frequently queried fields
*/

-- UserPoints table
CREATE TABLE IF NOT EXISTS user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_name text,
  total_xp integer DEFAULT 0,
  courses_completed integer DEFAULT 0,
  lessons_completed integer DEFAULT 0,
  quizzes_completed integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_activity_date date,
  badges jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_points_email ON user_points(user_email);
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Category table
CREATE TABLE IF NOT EXISTS category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  color text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE category ENABLE ROW LEVEL SECURITY;

-- Course table
CREATE TABLE IF NOT EXISTS course (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  category_id uuid REFERENCES category(id) ON DELETE SET NULL,
  difficulty_level integer DEFAULT 1,
  required_level integer DEFAULT 1,
  is_published boolean DEFAULT false,
  xp_reward integer DEFAULT 100,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_category ON course(category_id);
CREATE INDEX IF NOT EXISTS idx_course_published ON course(is_published);
ALTER TABLE course ENABLE ROW LEVEL SECURITY;

-- Lesson table
CREATE TABLE IF NOT EXISTS lesson (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES course(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text,
  content text,
  order_index integer DEFAULT 0,
  duration_minutes integer DEFAULT 0,
  xp_reward integer DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_course ON lesson(course_id);
ALTER TABLE lesson ENABLE ROW LEVEL SECURITY;

-- Enrollment table
CREATE TABLE IF NOT EXISTS enrollment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  course_id uuid REFERENCES course(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress_percent integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_enrollment_user ON enrollment(user_email);
CREATE INDEX IF NOT EXISTS idx_enrollment_course ON enrollment(course_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollment_unique ON enrollment(user_email, course_id);
ALTER TABLE enrollment ENABLE ROW LEVEL SECURITY;

-- LessonProgress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  lesson_id uuid REFERENCES lesson(id) ON DELETE CASCADE,
  course_id uuid REFERENCES course(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  watch_time_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_email);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_progress_unique ON lesson_progress(user_email, lesson_id);
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Quiz table
CREATE TABLE IF NOT EXISTS quiz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  quiz_type text DEFAULT 'practice',
  is_published boolean DEFAULT false,
  status text DEFAULT 'waiting',
  game_code text UNIQUE,
  xp_reward integer DEFAULT 100,
  time_limit_seconds integer DEFAULT 30,
  created_by text,
  created_at timestamptz DEFAULT now(),
  starts_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_quiz_published ON quiz(is_published);
CREATE INDEX IF NOT EXISTS idx_quiz_type ON quiz(quiz_type);
CREATE INDEX IF NOT EXISTS idx_quiz_code ON quiz(game_code);
ALTER TABLE quiz ENABLE ROW LEVEL SECURITY;

-- QuizQuestion table
CREATE TABLE IF NOT EXISTS quiz_question (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quiz(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  order_index integer DEFAULT 0,
  points integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_question_quiz ON quiz_question(quiz_id);
ALTER TABLE quiz_question ENABLE ROW LEVEL SECURITY;

-- QuizAttempt table
CREATE TABLE IF NOT EXISTS quiz_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  quiz_id uuid REFERENCES quiz(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  total_questions integer DEFAULT 0,
  time_taken_seconds integer DEFAULT 0,
  answers jsonb,
  completed_at timestamptz DEFAULT now(),
  xp_earned integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_user ON quiz_attempt(user_email);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_quiz ON quiz_attempt(quiz_id);
ALTER TABLE quiz_attempt ENABLE ROW LEVEL SECURITY;

-- LiveQuizParticipant table
CREATE TABLE IF NOT EXISTS live_quiz_participant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quiz(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text,
  current_score integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  last_answer_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_live_quiz_participant_quiz ON live_quiz_participant(quiz_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_participant_user ON live_quiz_participant(user_email);
ALTER TABLE live_quiz_participant ENABLE ROW LEVEL SECURITY;

-- Post table
CREATE TABLE IF NOT EXISTS post (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_email text NOT NULL,
  author_name text,
  author_avatar text,
  content text NOT NULL,
  image_url text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  liked_by jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_author ON post(author_email);
CREATE INDEX IF NOT EXISTS idx_post_created ON post(created_at DESC);
ALTER TABLE post ENABLE ROW LEVEL SECURITY;

-- Comment table
CREATE TABLE IF NOT EXISTS comment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES post(id) ON DELETE CASCADE,
  author_email text NOT NULL,
  author_name text,
  author_avatar text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comment_post ON comment(post_id);
ALTER TABLE comment ENABLE ROW LEVEL SECURITY;

-- Conversation table
CREATE TABLE IF NOT EXISTS conversation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_emails jsonb NOT NULL,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants ON conversation USING gin(participant_emails);
ALTER TABLE conversation ENABLE ROW LEVEL SECURITY;

-- Message table
CREATE TABLE IF NOT EXISTS message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversation(id) ON DELETE CASCADE,
  sender_email text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_conversation ON message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_sender ON message(sender_email);
ALTER TABLE message ENABLE ROW LEVEL SECURITY;

-- Notification table
CREATE TABLE IF NOT EXISTS notification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  from_email text,
  from_name text,
  is_read boolean DEFAULT false,
  link_page text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_recipient ON notification(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notification(is_read);
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

-- LiveClass table
CREATE TABLE IF NOT EXISTS live_class (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructor_email text,
  instructor_name text,
  instructor_avatar text,
  video_url text,
  meeting_link text,
  scheduled_at timestamptz,
  duration_minutes integer DEFAULT 60,
  max_participants integer,
  registered_count integer DEFAULT 0,
  status text DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_class_scheduled ON live_class(scheduled_at);
ALTER TABLE live_class ENABLE ROW LEVEL SECURITY;

-- DailyChallenge table
CREATE TABLE IF NOT EXISTS daily_challenge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  challenge_type text,
  requirements jsonb,
  xp_reward integer DEFAULT 250,
  badge_reward text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_challenge_active ON daily_challenge(is_active);
ALTER TABLE daily_challenge ENABLE ROW LEVEL SECURITY;

-- ChallengeSubmission table
CREATE TABLE IF NOT EXISTS challenge_submission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES daily_challenge(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  submission_data jsonb,
  completed boolean DEFAULT false,
  xp_earned integer DEFAULT 0,
  submitted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenge_submission_user ON challenge_submission(user_email);
CREATE INDEX IF NOT EXISTS idx_challenge_submission_challenge ON challenge_submission(challenge_id);
ALTER TABLE challenge_submission ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- UserPoints policies
CREATE POLICY "Anyone can view user points"
  ON user_points FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own points"
  ON user_points FOR UPDATE
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own points"
  ON user_points FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Category policies
CREATE POLICY "Anyone can view categories"
  ON category FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON category FOR ALL
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Course policies
CREATE POLICY "Anyone can view published courses"
  ON course FOR SELECT
  TO authenticated
  USING (is_published = true OR created_by = (SELECT email FROM auth.users WHERE id = auth.uid()) OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage courses"
  ON course FOR ALL
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Lesson policies
CREATE POLICY "Anyone can view lessons"
  ON lesson FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage lessons"
  ON lesson FOR ALL
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Enrollment policies
CREATE POLICY "Users can view own enrollments"
  ON enrollment FOR SELECT
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can create own enrollments"
  ON enrollment FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own enrollments"
  ON enrollment FOR UPDATE
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- LessonProgress policies
CREATE POLICY "Users can view own lesson progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can create own lesson progress"
  ON lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own lesson progress"
  ON lesson_progress FOR UPDATE
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Quiz policies
CREATE POLICY "Anyone can view published quizzes"
  ON quiz FOR SELECT
  TO authenticated
  USING (is_published = true OR created_by = (SELECT email FROM auth.users WHERE id = auth.uid()) OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage quizzes"
  ON quiz FOR ALL
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- QuizQuestion policies
CREATE POLICY "Anyone can view quiz questions"
  ON quiz_question FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage quiz questions"
  ON quiz_question FOR ALL
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- QuizAttempt policies
CREATE POLICY "Users can view own quiz attempts"
  ON quiz_attempt FOR SELECT
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can create own quiz attempts"
  ON quiz_attempt FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- LiveQuizParticipant policies
CREATE POLICY "Anyone can view live quiz participants"
  ON live_quiz_participant FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join live quizzes"
  ON live_quiz_participant FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own participation"
  ON live_quiz_participant FOR UPDATE
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Post policies
CREATE POLICY "Anyone can view posts"
  ON post FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create posts"
  ON post FOR INSERT
  TO authenticated
  WITH CHECK (author_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own posts"
  ON post FOR UPDATE
  TO authenticated
  USING (author_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (author_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own posts"
  ON post FOR DELETE
  TO authenticated
  USING (author_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Comment policies
CREATE POLICY "Anyone can view comments"
  ON comment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comment FOR INSERT
  TO authenticated
  WITH CHECK (author_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own comments"
  ON comment FOR DELETE
  TO authenticated
  USING (author_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Conversation policies
CREATE POLICY "Users can view own conversations"
  ON conversation FOR SELECT
  TO authenticated
  USING (participant_emails ? (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can create conversations"
  ON conversation FOR INSERT
  TO authenticated
  WITH CHECK (participant_emails ? (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own conversations"
  ON conversation FOR UPDATE
  TO authenticated
  USING (participant_emails ? (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (participant_emails ? (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Message policies
CREATE POLICY "Users can view messages in their conversations"
  ON message FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation 
      WHERE conversation.id = message.conversation_id 
      AND conversation.participant_emails ? (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON message FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM conversation 
      WHERE conversation.id = message.conversation_id 
      AND conversation.participant_emails ? (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON message FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation 
      WHERE conversation.id = message.conversation_id 
      AND conversation.participant_emails ? (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation 
      WHERE conversation.id = message.conversation_id 
      AND conversation.participant_emails ? (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Notification policies
CREATE POLICY "Users can view own notifications"
  ON notification FOR SELECT
  TO authenticated
  USING (recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Anyone can create notifications"
  ON notification FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notification FOR UPDATE
  TO authenticated
  USING (recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own notifications"
  ON notification FOR DELETE
  TO authenticated
  USING (recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- LiveClass policies
CREATE POLICY "Anyone can view live classes"
  ON live_class FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage live classes"
  ON live_class FOR ALL
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- DailyChallenge policies
CREATE POLICY "Anyone can view active challenges"
  ON daily_challenge FOR SELECT
  TO authenticated
  USING (is_active = true OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage challenges"
  ON daily_challenge FOR ALL
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- ChallengeSubmission policies
CREATE POLICY "Users can view own challenge submissions"
  ON challenge_submission FOR SELECT
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can create own challenge submissions"
  ON challenge_submission FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own challenge submissions"
  ON challenge_submission FOR UPDATE
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

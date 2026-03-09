import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createBase44Compatible = () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'demo@sewsheek.com',
    full_name: 'Demo User',
    avatar_url: null,
    role: 'admin',
    created_date: new Date().toISOString()
  };

  const createEntityHelper = (tableName) => ({
    list: async (orderBy = '-created_at', limit = 100) => {
      const isDesc = orderBy.startsWith('-');
      const column = isDesc ? orderBy.slice(1) : orderBy;

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(column, { ascending: !isDesc })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },

    filter: async (conditions = {}) => {
      let query = supabase.from(tableName).select('*');

      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    get: async (id) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    create: async (payload) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, payload) => {
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    }
  });

  return {
    auth: {
      me: async () => {
        return mockUser;
      },

      updateMe: async (updates) => {
        Object.assign(mockUser, updates);
        return mockUser;
      },

      logout: (redirectUrl) => {
        if (redirectUrl) {
          console.log('Logout with redirect:', redirectUrl);
        }
      },

      redirectToLogin: (returnUrl) => {
        console.log('Redirect to login:', returnUrl);
      }
    },

    entities: {
      User: createEntityHelper('auth.users'),
      UserPoints: createEntityHelper('user_points'),
      Category: createEntityHelper('category'),
      Course: createEntityHelper('course'),
      Lesson: createEntityHelper('lesson'),
      Enrollment: createEntityHelper('enrollment'),
      LessonProgress: createEntityHelper('lesson_progress'),
      Quiz: createEntityHelper('quiz'),
      QuizQuestion: createEntityHelper('quiz_question'),
      QuizAttempt: createEntityHelper('quiz_attempt'),
      LiveQuizParticipant: createEntityHelper('live_quiz_participant'),
      Post: createEntityHelper('post'),
      Comment: createEntityHelper('comment'),
      Conversation: createEntityHelper('conversation'),
      Message: createEntityHelper('message'),
      Notification: createEntityHelper('notification'),
      LiveClass: createEntityHelper('live_class'),
      DailyChallenge: createEntityHelper('daily_challenge'),
      ChallengeSubmission: createEntityHelper('challenge_submission')
    },

    integrations: {
      Core: {
        UploadFile: async ({ file }) => {
          const fileName = `${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, file);

          if (error) {
            console.error('Upload error:', error);
            return { file_url: URL.createObjectURL(file) };
          }

          const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

          return { file_url: publicUrl };
        }
      }
    }
  };
};

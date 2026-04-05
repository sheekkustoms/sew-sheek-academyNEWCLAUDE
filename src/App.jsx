import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './Layout';

// Page imports
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import LiveClassesHub from './pages/LiveClassesHub';
import ReplaysHub from './pages/ReplaysHub';
import TutorialsHub from './pages/TutorialsHub';
import LiveClasses from './pages/LiveClasses';
import MemberProfile from './pages/MemberProfile';
import Leaderboard from './pages/Leaderboard';
import QuizHome from './pages/QuizHome';
import QuizGame from './pages/QuizGame';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import ProfileSettings from './pages/ProfileSettings';
import Messages from './pages/Messages';
import CourseDetail from './pages/CourseDetail';
import DailyChallenges from './pages/DailyChallenges';
import UserProgress from './pages/UserProgress';
import LiveClassDetail from './pages/LiveClassDetail';

const LayoutWrapper = ({ children, currentPageName }) => (
  <Layout currentPageName={currentPageName}>{children}</Layout>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Dashboard" replace />} />

      <Route path="/Dashboard" element={<LayoutWrapper currentPageName="Dashboard"><Dashboard /></LayoutWrapper>} />
      <Route path="/LiveClassesHub" element={<LayoutWrapper currentPageName="LiveClassesHub"><LiveClassesHub /></LayoutWrapper>} />
      <Route path="/ReplaysHub" element={<LayoutWrapper currentPageName="ReplaysHub"><ReplaysHub /></LayoutWrapper>} />
      <Route path="/TutorialsHub" element={<LayoutWrapper currentPageName="TutorialsHub"><TutorialsHub /></LayoutWrapper>} />
      <Route path="/Classes" element={<LayoutWrapper currentPageName="Classes"><Classes /></LayoutWrapper>} />
      <Route path="/LiveClasses" element={<LayoutWrapper currentPageName="LiveClasses"><LiveClasses /></LayoutWrapper>} />
      <Route path="/MemberProfile" element={<LayoutWrapper currentPageName="MemberProfile"><MemberProfile /></LayoutWrapper>} />
      <Route path="/Leaderboard" element={<LayoutWrapper currentPageName="Leaderboard"><Leaderboard /></LayoutWrapper>} />
      <Route path="/QuizHome" element={<LayoutWrapper currentPageName="QuizHome"><QuizHome /></LayoutWrapper>} />
      <Route path="/QuizGame" element={<LayoutWrapper currentPageName="QuizGame"><QuizGame /></LayoutWrapper>} />
      <Route path="/AdminDashboard" element={<LayoutWrapper currentPageName="AdminDashboard"><AdminDashboard /></LayoutWrapper>} />
      <Route path="/Notifications" element={<LayoutWrapper currentPageName="Notifications"><Notifications /></LayoutWrapper>} />
      <Route path="/ProfileSettings" element={<LayoutWrapper currentPageName="ProfileSettings"><ProfileSettings /></LayoutWrapper>} />
      <Route path="/Messages" element={<LayoutWrapper currentPageName="Messages"><Messages /></LayoutWrapper>} />
      <Route path="/CourseDetail" element={<LayoutWrapper currentPageName="CourseDetail"><CourseDetail /></LayoutWrapper>} />
      <Route path="/DailyChallenges" element={<LayoutWrapper currentPageName="DailyChallenges"><DailyChallenges /></LayoutWrapper>} />
      <Route path="/UserProgress" element={<LayoutWrapper currentPageName="UserProgress"><UserProgress /></LayoutWrapper>} />
      <Route path="/LiveClassDetail" element={<LayoutWrapper currentPageName="LiveClassDetail"><LiveClassDetail /></LayoutWrapper>} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
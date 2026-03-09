/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import Community from './pages/Community';
import CourseDetail from './pages/CourseDetail';
import Courses from './pages/Courses';
import DailyChallenges from './pages/DailyChallenges';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import LiveClasses from './pages/LiveClasses';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import QuizGame from './pages/QuizGame';
import QuizHome from './pages/QuizHome';
import UserProgress from './pages/UserProgress';
import ProfileSettings from './pages/ProfileSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "Community": Community,
    "CourseDetail": CourseDetail,
    "Courses": Courses,
    "DailyChallenges": DailyChallenges,
    "Dashboard": Dashboard,
    "Leaderboard": Leaderboard,
    "LiveClasses": LiveClasses,
    "Messages": Messages,
    "Notifications": Notifications,
    "QuizGame": QuizGame,
    "QuizHome": QuizHome,
    "UserProgress": UserProgress,
    "ProfileSettings": ProfileSettings,
}

export const pagesConfig = {
    mainPage: "Community",
    Pages: PAGES,
    Layout: __Layout,
};
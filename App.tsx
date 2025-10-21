import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './components/auth/LoginPage';
import SetupPage from './components/auth/SetupPage';
import UserDashboard from './components/dashboard/UserDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import { APP_VERSION, LOGO_URL } from './constants';
import { useAuth } from './hooks/useAuth';
import Loader from './components/shared/Loader';
import PasswordResetPage from './components/auth/PasswordResetPage';

const AppContent: React.FC = () => {
    const { user, needsSetup, loading, error, isRecoveringPassword } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }
    
    // If there's a startup error, show an error screen instead of getting stuck.
    if (error && !user) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-gray-50 dark:bg-gray-800">
                 <img src={LOGO_URL} alt="Logo" className="h-16 w-auto mb-6" />
                <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg max-w-lg">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Application Error</h1>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">Could not connect to the backend service.</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    if (isRecoveringPassword) {
        return <PasswordResetPage />;
    }

    // If user is an admin, always show the admin dashboard.
    // This is a hard rule and prevents admins from accessing user pages.
    if (user?.role === 'admin') {
        return <AdminDashboard />;
    }

    if (!user) {
        return <LoginPage />;
    }

    // If user's subscription is expired, show the dashboard
    // which contains the renewal message, bypassing the setup page.
    if (user.status === 'expired') {
        return <UserDashboard />;
    }

    if (needsSetup) {
        return <SetupPage />;
    }

    return <UserDashboard />;
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
                    <AppContent />
                    <footer className="text-center py-4 text-xs text-gray-500">
                        Tathyas AI-Powered Parenting Bonus App - Version {APP_VERSION}
                    </footer>
                </div>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
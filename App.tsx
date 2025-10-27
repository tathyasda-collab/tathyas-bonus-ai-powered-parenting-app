
import React from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import { LoginPage } from './components/auth/LoginPage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import { SetupPage } from './components/auth/SetupPage';
import { ProfileSetupPage } from './components/auth/ProfileSetupPage';
import { Loader } from './components/shared/Loader';
import { PasswordResetPage } from './components/auth/PasswordResetPage';
import { ErrorToast } from './components/shared/ErrorToast';

const AppContent: React.FC = () => {
    const { user, loading, needsSetup, needsProfileSetup, isAdminView, isRecoveringPassword } = useAuth();
    const { theme } = useTheme();
    
    if (loading) {
        return (
            <div className={`h-screen w-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900' : 'gradient-bg'}`}>
                <div className="glass rounded-2xl p-8">
                    <Loader 
                        size="lg" 
                        type="pulse" 
                        message="✨ Loading your parenting assistant..."
                    />
                </div>
            </div>
        );
    }
    
    if (isRecoveringPassword) {
        return <PasswordResetPage />;
    }

    if (!user) {
        return <LoginPage />;
    }

    // Check admin status first - admins should go directly to admin dashboard
    // regardless of profile setup status
    if (isAdminView) {
        return <AdminDashboard />;
    }

    // New profile setup flow for first-time logins (non-admin users only)
    if (needsProfileSetup) {
        return <ProfileSetupPage />;
    }

    // Legacy setup page (if still needed, non-admin users only)
    if (needsSetup) {
        return <SetupPage />;
    }

    return <UserDashboard />;
};


function App() {
    return (
        <ThemeProvider>
            <ErrorProvider>
                <AuthProvider>
                    <AppContent />
                    <ErrorToast />
                </AuthProvider>
            </ErrorProvider>
        </ThemeProvider>
    );
}

export default App;
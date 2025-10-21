import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { LOGO_URL, APP_NAME } from '../../constants';
import Button from './Button';

const Header: React.FC = () => {
    const { user, logout, isAdminView, toggleAdminView } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center no-print">
            <div className="flex items-center space-x-4">
                <img src={LOGO_URL} alt="Logo" className="h-10 w-auto" />
                <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">{APP_NAME}</h1>
            </div>
            <div className="flex items-center space-x-4">
                {user && <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">{user.email}</span>}
                {user?.role === 'admin' && (
                    <Button onClick={toggleAdminView} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                        {isAdminView ? 'User View' : 'Admin View'}
                    </Button>
                )}
                <Button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
                    {theme === 'light' ? '🌙' : '☀️'}
                </Button>
                {user && (
                    <Button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white text-sm">
                        Logout
                    </Button>
                )}
            </div>
        </header>
    );
};

export default Header;
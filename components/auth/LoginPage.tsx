import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LOGO_URL, APP_NAME } from '../../constants';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { api, ApiError } from '../../services/api';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading, error: authError } = useAuth();

    const [view, setView] = useState<'login' | 'forgot'>('login');
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [message, setMessage] = useState('');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setMessage('');
        login(email, password);
    };
    
    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalLoading(true);
        setLocalError('');
        setMessage('');
        try {
            await api.forgotPassword(email);
            setMessage('Password reset link sent! Please check your email inbox (and spam folder).');
        } catch (err) {
            if (err instanceof ApiError) {
                setLocalError(err.userMessage);
            } else {
                setLocalError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLocalLoading(false);
        }
    };

    const switchView = (targetView: 'login' | 'forgot') => {
        setView(targetView);
        setLocalError('');
        setMessage('');
        setPassword('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <img src={LOGO_URL} alt="Tathyas Logo" className="h-20 w-auto" />
                </div>
                <Card>
                    {message && <p className="text-sm text-center mb-4 text-green-600" aria-live="polite">{message}</p>}
                    
                    {view === 'login' && (
                        <>
                            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">{APP_NAME}</h2>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Please sign in to continue</p>
                            <form onSubmit={handleLoginSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"/>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                    <div className="mt-1 relative">
                                        <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"/>
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400" aria-label={showPassword ? "Hide password" : "Show password"}>
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                    <div className="text-sm text-right mt-2">
                                        <a href="#" onClick={(e) => { e.preventDefault(); switchView('forgot'); }} className="font-medium text-green-600 hover:text-green-500">Forgot password?</a>
                                    </div>
                                </div>
                                {authError && <p className="text-sm text-red-600" aria-live="polite">{authError}</p>}
                                <div>
                                    <Button type="submit" disabled={loading} className="w-full flex justify-center bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400">{loading ? 'Signing In...' : 'Sign In'}</Button>
                                </div>
                            </form>
                        </>
                    )}

                    {view === 'forgot' && (
                        <>
                            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Reset Password</h2>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Enter your email to receive a reset link.</p>
                            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email-forgot" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                    <input id="email-forgot" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"/>
                                </div>
                                {localError && <p className="text-sm text-red-600" aria-live="polite">{localError}</p>}
                                <div>
                                    <Button type="submit" disabled={localLoading} className="w-full flex justify-center bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400">{localLoading ? 'Sending...' : 'Send Reset Link'}</Button>
                                </div>
                                <div className="text-center">
                                    <a href="#" onClick={() => switchView('login')} className="text-sm font-medium text-green-600 hover:text-green-500">Back to Sign In</a>
                                </div>
                            </form>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
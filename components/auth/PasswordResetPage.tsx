import React, { useState } from 'react';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { LOGO_URL } from '../../constants';

const PasswordResetPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { finishPasswordRecovery, logout } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        
        setLoading(true);

        try {
            await api.updatePassword(password);
            setSuccess(true);
            setTimeout(() => {
                // After password reset, the Supabase session is still active,
                // but it's best practice to force a re-login.
                logout().then(() => {
                    finishPasswordRecovery();
                });
            }, 3000);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.userMessage);
            } else {
                setError('An unexpected error occurred. Please try again.');
                console.error("An unexpected error occurred during password update:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <img src={LOGO_URL} alt="Tathyas Logo" className="h-20 w-auto" />
                </div>
                <Card>
                    {!success ? (
                        <>
                            <h2 className="text-2xl font-bold text-center mb-6">Set a New Password</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="new-password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                    <input
                                        id="new-password"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirm-password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                <Button type="submit" disabled={loading} className="w-full flex justify-center bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400">
                                    {loading ? 'Updating...' : 'Update Password'}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">Password Updated!</h2>
                            <p className="text-gray-600 dark:text-gray-300">Your password has been changed successfully. You will be redirected to the login page shortly.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default PasswordResetPage;
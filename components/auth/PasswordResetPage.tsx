
import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { APP_NAME, LOGO_URL } from '../../constants';
import { useError } from '../../context/ErrorContext';
import { useTheme } from '../../context/ThemeContext';

export const PasswordResetPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isValidReset, setIsValidReset] = useState(false);
    const { showError } = useError();
    const { theme } = useTheme();

    useEffect(() => {
        // Check if we have the necessary URL parameters for password reset
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');
        
        if (type === 'recovery' && accessToken && refreshToken) {
            setIsValidReset(true);
            console.log('Valid password reset link detected');
        } else {
            setMessage('Invalid or expired password reset link. Please request a new one.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isValidReset) {
            showError("Invalid password reset session. Please request a new reset link.");
            return;
        }
        
        if (password.length < 6) {
            showError("Password must be at least 6 characters long.");
            return;
        }
        
        if (password !== confirmPassword) {
            showError("Passwords do not match.");
            return;
        }
        
        setLoading(true);
        setMessage('');
        
        try {
            await api.updatePassword(password);
            setMessage('Password updated successfully! You can now log in with your new password.');
            
            // Redirect to login page after 3 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        } catch (err: any) {
            showError(err.message || 'Failed to update password. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${
            theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800' 
                : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'
        }`}>
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center mb-4">
                        <div className="relative">
                            <img src={LOGO_URL} alt="Logo" className="h-16 w-16 filter brightness-0 invert rounded-xl pulse-glow" />
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full sparkle"></div>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">{APP_NAME}</h1>
                    <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full mx-auto"></div>
                </div>
                
                <Card variant="glass" className="relative overflow-hidden">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            🔒 Reset Your Password
                        </h2>
                        <p className="text-white/80">
                            {isValidReset 
                                ? 'Enter your new password below.'
                                : 'Please check the link and try again.'}
                        </p>
                    </div>
                    
                    {isValidReset ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                                    New Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                                    placeholder="Enter your new password"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                                    placeholder="Confirm your new password"
                                />
                            </div>
                            
                            {message && (
                                <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3">
                                    <p className="text-green-200 text-sm text-center">{message}</p>
                                </div>
                            )}
                            
                            <Button type="submit" className="w-full" isLoading={loading} variant="gradient" size="lg">
                                🔑 Update Password
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                                <p className="text-red-200 text-sm">{message}</p>
                            </div>
                            <Button 
                                onClick={() => window.location.href = '/'} 
                                variant="gradient" 
                                className="w-full"
                            >
                                ← Back to Login
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
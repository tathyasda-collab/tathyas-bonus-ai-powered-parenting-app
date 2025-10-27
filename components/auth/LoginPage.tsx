
import React, { useState } from 'react';
import * as api from '../../services/api';
import { ApiError } from '../../services/api';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { APP_NAME, LOGO_URL } from '../../constants';
import { useError } from '../../context/ErrorContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showSubscriptionExpired, setShowSubscriptionExpired] = useState(false);
  const [currentRenewalUrl, setCurrentRenewalUrl] = useState<string | null>(null);
  const { showError } = useError();
  const { theme } = useTheme();
  const { subscriptionExpired, renewalUrl } = useAuth();

  // Show subscription expired popup if triggered by context
  React.useEffect(() => {
    if (subscriptionExpired && renewalUrl) {
      setShowSubscriptionExpired(true);
      setCurrentRenewalUrl(renewalUrl);
    }
  }, [subscriptionExpired, renewalUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      if (isForgotPassword) {
        await api.forgotPassword(email);
        setMessage('Password reset link sent! Check your email.');
      } else {
        await api.loginWithPassword(email, password);
        // Successful login will redirect automatically based on needsProfileSetup
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err instanceof ApiError && err.message === 'SUBSCRIPTION_EXPIRED') {
        // Handle subscription expiry
        setShowSubscriptionExpired(true);
        setCurrentRenewalUrl(err.data?.renewalUrl || '#');
        
        // Dispatch subscription expired event
        window.dispatchEvent(new CustomEvent('subscription-expired', {
          detail: { renewalUrl: err.data?.renewalUrl }
        }));
      } else {
        showError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRenewalRedirect = () => {
    if (currentRenewalUrl && currentRenewalUrl !== '#') {
      window.open(currentRenewalUrl, '_blank');
    }
    setShowSubscriptionExpired(false);
  };

  const closeSubscriptionPopup = () => {
    setShowSubscriptionExpired(false);
    setCurrentRenewalUrl(null);
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
              {isForgotPassword ? '🔐 Reset Password' : '👋 Welcome Back'}
            </h2>
            <p className="text-white/80">
              {isForgotPassword 
                ? 'Enter your email to receive a password reset link.'
                : 'Sign in to your account'}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                placeholder="you@example.com"
              />
            </div>
            
            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                  placeholder="Enter your password"
                />
              </div>
            )}
            
            {message && (
              <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3">
                <p className="text-green-200 text-sm text-center">{message}</p>
              </div>
            )}
            
            <Button type="submit" className="w-full" isLoading={loading} variant="gradient" size="lg">
              {isForgotPassword ? '📧 Send Reset Link' : '🚀 Sign In'}
            </Button>
          </form>
          
          <div className="text-center mt-6">
            <button 
              onClick={() => setIsForgotPassword(!isForgotPassword)} 
              className="text-white/80 hover:text-white transition-colors duration-200 underline decoration-white/50 hover:decoration-white"
            >
              {isForgotPassword ? '← Back to Sign In' : '🔒 Forgot your password?'}
            </button>
          </div>
        </Card>
      </div>

      {/* Subscription Expired Popup */}
      {showSubscriptionExpired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Subscription Expired
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Your subscription has expired. Please renew to continue using the app.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={handleRenewalRedirect}
                  className="flex-1"
                  disabled={!currentRenewalUrl || currentRenewalUrl === '#'}
                >
                  Renew Subscription
                </Button>
                <Button
                  onClick={closeSubscriptionPopup}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
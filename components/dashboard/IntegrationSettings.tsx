
import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import * as api from '../../services/api';
import * as geminiService from '../../services/geminiService';

interface IntegrationSettingsProps {
    onBack: () => void;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({ onBack }) => {
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [platformName, setPlatformName] = useState('');
    const [platformInstructions, setPlatformInstructions] = useState('');
    const [loadingInstructions, setLoadingInstructions] = useState(false);

    const popularPlatforms = [
        'Supabase',
        'Firebase',
        'AWS Amplify',
        'Vercel',
        'Netlify',
        'Railway',
        'PlanetScale',
        'MongoDB Atlas',
        'Heroku',
        'DigitalOcean'
    ];

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await api.adminCreateUser(newUserEmail, newUserRole);
            setMessage(`${newUserRole === 'admin' ? 'Admin user' : 'User'} invitation sent to ${newUserEmail}.`);
            setNewUserEmail('');
            setNewUserRole('user');
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generatePlatformInstructions = async (platform: string) => {
        setLoadingInstructions(true);
        try {
            const prompt = `Generate comprehensive step-by-step instructions for adding user details to ${platform} for a parenting app database. Include:

1. Initial setup and account creation on ${platform}
2. Database/table creation for user profiles with these fields:
   - email (primary key)
   - full_name
   - gender, age, phone
   - spouse_name, spouse_gender, spouse_age
   - street_address, district, state, pin_code
   - baby_name, baby_gender, baby_date_of_birth
   - role (user/admin)
   - subscription dates

3. Adding new users through the platform interface
4. Setting up authentication and permissions
5. User renewal process and subscription management
6. Security best practices and data protection
7. API integration setup if applicable

Make the instructions clear, beginner-friendly, and include specific screenshots locations or button names where possible.`;

            const instructions = await geminiService.getEmotionSupport('helpful', prompt, 'English');
            setPlatformInstructions(instructions);
        } catch (error) {
            setPlatformInstructions('Error generating instructions. Please try again.');
        } finally {
            setLoadingInstructions(false);
        }
    };

    const handlePlatformSelect = (platform: string) => {
        setPlatformName(platform);
        generatePlatformInstructions(platform);
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button 
                    onClick={onBack} 
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Admin Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Integration Settings</h1>
                <div></div> {/* Spacer for center alignment */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Creation Section */}
                <Card title="Create New User">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Manually create a new user or admin and send them an invitation email. 
                        The user will be prompted to set up their password and profile.
                    </p>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="user@example.com"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                User Role
                            </label>
                            <select
                                id="role"
                                value={newUserRole}
                                onChange={(e) => setNewUserRole(e.target.value as 'user' | 'admin')}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="user">Regular User</option>
                                <option value="admin">Administrator</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Admins have access to dashboard and analytics. Regular users can only access parenting tools.
                            </p>
                        </div>
                        
                        {message && (
                            <div className={`text-sm p-3 rounded ${message.includes('Error') || message.includes('Failed') 
                                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                                : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            }`}>
                                {message}
                            </div>
                        )}
                        
                        <Button type="submit" isLoading={loading} className="w-full">
                            Create & Invite {newUserRole === 'admin' ? 'Admin' : 'User'}
                        </Button>
                    </form>
                </Card>

                {/* API Integration Section */}
                <Card title="API & Integration Details">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Integration information and data export tools.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Database Connection</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Database connection is configured and active. Contact your system administrator for connection details if needed for external integrations.
                            </p>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Data Export</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Export all application data for backup or analysis purposes.
                            </p>
                            <Button onClick={() => alert("Exporting data...")} variant="secondary" className="w-full">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export All Data (CSV)
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Platform Instructions Section */}
            <Card title="Platform Setup Instructions">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Get step-by-step instructions for setting up user management on various platforms.
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select or Enter Platform Name
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="platform"
                                type="text"
                                value={platformName}
                                onChange={(e) => setPlatformName(e.target.value)}
                                placeholder="Enter platform name (e.g., Supabase, Firebase)"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <Button
                                onClick={() => platformName && generatePlatformInstructions(platformName)}
                                disabled={!platformName || loadingInstructions}
                                isLoading={loadingInstructions}
                            >
                                Generate Instructions
                            </Button>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Popular Platforms:</p>
                        <div className="flex flex-wrap gap-2">
                            {popularPlatforms.map((platform) => (
                                <button
                                    key={platform}
                                    onClick={() => handlePlatformSelect(platform)}
                                    disabled={loadingInstructions}
                                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {platform}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loadingInstructions && (
                        <div className="flex items-center justify-center p-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Generating instructions for {platformName}...
                                </p>
                            </div>
                        </div>
                    )}

                    {platformInstructions && !loadingInstructions && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                                    Setup Instructions for {platformName}
                                </h4>
                                <Button
                                    onClick={() => {
                                        const element = document.createElement('a');
                                        const file = new Blob([platformInstructions], { type: 'text/plain' });
                                        element.href = URL.createObjectURL(file);
                                        element.download = `${platformName.toLowerCase()}_setup_instructions.txt`;
                                        document.body.appendChild(element);
                                        element.click();
                                        document.body.removeChild(element);
                                    }}
                                    variant="secondary"
                                    size="sm"
                                >
                                    Download as TXT
                                </Button>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
                                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {platformInstructions}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
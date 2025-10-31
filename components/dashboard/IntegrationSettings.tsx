import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import * as api from '../../services/api';
import * as geminiService from '../../services/geminiService';

interface IntegrationSettingsProps {
    onBack: () => void;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({ onBack }) => {
    // New user creation state
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserLoading, setNewUserLoading] = useState(false);
    const [newUserMessage, setNewUserMessage] = useState('');
    
    // Admin upgrade state
    const [upgradeEmail, setUpgradeEmail] = useState('');
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState('');
    
    // Platform instructions state
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

    const validateEmail = (email: string): string | null => {
        // Check if email is empty
        if (!email.trim()) {
            return 'Email is required';
        }
        
        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        
        // Check for reserved/test domains that Supabase rejects
        const invalidDomains = ['example.com', 'test.com', 'localhost', 'invalid.com', 'fake.com'];
        const domain = email.toLowerCase().split('@')[1];
        if (invalidDomains.includes(domain)) {
            return `Domain "${domain}" is not allowed. Please use a real domain like gmail.com, outlook.com, or your company domain.`;
        }
        
        return null;
    };

    const generateValidEmail = (): string => {
        const timestamp = Date.now();
        const domains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        return `user${timestamp}@${randomDomain}`;
    };

    const fillExampleEmail = () => {
        setNewUserEmail(generateValidEmail());
        setNewUserPassword('Password123!');
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewUserLoading(true);
        setNewUserMessage('');
        
        // Validate email before attempting creation
        const emailError = validateEmail(newUserEmail);
        if (emailError) {
            setNewUserMessage(emailError);
            setNewUserLoading(false);
            return;
        }
        
        try {
            // Create a regular user with email and password
            const result = await api.adminCreateUser(newUserEmail, 'user', newUserPassword);
            setNewUserMessage(`User account created successfully for ${newUserEmail}.`);
            setNewUserEmail('');
            setNewUserPassword('');
        } catch (err: any) {
            setNewUserMessage(`Error: ${err.message}`);
        } finally {
            setNewUserLoading(false);
        }
    };

    const handleUpgradeToAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpgradeLoading(true);
        setUpgradeMessage('');
        
        // Validate email before attempting upgrade
        const emailError = validateEmail(upgradeEmail);
        if (emailError) {
            setUpgradeMessage(emailError);
            setUpgradeLoading(false);
            return;
        }
        
        try {
            // Upgrade existing user to admin role
            await api.upgradeUserToAdmin(upgradeEmail);
            setUpgradeMessage(`User ${upgradeEmail} has been upgraded to admin successfully.`);
            setUpgradeEmail('');
        } catch (err: any) {
            setUpgradeMessage(`Error: ${err.message}`);
        } finally {
            setUpgradeLoading(false);
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
                <div></div> {/* Spacer for center alignment */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* New User Creation Section */}
                <Card title="Create New User">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Create a new user account with email and password. The user will be able to login immediately.
                    </p>
                    
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={fillExampleEmail}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            📝 Fill with valid example
                        </button>
                    </div>
                    
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label htmlFor="new-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email Address
                            </label>
                            <input
                                id="new-email"
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="user@gmail.com"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Use real domains like gmail.com, outlook.com, or your company domain. Avoid test domains like example.com.
                            </p>
                        </div>
                        
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                required
                                minLength={8}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Minimum 8 characters"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Password should be at least 8 characters long and contain letters and numbers.
                            </p>
                        </div>
                        
                        {newUserMessage && (
                            <div className={`text-sm p-3 rounded ${newUserMessage.includes('Error') || newUserMessage.includes('Failed') 
                                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                                : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            }`}>
                                {newUserMessage}
                            </div>
                        )}
                        
                        <Button type="submit" isLoading={newUserLoading} className="w-full">
                            Create User Account
                        </Button>
                    </form>
                </Card>

                {/* Admin Upgrade Section */}
                <Card title="Upgrade User to Admin">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Upgrade an existing user to admin role. The user must already exist in the system.
                    </p>
                    <form onSubmit={handleUpgradeToAdmin} className="space-y-4">
                        <div>
                            <label htmlFor="upgrade-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                User Email Address
                            </label>
                            <input
                                id="upgrade-email"
                                type="email"
                                value={upgradeEmail}
                                onChange={(e) => setUpgradeEmail(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="existing-user@gmail.com"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Enter the email of an existing user to upgrade them to admin role. Must be a real email domain.
                            </p>
                        </div>
                        
                        {upgradeMessage && (
                            <div className={`text-sm p-3 rounded ${upgradeMessage.includes('Error') || upgradeMessage.includes('Failed') 
                                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                                : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            }`}>
                                {upgradeMessage}
                            </div>
                        )}
                        
                        <Button type="submit" isLoading={upgradeLoading} className="w-full bg-orange-600 hover:bg-orange-700">
                            Upgrade to Admin
                        </Button>
                    </form>
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
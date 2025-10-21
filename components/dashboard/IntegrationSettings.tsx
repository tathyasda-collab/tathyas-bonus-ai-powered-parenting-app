import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { api, ApiError } from '../../services/api';

interface IntegrationSettingsProps {
    onBack: () => void;
}

const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({ onBack }) => {
    // State for creating a user
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // State for the new text box
    const [integrationPlatform, setIntegrationPlatform] = useState('');

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        try {
            await api.adminCreateUser(email, password);
            setSuccessMessage(`User ${email} created successfully! They can now log in.`);
            setEmail('');
            setPassword('');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.userMessage);
            } else {
                setError("An unexpected error occurred while creating the user.");
                console.error("Unexpected error in user creation:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Button onClick={onBack} className="mb-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                &larr; Back to Dashboard
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-2xl font-bold mb-4">Add New User</h2>
                    <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                        Manually create a new user in the authentication system. They will be prompted to complete their profile on first login, and a default 90-day subscription will be created for them in `app_users`.
                    </p>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="Min. 6 characters"
                                className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}
                        <div>
                            <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                                {loading ? 'Creating User...' : 'Create User'}
                            </Button>
                        </div>
                    </form>
                </Card>
                
                <Card>
                    <h2 className="text-2xl font-bold mb-4">Integration Setup</h2>
                    <div className="space-y-6 text-sm text-gray-600 dark:text-gray-300">
                         <div>
                            <label htmlFor="integration-platform" className="block text-sm font-medium mb-1">
                                Your Integration Platform
                            </label>
                            <input
                                id="integration-platform"
                                type="text"
                                value={integrationPlatform}
                                onChange={e => setIntegrationPlatform(e.target.value)}
                                placeholder="e.g., Systeme.io, Pabbly, Custom Site"
                                className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Enter the name of the platform you are integrating with for your records.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Pabbly / Zapier / Make Setup</h3>
                            <p>To automatically add users from your payment gateway (e.g., Razorpay, Stripe):</p>
                            <ol className="list-decimal list-inside mt-2 space-y-1">
                                <li>Create a new workflow/zap.</li>
                                <li>Set the trigger to "New Successful Payment" in your payment gateway app.</li>
                                <li>Add an action: "Webhook".</li>
                                <li>Configure a POST request to a custom Supabase Edge Function URL.</li>
                                <li>The request body should be JSON with the user's `email` and a temporary `password`.</li>
                                <li>Your Edge Function will then call the `admin_create_user` function to create the user.</li>
                            </ol>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-2">Systeme.io / Superprofile</h3>
                             <p>For platforms that support webhooks on user signup or purchase:</p>
                             <ol className="list-decimal list-inside mt-2 space-y-1">
                                <li>Find the "Webhooks" section in your platform's settings.</li>
                                <li>Add a new webhook that triggers on a new sale or contact creation.</li>
                                <li>Use the same Supabase Edge Function URL as the destination.</li>
                                <li>Map the platform's fields to send `email` and a generated `password` in the webhook payload.</li>
                             </ol>
                        </div>
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-lg text-yellow-800 dark:text-yellow-200">
                            <strong>Note:</strong> Securely creating users requires custom server-side logic (like Supabase Edge Functions) to protect your Supabase service key. Do not expose admin credentials on the client-side.
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default IntegrationSettings;
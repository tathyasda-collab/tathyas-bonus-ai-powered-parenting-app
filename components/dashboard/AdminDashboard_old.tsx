
import React, { useState, useEffect } from 'react';
import { Header } from '../shared/Header';
import { Card } from '../shared/Card';
import * as api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IntegrationSettings } from './IntegrationSettings';

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: string }) => (
    <Card className="!p-0">
        <div className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 mr-4">
                <span className="text-2xl">{icon}</span>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
        </div>
    </Card>
);

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ totalUsers: 0, activeSubscriptions: 0, toolUsage: [] });
    const [expiringUsers, setExpiringUsers] = useState<{ email: string, expires_in_days: number }[]>([]);
    const [activeView, setActiveView] = useState<'dashboard' | 'settings'>('dashboard');

    useEffect(() => {
        // Mock data for now - implement these functions in api.ts when needed
        setStats({ totalUsers: 0, activeSubscriptions: 0, toolUsage: [] });
        setExpiringUsers([]);
        // api.getAdminStats().then(setStats);
        // api.getExpiringSoonUsers().then(setExpiringUsers);
    }, []);

    if (activeView === 'settings') {
        return <IntegrationSettings setActiveView={setActiveView} />;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Header />
            <main className="flex justify-center px-4 py-6">
                <div className="w-full max-w-6xl space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
                         <button onClick={() => setActiveView('settings')} className="text-blue-600 dark:text-blue-400 hover:underline">
                            Integration Settings &rarr;
                        </button>
                    </div>
                
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard title="Total Users" value={stats.totalUsers} icon="👥" />
                        <StatCard title="Active Subs" value={stats.activeSubscriptions} icon="✅" />
                        <StatCard title="Expiring Soon" value={expiringUsers.length} icon="⏳" />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card title="Tool Usage" className="lg:col-span-2">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.toolUsage}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff' }}/>
                                    <Legend />
                                    <Bar dataKey="count" fill="#3B82F6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        <Card title="Subscriptions Expiring Soon">
                            <div className="space-y-3 max-h-72 overflow-y-auto">
                                {expiringUsers.map(user => (
                                    <div key={user.email} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-700 dark:text-gray-300">{user.email}</span>
                                        <span className="font-semibold text-red-500">{user.expires_in_days} days</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};
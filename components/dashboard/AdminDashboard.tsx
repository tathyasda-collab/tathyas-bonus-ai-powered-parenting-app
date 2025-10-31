import React, { useState, useEffect } from 'react';
import { Header } from '../shared/Header';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import * as api from '../../services/api';
import { ApiError } from '../../types';
import { Loader } from '../shared/Loader';
import { IntegrationSettings } from './IntegrationSettings';
import PerformanceAnalytics from './PerformanceAnalytics';
import JSZip from 'jszip';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; className?: string; subtitle?: string }> = ({ title, value, icon, className = '', subtitle }) => (
    <Card className={`flex items-center p-4 ${className}`}>
        <div className="p-3 rounded-full bg-opacity-20 text-2xl mr-4">{icon}</div>
        <div className="flex-1">
            <h4 className="font-bold text-gray-600 dark:text-gray-300 text-sm">{title}</h4>
            <p className="text-2xl font-semibold">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
    </Card>
);

const MetricCard: React.FC<{ title: string; metrics: Array<{ label: string; value: number | string; color?: string }> }> = ({ title, metrics }) => (
    <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-gray-700">{title}</h3>
        <div className="space-y-3">
            {metrics.map((metric, index) => (
                <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{metric.label}</span>
                    <span className={`font-semibold ${metric.color || 'text-gray-900 dark:text-gray-100'}`}>
                        {metric.value}
                    </span>
                </div>
            ))}
        </div>
    </Card>
);

const ProductivityChart: React.FC<{ stats: any }> = ({ stats }) => {
    if (!stats) return null;

    // Use the correct structure from getAdminStats() function
    const tools = [
        { name: 'Parenting Planner', data: stats.toolUsage?.planner || { total: 0, day: 0, month: 0 }, color: 'bg-emerald-500' },
        { name: 'Meal Assistant', data: stats.toolUsage?.meal || { total: 0, day: 0, month: 0 }, color: 'bg-sky-500' },
        { name: 'Emotion Check-in', data: stats.toolUsage?.emotion || { total: 0, day: 0, month: 0 }, color: 'bg-purple-500' },
    ];
    
    const totalUsageValues = tools.map(t => t.data.total);
    const maxUsage = Math.max(...totalUsageValues, 1);
    
    const totalInteractions = stats.totalLogs || 0;
    const meanUsage = tools.length > 0 ? totalInteractions / tools.length : 0;
    const meanLinePosition = (meanUsage / maxUsage) * 100;

    const avgCostPerInteraction = totalInteractions > 0 ? (stats.geminiCost?.total || 0) / totalInteractions : 0;
    const interactionsPerUser = (stats.registeredUsers || 0) > 0 ? totalInteractions / stats.registeredUsers : 0;

    const breakdownTotalUsage = tools.reduce((sum, tool) => sum + tool.data.total, 0);
    const breakdownTotalDay = tools.reduce((sum, tool) => sum + tool.data.day, 0);
    const breakdownTotalMonth = tools.reduce((sum, tool) => sum + tool.data.month, 0);

    const formatCurrency = (amount: number, decimals = 2) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    };

    return (
        <Card>
            <h3 className="text-xl font-semibold mb-4">Tool Usage Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6 border-b dark:border-gray-700 pb-6">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">Total Interactions</p>
                    <p className="text-2xl font-semibold">{totalInteractions.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">Interactions / User</p>
                    <p className="text-2xl font-semibold">{interactionsPerUser.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">Avg. Cost / Interaction</p>
                    <p className="text-2xl font-semibold">{formatCurrency(avgCostPerInteraction)}</p>
                </div>
            </div>

            <div className="relative flex justify-around items-end h-64 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {meanUsage > 0 && (
                    <div 
                        className="absolute w-full left-0 border-t-2 border-dashed border-red-500" 
                        style={{ bottom: `${meanLinePosition}%` }}
                        title={`Average Usage: ${meanUsage.toFixed(1)}`}
                    >
                        <span className="absolute -top-3 right-0 text-xs text-red-500 bg-gray-50 dark:bg-gray-700/50 px-1 rounded">
                            Avg: {meanUsage.toFixed(1)}
                        </span>
                    </div>
                )}
                
                {tools.map(tool => {
                    const barHeight = (tool.data.total / maxUsage) * 100;
                    const toolName = tool.name.replace('Parenting ', '').replace(' Assistant', '').replace(' Check-in', '');

                    return (
                        <div key={tool.name} className="flex flex-col items-center w-1/4 h-full text-center z-10">
                            <div className="relative w-16 h-full flex flex-col justify-end group">
                                <div 
                                    className={`${tool.color} w-full transition-all duration-300 hover:opacity-80`} 
                                    style={{ height: `${barHeight}%` }} 
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none">
                                    {tool.data.total.toLocaleString()}
                                </div>
                            </div>
                            <div className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">{toolName}</div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t dark:border-gray-700">
                <h4 className="font-semibold text-lg mb-2">Usage Breakdown</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700/50">
                                <th className="p-3 font-semibold text-sm">Tool</th>
                                <th className="p-3 font-semibold text-sm text-right">Total Usage</th>
                                <th className="p-3 font-semibold text-sm text-right">Last 24h</th>
                                <th className="p-3 font-semibold text-sm text-right">This Month</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tools.map((tool) => (
                                <tr key={tool.name} className="border-b dark:border-gray-700 last:border-b-0">
                                    <td className="p-3 font-medium">{tool.name}</td>
                                    <td className="p-3 text-right">{tool.data.total.toLocaleString()}</td>
                                    <td className="p-3 text-right">{tool.data.day.toLocaleString()}</td>
                                    <td className="p-3 text-right">{tool.data.month.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-gray-200 dark:border-gray-600">
                            <tr className="font-bold bg-gray-100 dark:bg-gray-700/50">
                                <td className="p-3">Total</td>
                                <td className="p-3 text-right">{breakdownTotalUsage.toLocaleString()}</td>
                                <td className="p-3 text-right">{breakdownTotalDay.toLocaleString()}</td>
                                <td className="p-3 text-right">{breakdownTotalMonth.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </Card>
    );
};


const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [renewalLink, setRenewalLink] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [view, setView] = useState<'dashboard' | 'integrations' | 'performance'>('dashboard');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch stats directly from view
                const adminStats = await api.getAdminStats();
                const link = await api.getRenewalLink();
                setStats(adminStats);
                setRenewalLink(link || '');
            } catch (err) {
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError("An unexpected error occurred while fetching admin data.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpdateLink = async () => {
        try {
            await api.updateRenewalLink(renewalLink);
            alert('Link updated successfully!');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to update link.";
            alert(message);
        }
    };
    
    const downloadCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) {
            alert(`No data to download for ${filename}.`);
            return;
        }
        
        // Sanitize filename
        const safeFilename = filename.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    
        const headers = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
        const csvRows = [headers.join(',')];

        for (const row of data) {
            const values = headers.map(header => {
                const rawValue = row[header];
                const escaped = ('' + (rawValue ?? '')).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `${safeFilename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = async () => {
        setIsDownloading(true);
        try {
            const allData = await api.getAllDataForExport();
            const zip = new JSZip();
            
            // Convert each table to CSV and add to zip
            for (const tableName in allData) {
                if (allData[tableName].length > 0) {
                    const data = allData[tableName];
                    const headers = Array.from(new Set(data.flatMap((obj: Record<string, any>) => Object.keys(obj))));
                    const csvRows = [headers.join(',')];

                    for (const row of data) {
                        const values = headers.map((header: string) => {
                            const rowData = row as Record<string, any>;
                            const rawValue = rowData[header];
                            const escaped = ('' + (rawValue ?? '')).replace(/"/g, '""');
                            return `"${escaped}"`;
                        });
                        csvRows.push(values.join(','));
                    }

                    const csvContent = csvRows.join("\n");
                    zip.file(`${tableName}.csv`, csvContent);
                }
            }

            // Generate zip file and download
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(zipBlob);
            link.download = `admin_data_export_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "An error occurred while downloading data.";
            alert(message);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadExpiring = async () => {
        try {
            const data = await api.getExpiringSoonUsers();
            downloadCSV(data, 'expiring_soon');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Could not download the list of expiring users.";
            alert(message);
        }
    };

    const handleRefreshStats = async () => {
        setIsRefreshing(true);
        try {
            console.log('Manually refreshing admin statistics...');
            await api.refreshAdminStats();
            
            // Fetch updated stats
            const adminStats = await api.getAdminStats();
            setStats(adminStats);
            
            alert('Statistics refreshed successfully!');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to refresh statistics.";
            alert(message);
        } finally {
            setIsRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div>
                <Header />
                <div className="flex justify-center items-center h-[calc(100vh-80px)]"><Loader /></div>
            </div>
        );
    }
    
    if (error) {
        return (
             <div>
                <Header />
                <p className="text-center text-red-500 p-8" aria-live="polite">{error}</p>
            </div>
        )
    }

    if (!stats) {
         return (
             <div>
                <Header />
                <p className="text-center text-gray-500 p-8">No admin data is available.</p>
            </div>
        )
    }

    // Primary stats cards with comprehensive data
    const primaryStats = [
        { title: 'Total Users', value: stats.registeredUsers || 0, icon: '👥', className: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300', subtitle: `${(stats.registeredUsers || 0) - (stats.adminUsers || 0)} regular, ${stats.adminUsers || 0} admins` },
        { title: 'Active Users', value: stats.activeUsers || 0, icon: '✅', className: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300', subtitle: `${(stats.activeUsers || 0) - (stats.adminUsers || 0)} regular users active` },
        { title: 'Expired Users', value: stats.expiredUsers || 0, icon: '⚠️', className: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300' },
        { title: 'Expiring Soon', value: stats.expiringSoon || 0, icon: '⏰', className: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300' },
        { title: 'Total AI Logs', value: stats.totalLogs || 0, icon: '🤖', className: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300' },
    ];

    // Tool usage metrics
    const toolMetrics = [
        { label: 'Planner (Total)', value: (stats.toolUsage?.planner?.total || 0).toLocaleString(), color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Planner (Today)', value: (stats.toolUsage?.planner?.day || 0).toLocaleString(), color: 'text-emerald-500' },
        { label: 'Planner (Month)', value: (stats.toolUsage?.planner?.month || 0).toLocaleString(), color: 'text-emerald-500' },
        { label: 'Meals (Total)', value: (stats.toolUsage?.meal?.total || 0).toLocaleString(), color: 'text-sky-600 dark:text-sky-400' },
        { label: 'Meals (Today)', value: (stats.toolUsage?.meal?.day || 0).toLocaleString(), color: 'text-sky-500' },
        { label: 'Meals (Month)', value: (stats.toolUsage?.meal?.month || 0).toLocaleString(), color: 'text-sky-500' },
        { label: 'Emotions (Total)', value: (stats.toolUsage?.emotion?.total || 0).toLocaleString(), color: 'text-purple-600 dark:text-purple-400' },
        { label: 'Emotions (Today)', value: (stats.toolUsage?.emotion?.day || 0).toLocaleString(), color: 'text-purple-500' },
        { label: 'Emotions (Month)', value: (stats.toolUsage?.emotion?.month || 0).toLocaleString(), color: 'text-purple-500' },
    ];

    // AI cost metrics
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const costMetrics = [
        { label: 'Total AI Cost', value: formatCurrency(stats.geminiCost?.total || 0), color: 'text-red-600 dark:text-red-400' },
        { label: 'Gemini Total', value: formatCurrency(stats.geminiCost?.total || 0), color: 'text-orange-600 dark:text-orange-400' },
        { label: 'Gemini (Month)', value: formatCurrency(stats.geminiCost?.month || 0), color: 'text-orange-500' },
        { label: 'Gemini (Today)', value: formatCurrency(stats.geminiCost?.day || 0), color: 'text-orange-500' },
        { label: 'Input Tokens', value: '0', color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Output Tokens', value: '0', color: 'text-indigo-600 dark:text-indigo-400' },
    ];

    // Performance metrics
    const performanceMetrics = [
        { label: 'Products Total', value: (stats.toolUsage?.product?.total || 0).toLocaleString(), color: 'text-green-600 dark:text-green-400' },
        { label: 'Products (Today)', value: (stats.toolUsage?.product?.day || 0).toLocaleString(), color: 'text-green-500' },
        { label: 'Products (Month)', value: (stats.toolUsage?.product?.month || 0).toLocaleString(), color: 'text-green-500' },
        { label: 'Renewed Users', value: (stats.renewedUsers || 0).toLocaleString(), color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Last Updated', value: new Date(stats.lastUpdated || '').toLocaleString(), color: 'text-gray-600 dark:text-gray-400' },
    ];

    const renderDashboard = () => (
        <>
            {/* Primary Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {primaryStats.map(card => (
                    <StatCard key={card.title} title={card.title} value={card.value} icon={card.icon} className={card.className} subtitle={card.subtitle} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tool Usage Analytics (takes up 2 columns) */}
                <div className="lg:col-span-2">
                    <ProductivityChart stats={stats} />
                </div>

                {/* Tool Metrics */}
                <div>
                    <MetricCard title="Tool Usage Metrics" metrics={toolMetrics} />
                </div>

                {/* AI Cost Analysis */}
                <div>
                    <MetricCard title="AI Cost Analysis" metrics={costMetrics} />
                </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Performance Metrics */}
                <div>
                    <MetricCard title="Performance Metrics" metrics={performanceMetrics} />
                </div>

                {/* Admin Tools */}
                <div>
                    <Card>
                        <h3 className="text-xl font-semibold mb-4">Administrative Tools</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Subscription Renewal Link</label>
                                <input type="text" value={renewalLink} onChange={e => setRenewalLink(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <Button onClick={handleUpdateLink} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white">Update Link</Button>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
                                <div className="space-y-2">
                                    <Button onClick={() => setView('performance')} className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                        Performance Analytics
                                    </Button>
                                    <Button onClick={() => setView('integrations')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        User Management
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Data Management */}
                <div>
                    <Card>
                        <h3 className="text-xl font-semibold mb-4">Data Management</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Statistics</h4>
                                <Button 
                                    onClick={handleRefreshStats} 
                                    disabled={isRefreshing}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-400 flex items-center justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
                                </Button>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium mb-2">Export Data</h4>
                                <div className="space-y-2">
                                    <Button onClick={handleDownloadExpiring} className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Expiring Users
                                    </Button>
                                    <Button 
                                        onClick={handleDownloadAll} 
                                        disabled={isDownloading}
                                        className="w-full bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-400 flex items-center justify-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        {isDownloading ? 'Downloading...' : 'All Data'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );

    const renderView = () => {
        switch (view) {
            case 'performance':
                return (
                    <div>
                        <div className="flex items-center mb-6">
                            <Button
                                onClick={() => setView('dashboard')}
                                className="bg-gray-600 hover:bg-gray-700 text-white mr-4"
                            >
                                ← Back to Dashboard
                            </Button>
                            <h1 className="text-2xl font-bold">Performance Analytics</h1>
                        </div>
                        <PerformanceAnalytics />
                    </div>
                );
            case 'integrations':
                return <IntegrationSettings onBack={() => setView('dashboard')} />;
            default:
                return renderDashboard();
        }
    };

    return (
        <div>
            <Header />
            <main className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-900/50 min-h-[calc(100vh-112px)]">
                {renderView()}
            </main>
        </div>
    );
};

export default AdminDashboard;
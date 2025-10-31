
import React, { useState, useEffect } from 'react';
import * as geminiService from '../../services/geminiService';
import * as api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Child, PlannerRun } from '../../types';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { Loader } from '../shared/Loader';
import { LanguageSelector } from '../shared/LanguageSelector';
import { HistorySection } from '../shared/HistorySection';
import { useError } from '../../context/ErrorContext';

export const ParentingPlanner: React.FC = () => {
    const { user, profile } = useAuth();
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [focusAreas, setFocusAreas] = useState('');
    const [customFocus, setCustomFocus] = useState('');
    const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [language, setLanguage] = useState('English');
    const [result, setResult] = useState<{ daily_plan: { time: string; activity: string; details: string }[]; parenting_tip: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const { showError } = useError();
    const [history, setHistory] = useState<PlannerRun[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Common activity options
    const activityOptions = [
        { id: 'motor_fine', label: 'Fine Motor Skills', description: 'Drawing, writing, cutting, building blocks' },
        { id: 'motor_gross', label: 'Gross Motor Skills', description: 'Running, jumping, climbing, dancing' },
        { id: 'language', label: 'Language Development', description: 'Reading, storytelling, vocabulary building' },
        { id: 'cognitive', label: 'Cognitive Skills', description: 'Puzzles, problem-solving, memory games' },
        { id: 'social', label: 'Social Skills', description: 'Sharing, cooperation, making friends' },
        { id: 'emotional', label: 'Emotional Development', description: 'Expressing feelings, empathy, self-regulation' },
        { id: 'creative', label: 'Creative Arts', description: 'Drawing, painting, music, crafts' },
        { id: 'science', label: 'Science & Discovery', description: 'Experiments, nature exploration, STEM activities' },
        { id: 'math', label: 'Math & Numbers', description: 'Counting, shapes, patterns, basic math' },
        { id: 'outdoor', label: 'Outdoor Activities', description: 'Nature walks, playground, gardening' },
        { id: 'sensory', label: 'Sensory Play', description: 'Texture exploration, sensory bins, messy play' },
        { id: 'independence', label: 'Life Skills', description: 'Self-care, responsibility, independence' }
    ];

    useEffect(() => {
        if (user) {
            console.log('ParentingPlanner useEffect - User found:', user.id);
            api.getChildren(user.id).then(data => {
                setChildren(data);
                if (data.length > 0) {
                    setSelectedChildId(data[0].id!);
                }
            });
            fetchHistory();
        } else {
            console.log('ParentingPlanner useEffect - No user found');
        }
    }, [user]);

    // Update focus areas when activities are selected
    useEffect(() => {
        const combinedFocus = [...selectedActivities, customFocus].filter(Boolean).join(', ');
        setFocusAreas(combinedFocus);
    }, [selectedActivities, customFocus]);
    
    const fetchHistory = () => {
        if (!user) return;
        console.log('Fetching planner history for user:', user.id);
        setHistoryLoading(true);
        api.getPlannerHistory(user.id)
            .then(data => {
                console.log('Fetched planner history:', data);
                console.log('History count:', data?.length || 0);
                if (data && data.length > 0) {
                    console.log('Sample history item:', data[0]);
                }
                setHistory(data);
            })
            .catch(err => {
                console.error("Failed to fetch history:", err);
                showError(err.message || 'Failed to fetch planner history');
            })
            .finally(() => setHistoryLoading(false));
    };

    const handleActivityToggle = (activityId: string) => {
        const activity = activityOptions.find(a => a.id === activityId);
        if (!activity) return;

        setSelectedActivities(prev => {
            if (prev.includes(activity.label)) {
                return prev.filter(a => a !== activity.label);
            } else {
                return [...prev, activity.label];
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile || !selectedChildId) return;

        const selectedChild = children.find(c => c.id === selectedChildId);
        if (!selectedChild) return;

        setLoading(true);
        setResult(null);

        try {
            const planResult = await geminiService.generateParentingPlan(
                { fullName: profile.full_name || 'Parent' },
                selectedChild,
                focusAreas,
                language,
                startTime,
                endTime
            );
            console.log('Generated plan result:', planResult);
            console.log('Plan result structure:', {
                hasDaily: 'daily_plan' in planResult,
                hasTip: 'parenting_tip' in planResult,
                dailyPlanLength: planResult.daily_plan?.length,
                tipLength: planResult.parenting_tip?.length
            });
            setResult(planResult);

            // Create full prompt for storage
            const fullPrompt = `Generate a daily parenting plan for ${selectedChild.name}, age ${selectedChild.age}. Parent: ${profile.full_name || 'Parent'}. Focus areas: ${focusAreas}. ${startTime && endTime ? `Time range: ${startTime} - ${endTime}. ` : ''}Language: ${language}.${customFocus ? ` Additional instructions: ${customFocus}` : ''}`;

            const runData: Omit<PlannerRun, 'id' | 'created_at'> = {
                user_id: user.id,
                requested_routine: focusAreas, // activity area
                parenting_tip_of_the_day: planResult.parenting_tip, // parenting tip
                prompt: fullPrompt, // complete prompt
                result: planResult.daily_plan, // daily schedule only
                start_time: startTime,
                end_time: endTime, // using underscore as requested
                language: language,
                requested_text: customFocus || undefined, // additional focus areas
            };
            console.log('Saving planner run data:', runData);
            console.log('Data validation:', {
                hasUserId: !!runData.user_id,
                hasRoutine: !!runData.requested_routine,
                hasTip: !!runData.parenting_tip_of_the_day,
                hasPrompt: !!runData.prompt,
                hasResult: !!runData.result && Array.isArray(runData.result),
                resultLength: runData.result?.length,
                hasLanguage: !!runData.language
            });
            
            const saveResult = await api.savePlannerRun(runData);
            console.log('Save result:', saveResult);
            fetchHistory(); // Refresh history
        } catch (err: any) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const renderHistoryItem = (item: PlannerRun) => {
        const createdDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date';
        const createdTime = item.created_at ? new Date(item.created_at).toLocaleTimeString() : '';
        const hasTimeRange = item.start_time && item.end_time;
        const firstPlanItem = item.result?.[0];
        
        return (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                {/* Header with basic info */}
                <div className="mb-3">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            Daily Parenting Plan
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {createdDate} {createdTime && `at ${createdTime}`}
                        </span>
                    </div>
                    
                    {/* Time range if available */}
                    {hasTimeRange && (
                        <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                ⏰ {item.start_time} - {item.end_time}
                            </span>
                        </div>
                    )}
                    
                    {/* Activity areas */}
                    <div className="mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Focus Areas:</strong> {item.requested_routine}
                        </span>
                    </div>
                    
                    {/* Language display - always show */}
                    <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            🌐 {item.language}
                        </span>
                    </div>

                    {/* Additional focus areas if available */}
                    {item.requested_text && (
                        <div className="mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Additional Notes:</strong> {item.requested_text}
                            </span>
                        </div>
                    )}
                </div>

                {/* First line preview */}
                {firstPlanItem && (
                    <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-blue-500">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>{firstPlanItem.time} - {firstPlanItem.activity}:</strong> {firstPlanItem.details}
                            {item.result && item.result.length > 1 && (
                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                    (+{item.result.length - 1} more activities)
                                </span>
                            )}
                        </p>
                    </div>
                )}

                {/* Single line parenting tip preview */}
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded border-l-4 border-blue-500">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                        <strong>💡 Tip:</strong> {item.parenting_tip_of_the_day}
                    </p>
                </div>

                {/* Expandable full plan */}
                <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm">
                        View Complete Plan & Tip
                    </summary>
                    <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                        {item.result && Array.isArray(item.result) ? (
                            <>
                                <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-2">📅 Complete Daily Schedule</h5>
                                <div className="space-y-2">
                                    {item.result.map((p, i) => (
                                        <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700 rounded border-l-2 border-blue-300">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {p.time} - {p.activity}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {p.details}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No daily plan available</p>
                        )}
                        
                        {item.parenting_tip_of_the_day ? (
                            <>
                                <h5 className="font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2">💡 Complete Parenting Tip</h5>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded italic text-gray-700 dark:text-gray-300">
                                    {item.parenting_tip_of_the_day}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">No parenting tip available</p>
                        )}
                    </div>
                </details>
            </div>
        );
    };

    const handlePrint = () => {
        if (!result) return;
        
        const selectedChild = children.find(c => c.id === selectedChildId);
        const childName = selectedChild?.name || 'Child';
        
        const printContent = `
            <html>
            <head>
                <title>Daily Parenting Plan - ${childName}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        max-width: 800px; 
                        margin: 0 auto; 
                        padding: 20px;
                        line-height: 1.6;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        border-bottom: 2px solid #e5e7eb;
                        padding-bottom: 20px;
                    }
                    .logo { 
                        max-width: 60px; 
                        height: auto; 
                        margin-bottom: 10px; 
                    }
                    .title { 
                        font-size: 24px; 
                        font-weight: bold; 
                        color: #1f2937; 
                        margin: 10px 0;
                    }
                    .subtitle { 
                        font-size: 18px; 
                        color: #6b7280; 
                        margin: 5px 0;
                    }
                    .date { 
                        font-size: 14px; 
                        color: #9ca3af; 
                    }
                    .section { 
                        margin: 30px 0; 
                    }
                    .section-title { 
                        font-size: 20px; 
                        font-weight: bold; 
                        color: #1f2937; 
                        margin-bottom: 15px;
                        border-left: 4px solid #3b82f6;
                        padding-left: 10px;
                    }
                    .schedule-item { 
                        background-color: #f9fafb; 
                        padding: 15px; 
                        margin: 10px 0; 
                        border-radius: 8px;
                        border-left: 3px solid #3b82f6;
                    }
                    .time { 
                        font-weight: bold; 
                        color: #1f2937; 
                    }
                    .activity { 
                        font-weight: bold; 
                        color: #3b82f6; 
                    }
                    .details { 
                        color: #4b5563; 
                        margin-top: 5px; 
                    }
                    .tip-box { 
                        background-color: #eff6ff; 
                        padding: 20px; 
                        border-radius: 8px;
                        border: 1px solid #dbeafe;
                        font-style: italic;
                    }
                    .footer { 
                        margin-top: 40px; 
                        text-align: center; 
                        font-size: 12px; 
                        color: #9ca3af;
                        border-top: 1px solid #e5e7eb;
                        padding-top: 20px;
                    }
                    @media print {
                        body { margin: 0; padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="https://i.ibb.co/0NDT9kq/Tathyas-Logo.png" alt="Tathyas Logo" class="logo">
                    <div class="title">Daily Parenting Plan</div>
                    <div class="subtitle">For ${childName} (${selectedChild?.age} years old)</div>
                    <div class="date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
                    ${startTime && endTime ? `<div class="date">Time Range: ${startTime} - ${endTime}</div>` : ''}
                    <div class="date">Focus Areas: ${focusAreas}</div>
                </div>
                
                <div class="section">
                    <div class="section-title">📅 Daily Schedule</div>
                    ${result.daily_plan.map(item => `
                        <div class="schedule-item">
                            <div class="time">${item.time}</div>
                            <div class="activity">${item.activity}</div>
                            <div class="details">${item.details}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="section">
                    <div class="section-title">💡 Parenting Tip of the Day</div>
                    <div class="tip-box">
                        ${result.parenting_tip}
                    </div>
                </div>
                
                <div class="footer">
                    Generated by Tathyas AI-Powered Parenting Bonus App<br>
                    Helping parents create meaningful moments with their children
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            
            // Wait for content to load before printing
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card title="Parenting Planner">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="child" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Child
                        </label>
                        <select 
                            id="child" 
                            value={selectedChildId} 
                            onChange={e => setSelectedChildId(e.target.value)} 
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {children.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.age} years old)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Select Activity Areas (choose all that apply)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activityOptions.map((activity) => (
                                <div key={activity.id} className="relative">
                                    <label className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedActivities.includes(activity.label)}
                                            onChange={() => handleActivityToggle(activity.id)}
                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {activity.label}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {activity.description}
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="custom-focus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Additional Focus Areas (Optional)
                        </label>
                        <textarea
                            id="custom-focus"
                            value={customFocus}
                            onChange={e => setCustomFocus(e.target.value)}
                            rows={3}
                            placeholder="Add any specific activities, goals, or areas you'd like to focus on today..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Combined Focus Areas
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {focusAreas || 'Select activities above to see your focus areas'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Planning Time Range
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 text-black dark:text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 text-black dark:text-black"
                                />
                            </div>
                        </div>
                    </div>

                    <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                    
                    <Button 
                        type="submit" 
                        isLoading={loading} 
                        disabled={!selectedChildId || !focusAreas}
                        className="w-full"
                    >
                        Generate Personalized Plan
                    </Button>
                </form>
            </Card>

            {loading && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 shadow-2xl">
                        <Loader 
                            size="lg" 
                            type="spinner"
                            message="📅 Planning your perfect day..."
                        />
                        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                            Creating activities for {children.find(c => c.id === selectedChildId)?.name}
                        </div>
                    </div>
                </div>
            )}
            
            {result && (
                <Card title="Your Daily Plan">
                    <div className="mb-4 flex justify-end">
                        <Button 
                            onClick={handlePrint}
                            variant="secondary"
                            className="flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print / Save as PDF
                        </Button>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Daily Schedule</h3>
                        <ul className="space-y-2">
                            {result.daily_plan.map((item, index) => (
                                <li key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                                    <strong>{item.time} - {item.activity}:</strong> {item.details}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Parenting Tip of the Day</h3>
                        <p className="italic bg-blue-50 dark:bg-blue-900/50 p-3 rounded-md text-gray-900 dark:text-gray-100">{result.parenting_tip}</p>
                    </div>
                </Card>
            )}

            <HistorySection title="Recent Plans" history={history} renderItem={renderHistoryItem} isLoading={historyLoading} />
        </div>
    );
};
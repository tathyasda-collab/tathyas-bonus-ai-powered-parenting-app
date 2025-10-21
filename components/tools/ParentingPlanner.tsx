import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api, ApiError } from '../../services/api';
import { geminiService } from '../../services/geminiService';
import { UserProfile, Child, PlannerRun } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Loader from '../shared/Loader';
import HistorySection from '../shared/HistorySection';
import LanguageSelector from '../shared/LanguageSelector';

const FOCUS_AREAS = ['Cognitive Skills', 'Language Development', 'Motor Skills', 'Social-Emotional Learning', 'Creativity'];

const ParentingPlanner: React.FC = () => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [child, setChild] = useState<Child | null>(null);
    const [history, setHistory] = useState<PlannerRun[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState('English');
    const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
    const [customFocus, setCustomFocus] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');


    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    api.getUserProfile(user.id).then(setUserProfile);
                    api.getChildren(user.id).then(children => children.length > 0 && setChild(children[0]));
                    api.getPlannerHistory(user.id).then(setHistory);
                } catch (err) {
                    if (err instanceof ApiError) {
                        setError(err.userMessage);
                    } else {
                        setError("Failed to load initial data.");
                    }
                }
            };
            fetchData();
        }
    }, [user]);

    const handleFocusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setSelectedFocus(prev => checked ? [...prev, value] : prev.filter(p => p !== value));
    };
    
    const handleGeneratePlan = async () => {
        if (!user || !userProfile || !child) {
            setError("User profile or child details are missing.");
            return;
        }

        const allFocusAreas = [...selectedFocus];
        if (customFocus.trim()) {
            allFocusAreas.push(customFocus.trim());
        }

        if (allFocusAreas.length === 0) {
            setError("Please select at least one focus area or provide a custom one.");
            return;
        }

        setLoading(true);
        setResult(null);
        setError(null);
        
        const childInfo = `Child Name: ${child.baby_name}, DOB: ${child.baby_dob}.`;
        const parentInfo = `Parent Name: ${userProfile.name}, Location Pincode: ${userProfile.pincode}.`;

        const createTimestamp = (timeString: string): string | undefined => {
            if (!timeString) return undefined;
            const today = new Date();
            const [hours, minutes] = timeString.split(':');
            today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            return today.toISOString();
        };

        try {
            const rawResult = await geminiService.generateParentingPlan(childInfo, parentInfo, allFocusAreas, language, startTime, endTime);
            const parsedResult = JSON.parse(rawResult);
            setResult(parsedResult);
            const newRun = await api.savePlannerRun({
                user_id: user.id,
                prompt: { focus: allFocusAreas, time: { start: startTime, end: endTime } },
                result: rawResult,
                start_time: createTimestamp(startTime),
                end_time: createTimestamp(endTime),
            });
            setHistory(prev => [newRun, ...prev]);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.userMessage);
            } else {
                setError("An unexpected error occurred while generating the plan.");
                console.error("Unexpected error in plan generation:", err);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const renderPlan = (data: any) => (
        <div className="space-y-6">
            <div className="space-y-4">
                {data.daily_plan.map((activity: any, index: number) => (
                    <Card key={index} className="bg-gray-50 dark:bg-gray-700">
                        <div className="flex justify-between items-start">
                             <h4 className="font-bold text-lg text-green-700 dark:text-green-400">{activity.activity_name}</h4>
                             {activity.start_time && activity.end_time && (
                                <span className="text-sm font-semibold bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full whitespace-nowrap">
                                    {activity.start_time} - {activity.end_time}
                                </span>
                             )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-2"><strong>Skill Targeted:</strong> {activity.skill_targeted}</p>
                        <p className="mb-2">{activity.description}</p>
                        <p><strong>Materials:</strong> {activity.materials}</p>
                    </Card>
                ))}
            </div>
             <Card className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700">
                <h4 className="font-bold text-lg text-purple-800 dark:text-purple-300">💡 Parenting Tip of the Day</h4>
                <p className="mt-2">{data.parenting_tip}</p>
            </Card>
        </div>
    );
    
    const renderHistoryItem = (item: PlannerRun) => {
        let title = "Archived Plan";
        let content: React.ReactNode = <p className="text-gray-500">Could not display this history item. The data may be in an old format.</p>;

        try {
            // Safely create the title
            if (item.prompt && typeof item.prompt === 'object' && Array.isArray(item.prompt.focus)) {
                const focusAreas = item.prompt.focus.join(', ');
                if (focusAreas) {
                    title = `Plan: ${focusAreas}`;
                }
            }

            // Safely parse and deeply validate the content
            const data = JSON.parse(item.result);
            
            const isValidPlan = data && 
                typeof data === 'object' && 
                typeof data.parenting_tip === 'string' &&
                Array.isArray(data.daily_plan) &&
                data.daily_plan.every((act: any) => 
                    act && typeof act === 'object' &&
                    typeof act.activity_name === 'string' &&
                    typeof act.skill_targeted === 'string' &&
                    typeof act.description === 'string' &&
                    typeof act.materials === 'string'
                );

            if (isValidPlan) {
                content = renderPlan(data);
            }
        } catch (e) {
            console.error("Failed to render planner history item:", e, item);
            // If result is a plain string and not JSON, render it directly.
            if (typeof item.result === 'string' && !item.result.trim().startsWith('{')) {
                content = <p className="whitespace-pre-wrap">{item.result}</p>;
            }
        }

        return { title, content };
    };


    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <div className="no-print">
                    <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">Personalized Parenting Planner</h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                        Get a daily plan of engaging activities to support your child's growth and development.
                    </p>

                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Select focus areas for today:</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {FOCUS_AREAS.map(area => (
                                <label key={area} className="flex items-center space-x-2">
                                    <input type="checkbox" value={area} onChange={handleFocusChange} />
                                    <span>{area}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="custom-focus" className="font-semibold mb-2 block">Or add a custom focus area:</label>
                        <input
                            id="custom-focus"
                            type="text"
                            value={customFocus}
                            onChange={(e) => setCustomFocus(e.target.value)}
                            placeholder="e.g., Potty Training, Learning to Share"
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="start-time" className="font-semibold mb-2 block">Start Time (optional):</label>
                            <input
                                id="start-time"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label htmlFor="end-time" className="font-semibold mb-2 block">End Time (optional):</label>
                            <input
                                id="end-time"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>


                    <div className="flex justify-between items-center mb-6">
                        <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                        <Button onClick={handleGeneratePlan} disabled={loading} className="bg-green-600 text-white">
                            {loading ? 'Generating Plan...' : 'Generate Plan'}
                        </Button>
                    </div>
                </div>
                
                {error && <p className="text-red-500 text-center my-4 no-print">{error}</p>}
                {loading && <Loader />}
                
                {result && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-xl font-semibold">Your Personalized Plan for Today</h3>
                           <Button onClick={() => window.print()} className="bg-gray-600 text-white no-print">Print / Save as PDF</Button>
                        </div>
                        <div className="printable-content">
                            {renderPlan(result)}
                        </div>
                    </div>
                )}
            </Card>

            <div className="no-print">
                <HistorySection<PlannerRun>
                    title="Planner History"
                    history={history}
                    renderItem={renderHistoryItem}
                />
            </div>
        </div>
    );
};

export default ParentingPlanner;
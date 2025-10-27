
import React, { useState, useEffect } from 'react';
import * as geminiService from '../../services/geminiService';
import * as api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { EmotionLog } from '../../types';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { Loader } from '../shared/Loader';
import { LanguageSelector } from '../shared/LanguageSelector';
import { HistorySection } from '../shared/HistorySection';
import { useError } from '../../context/ErrorContext';

const moods = ["Overwhelmed", "Tired", "Happy", "Frustrated", "Grateful", "Anxious"];

export const EmotionCheckin: React.FC = () => {
    const { user } = useAuth();
    const [selectedMood, setSelectedMood] = useState('Overwhelmed');
    const [note, setNote] = useState('');
    const [language, setLanguage] = useState('English');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { showError } = useError();
    const [history, setHistory] = useState<EmotionLog[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        if (user) {
            fetchHistory();
            // Fetch user profile to get their name
            api.getUserProfile(user.id).then(setUserProfile);
        }
    }, [user]);

    const fetchHistory = () => {
        if (!user) return;
        setHistoryLoading(true);
        api.getEmotionLogHistory(user.id)
            .then(setHistory)
            .finally(() => setHistoryLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setResult(null);

        try {
            // Get user's first name from profile
            const userName = userProfile?.full_name?.split(' ')[0] || userProfile?.baby_name || 'dear parent';
            
            const supportMessage = await geminiService.getEmotionSupport(selectedMood, note, language, userName);
            setResult(supportMessage);

            const logData: Omit<EmotionLog, 'id' | 'created_at'> = {
                user_id: user.id,
                mood: selectedMood,
                prompt: note, // Changed from note to prompt to match database
                result: supportMessage, // Changed from response to result to match database
            };
            await api.saveEmotionLog(logData);
            fetchHistory();
        } catch (err: any) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const renderHistoryItem = (item: EmotionLog) => (
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Checked in as: <strong>{item.mood}</strong>
        </p>
        <p className="mt-2 italic bg-gray-100 dark:bg-gray-600 p-2 rounded text-gray-900 dark:text-gray-100">"{item.result}"</p>
      </div>
    );

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card title="How are you feeling today? 💝" variant="warm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-3 text-white/90">Select a feeling</label>
                        <div className="flex flex-wrap gap-3">
                            {moods.map(mood => (
                                <button
                                    key={mood}
                                    type="button"
                                    onClick={() => setSelectedMood(mood)}
                                    className={`px-4 py-2 text-sm rounded-full transition-all duration-300 transform hover:scale-105 ${
                                        selectedMood === mood 
                                            ? 'bg-white text-pink-600 shadow-lg scale-105' 
                                            : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                                    }`}
                                >
                                    {mood}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="note" className="block text-sm font-medium text-white/90">Add a note (optional)</label>
                        <textarea
                            id="note"
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Share a little more about what's on your mind..."
                            className="mt-1 block w-full rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-transparent"
                        />
                    </div>
                    <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                    <Button type="submit" isLoading={loading} variant="cool" size="lg">
                        💙 Get Support
                    </Button>
                </form>
            </Card>

            {loading && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 shadow-2xl">
                        <Loader 
                            size="lg" 
                            type="bounce"
                            message="💙 Creating your supportive message..."
                        />
                        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                            Generating personalized encouragement
                        </div>
                    </div>
                </div>
            )}

            {result && (
                <Card title="A Moment For You ✨" variant="cool">
                    <div className="mb-4 flex justify-end">
                        <Button onClick={handlePrint} variant="secondary">
                            🖨️ Print/PDF
                        </Button>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                Your Feeling: {selectedMood}
                            </h3>
                            {note && (
                                <div className="mb-3">
                                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Your Note:</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-white dark:bg-gray-800 p-2 rounded">
                                        "{note}"
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                Supportive Message:
                            </h3>
                            <p className="text-lg italic text-green-700 dark:text-green-300">
                                "{result}"
                            </p>
                        </div>
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                            Check-in completed on {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </Card>
            )}

            <HistorySection title="Recent Check-ins" history={history} renderItem={renderHistoryItem} isLoading={historyLoading} />
        </div>
    );
};
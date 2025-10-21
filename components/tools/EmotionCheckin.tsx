import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api, ApiError } from '../../services/api';
import { geminiService } from '../../services/geminiService';
import { EmotionLog, UserProfile } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Loader from '../shared/Loader';
import HistorySection from '../shared/HistorySection';
import LanguageSelector from '../shared/LanguageSelector';

const EMOTIONS = ['Happy', 'Stressed', 'Tired', 'Anxious', 'Overwhelmed', 'Grateful', 'Sad', 'Hopeful'];

const EmotionCheckin: React.FC = () => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<EmotionLog[]>([]);
    const [language, setLanguage] = useState('English');

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    api.getEmotionLogHistory(user.id).then(setHistory);
                    api.getUserProfile(user.id).then(setUserProfile);
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

    const handleSubmit = async () => {
        if (!user || !selectedEmotion || !userProfile) {
            setError("Please select how you're feeling and ensure your profile is loaded.");
            return;
        }

        setLoading(true);
        setAiResponse('');
        setError(null);

        try {
            const response = await geminiService.getEmotionSupport(selectedEmotion, note, userProfile.name, language);
            setAiResponse(response);
            const newLog = await api.saveEmotionLog({
                user_id: user.id,
                mood: selectedEmotion,
                prompt: { note },
                result: response,
            });
            setHistory(prev => [newLog, ...prev]);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.userMessage);
            } else {
                setError("An unexpected error occurred. Please try again later.");
                console.error("Unexpected error during emotion check-in:", err);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const resetForm = () => {
        setSelectedEmotion(null);
        setNote('');
        setAiResponse('');
        setError(null);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                {!aiResponse ? (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">How are you feeling today?</h2>
                        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                            Take a moment to check in with yourself. Your feelings are valid.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            {EMOTIONS.map(emotion => (
                                <Button
                                    key={emotion}
                                    onClick={() => setSelectedEmotion(emotion)}
                                    className={`p-4 text-center border-2 rounded-lg transition-all ${
                                        selectedEmotion === emotion
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-transparent border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {emotion}
                                </Button>
                            ))}
                        </div>
                        <div className="mb-4">
                            <label htmlFor="note" className="block font-semibold mb-2">Want to add a note? (Optional)</label>
                            <textarea
                                id="note"
                                rows={3}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                            <Button onClick={handleSubmit} disabled={loading || !selectedEmotion || !userProfile} className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400">
                                {loading ? 'Getting Support...' : 'Get a Moment of Support'}
                            </Button>
                        </div>
                        {error && <p className="text-red-500 text-center my-4">{error}</p>}
                    </>
                ) : (
                    <div>
                         <h3 className="text-xl font-semibold mb-4 text-center">A Message For You</h3>
                         <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 prose dark:prose-invert max-w-none whitespace-pre-wrap">
                            {aiResponse}
                         </div>
                         <div className="text-center mt-6">
                            <Button onClick={resetForm} className="bg-gray-500 hover:bg-gray-600 text-white">
                                Check In Again
                            </Button>
                         </div>
                    </div>
                )}
            </Card>

            {/* Fix: Explicitly provide the generic type to HistorySection to ensure correct type inference for 'item'. */}
            <HistorySection<EmotionLog>
                title="Your Check-in History"
                history={history}
                renderItem={(item) => ({
                    title: `Checked in as "${item.mood}"`,
                    content: (
                        <div>
                            <p className="font-semibold">Your note:</p>
                            <p className="mb-2 italic">{item.prompt?.note || 'No note added.'}</p>
                            <p className="font-semibold mt-4">Support message:</p>
                            <p>{item.result}</p>
                        </div>
                    )
                })}
            />
        </div>
    );
};

export default EmotionCheckin;
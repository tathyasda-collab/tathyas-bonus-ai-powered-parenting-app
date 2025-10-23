import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api, ApiError } from '../../services/api';
import { geminiService } from '../../services/geminiService';
import { UserProfile, Child, MealPlanRun } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Loader from '../shared/Loader';
import HistorySection from '../shared/HistorySection';
import LanguageSelector from '../shared/LanguageSelector';
import { DIETARY_PREFERENCES } from '../../constants';

type ToolMode = 'plan' | 'recipe';

const MealAssistant: React.FC = () => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [child, setChild] = useState<Child | null>(null);
    const [history, setHistory] = useState<MealPlanRun[]>([]);
    
    const [mode, setMode] = useState<ToolMode>('plan');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState('English');

    // Meal Plan State
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
    const [customPreference, setCustomPreference] = useState('');
    const [mealPlanResult, setMealPlanResult] = useState<any>(null);

    // Single Recipe State
    const [dishName, setDishName] = useState('');
    const [recipeResult, setRecipeResult] = useState<any>(null);

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    api.getUserProfile(user.id).then(setUserProfile);
                    api.getChildren(user.id).then(children => children.length > 0 && setChild(children[0]));
                    api.getMealPlanHistory(user.id).then(setHistory);
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

    const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setSelectedPreferences(prev => checked ? [...prev, value] : prev.filter(p => p !== value));
    };

    const handleGenerateMealPlan = async () => {
        if (!user || !userProfile || !child) {
            setError("User profile or child details are missing.");
            return;
        }

        const allPreferences = [...selectedPreferences];
        if (customPreference.trim()) {
            allPreferences.push(customPreference.trim());
        }

        if (allPreferences.length === 0) {
            setError("Please select at least one dietary preference or provide a custom one.");
            return;
        }

        setLoading(true);
        setMealPlanResult(null);
        setError(null);

        const childInfo = `Child Name: ${child.baby_name}, DOB: ${child.baby_dob}.`;
        
        try {
            const rawResult = await geminiService.generateMealPlan(childInfo, allPreferences.join(', '), userProfile.pincode, language);
            const parsedResult = JSON.parse(rawResult);
            setMealPlanResult(parsedResult);
            const newRun = await api.saveMealPlanRun({
                user_id: user.id,
                prompt: { preferences: allPreferences.join(', ') },
                result: rawResult,
            });
            setHistory(prev => [newRun, ...prev]);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.userMessage);
            } else {
                setError("An unexpected error occurred while generating the meal plan.");
                console.error("Unexpected error in meal plan generation:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRecipe = async () => {
        if (!dishName.trim()) {
            setError("Please enter a dish name.");
            return;
        }

        setLoading(true);
        setRecipeResult(null);
        setError(null);

        try {
            const rawResult = await geminiService.generateSingleRecipe(dishName, language);
            const parsedResult = JSON.parse(rawResult);
            setRecipeResult(parsedResult);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.userMessage);
            } else {
                setError("An unexpected error occurred while generating the recipe.");
                console.error("Unexpected error in recipe generation:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const renderShoppingList = (list: string[]) => {
        if (!list || list.length === 0) return null;
        const query = encodeURIComponent(list.join(', '));
        return (
            <div>
                <h4 className="font-bold text-lg mb-2">Shopping List</h4>
                <ul className="list-disc list-inside grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {list.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
                <div className="flex flex-wrap gap-2 no-print">
                    <a href={`https://blinkit.com/s/?q=${query}`} target="_blank" rel="noopener noreferrer"><Button className="bg-yellow-500 text-white text-sm">Buy on Blinkit</Button></a>
                    <a href={`https://www.zeptonow.com/search?q=${query}`} target="_blank" rel="noopener noreferrer"><Button className="bg-purple-500 text-white text-sm">Buy on Zepto</Button></a>
                    <a href={`https://www.flipkart.com/grocery/search?q=${query}`} target="_blank" rel="noopener noreferrer"><Button className="bg-blue-500 text-white text-sm">Buy on Flipkart</Button></a>
                    <a href={`https://www.amazon.in/s?k=${query}&i=grocery`} target="_blank" rel="noopener noreferrer"><Button className="bg-gray-800 text-white text-sm">Buy on Amazon</Button></a>
                </div>
            </div>
        );
    };

    const renderMealPlanResult = (data: any) => (
        <div className="space-y-6 printable-content" id="meal-plan-result">
            <div>
                <h4 className="font-bold text-lg mb-2">Daily Meal Plan</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                                <th className="p-2 border dark:border-gray-600">Meal Time</th>
                                <th className="p-2 border dark:border-gray-600">Mother's Meal</th>
                                <th className="p-2 border dark:border-gray-600">Child's Meal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.meal_plan.map((meal: any, index: number) => (
                                <tr key={index} className="border-b dark:border-gray-600">
                                    <td className="p-2 border dark:border-gray-600 font-semibold">{meal.meal_time}</td>
                                    <td className="p-2 border dark:border-gray-600">{meal.mother_meal}</td>
                                    <td className="p-2 border dark:border-gray-600">{meal.child_meal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {renderShoppingList(data.shopping_list)}
        </div>
    );

    const renderRecipeResult = (data: any) => (
        <div className="space-y-6 printable-content" id="recipe-result">
            <h3 className="text-xl font-bold text-center">{data.dish_name}</h3>
            <div>
                <h4 className="font-bold text-lg mb-2">Ingredients</h4>
                <ul className="list-disc list-inside">
                    {data.ingredients.map((ing: { quantity: string, name: string }, index: number) => (
                        <li key={index}><strong>{ing.quantity}</strong> {ing.name}</li>
                    ))}
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-lg mb-2">Instructions</h4>
                <ol className="list-decimal list-inside space-y-2">
                    {data.instructions.map((step: string, index: number) => (
                        <li key={index}>{step}</li>
                    ))}
                </ol>
            </div>
            {renderShoppingList(data.shopping_list)}
        </div>
    );
    
    const renderHistoryItem = (item: MealPlanRun) => {
        let title = "Archived Meal Plan";
        let content: React.ReactNode = <p className="text-gray-500">Could not display this history item. The data may be in an old format.</p>;

        try {
            // Safely create the title from prompt
            if (item.prompt && typeof item.prompt === 'object' && (item.prompt as any).preferences) {
                title = `Plan for: ${(item.prompt as any).preferences}`;
            } else if (typeof (item.prompt as any) === 'string') {
                title = `Plan for: ${item.prompt}`;
            }

            const data = JSON.parse(item.result);

            // Deeply validate meal plan structure
            const isValidMealPlan = data &&
                typeof data === 'object' &&
                Array.isArray(data.meal_plan) &&
                data.meal_plan.every((meal: any) => 
                    meal && typeof meal === 'object' &&
                    typeof meal.meal_time === 'string' &&
                    typeof meal.mother_meal === 'string' &&
                    typeof meal.child_meal === 'string'
                ) &&
                (!data.shopping_list || (Array.isArray(data.shopping_list) && data.shopping_list.every((i: any) => typeof i === 'string')));

            // Deeply validate recipe structure
            const isValidRecipe = data &&
                typeof data === 'object' &&
                typeof data.dish_name === 'string' &&
                Array.isArray(data.instructions) && data.instructions.every((step: any) => typeof step === 'string') &&
                Array.isArray(data.ingredients) && data.ingredients.every((ing: any) => 
                    ing && typeof ing === 'object' &&
                    typeof ing.quantity === 'string' &&
                    typeof ing.name === 'string'
                ) &&
                (!data.shopping_list || (Array.isArray(data.shopping_list) && data.shopping_list.every((i: any) => typeof i === 'string')));

            if (isValidMealPlan) {
                content = renderMealPlanResult(data);
            } else if (isValidRecipe) {
                content = renderRecipeResult(data);
                title = `Recipe: ${data.dish_name}`;
            }

        } catch (e) {
            console.error("Failed to render meal plan history item:", e, item);
            if (typeof item.result === 'string') {
                content = <pre className="whitespace-pre-wrap">{item.result}</pre>;
            }
        }

        return { title, content };
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <div className="no-print">
                    <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">Meal Assistant</h2>
                    <div className="flex justify-center border-b dark:border-gray-600 mb-6">
                        <button onClick={() => setMode('plan')} className={`px-4 py-2 font-semibold ${mode === 'plan' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}>
                            Meal Plan Generator
                        </button>
                        <button onClick={() => setMode('recipe')} className={`px-4 py-2 font-semibold ${mode === 'recipe' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}>
                            Recipe Finder
                        </button>
                    </div>

                    {mode === 'plan' ? (
                        <div>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                                Select dietary preferences to create a daily meal plan for you and your child.
                            </p>
                            <div className="mb-6">
                                <h3 className="font-semibold mb-2">Dietary Preferences:</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {DIETARY_PREFERENCES.map(pref => (
                                        <label key={pref} className="flex items-center space-x-2">
                                            <input type="checkbox" value={pref} onChange={handlePreferenceChange} />
                                            <span>{pref}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-6">
                                <label htmlFor="custom-pref" className="font-semibold mb-2 block">Other preferences or allergies:</label>
                                <input
                                    id="custom-pref"
                                    type="text"
                                    value={customPreference}
                                    onChange={(e) => setCustomPreference(e.target.value)}
                                    placeholder="e.g., No spicy food, more fruits"
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="flex justify-between items-center mb-6">
                                <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                                <Button onClick={handleGenerateMealPlan} disabled={loading} className="bg-green-600 text-white">
                                    {loading ? 'Generating...' : 'Generate Meal Plan'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                                Enter the name of a dish to get its recipe.
                            </p>
                            <div className="mb-6">
                                <label htmlFor="dish-name" className="font-semibold mb-2 block">Dish Name:</label>
                                <input
                                    id="dish-name"
                                    type="text"
                                    value={dishName}
                                    onChange={(e) => setDishName(e.target.value)}
                                    placeholder="e.g., Palak Paneer"
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="flex justify-between items-center mb-6">
                                <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                                <Button onClick={handleGenerateRecipe} disabled={loading} className="bg-green-600 text-white">
                                    {loading ? 'Finding Recipe...' : 'Find Recipe'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {loading && <Loader />}
                {error && <p className="text-red-500 text-center my-4 no-print">{error}</p>}
                
                {mode === 'plan' && mealPlanResult && (
                     <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Your Personalized Meal Plan</h3>
                            <Button onClick={() => window.print()} className="bg-gray-600 text-white no-print">Print / Save as PDF</Button>
                        </div>
                        {renderMealPlanResult(mealPlanResult)}
                    </div>
                )}
                
                {mode === 'recipe' && recipeResult && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Recipe Details</h3>
                             <Button onClick={() => window.print()} className="bg-gray-600 text-white no-print">Print / Save as PDF</Button>
                        </div>
                        {renderRecipeResult(recipeResult)}
                    </div>
                )}
            </Card>
            
             <HistorySection<MealPlanRun>
                title="Meal Plan History"
                history={history}
                renderItem={renderHistoryItem}
            />
        </div>
    );
};

export default MealAssistant;
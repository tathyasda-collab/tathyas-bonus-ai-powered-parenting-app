import React, { useState, useEffect } from 'react';
import * as geminiService from '../../services/geminiService';
import * as api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Child, MealPlanRun, SingleRecipeRun } from '../../types';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { Loader } from '../shared/Loader';
import { LanguageSelector } from '../shared/LanguageSelector';
import { HistorySection } from '../shared/HistorySection';
import { DIETARY_PREFERENCES } from '../../constants';
import { useError } from '../../context/ErrorContext';

type AssistantMode = 'plan' | 'recipe';

export const MealAssistant: React.FC = () => {
    const { user, profile } = useAuth();
    const [mode, setMode] = useState<AssistantMode>('plan');
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
    const [additionalInstructions, setAdditionalInstructions] = useState('');
    const [dishName, setDishName] = useState('');
    const [language, setLanguage] = useState('English');
    const [result, setResult] = useState<MealPlanRun['result'] | SingleRecipeRun['result'] | null>(null);
    const [loading, setLoading] = useState(false);
    const { showError } = useError();
    const [history, setHistory] = useState<(MealPlanRun | SingleRecipeRun)[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [fullProfile, setFullProfile] = useState<any>(null);
    const [femaleAge, setFemaleAge] = useState<number>(30);

    useEffect(() => {
        if (user) {
            api.getChildren(user.id).then(data => {
                setChildren(data);
                if (data.length > 0) setSelectedChildId(data[0].id!);
            });
            // Fetch complete user profile for mother's age
            api.getUserProfile(user.id).then(setFullProfile);
            // Get the age of the female user (either user or spouse)
            api.getFemaleUserAge(user.id).then(setFemaleAge);
            fetchHistory();
        }
    }, [user]);

    useEffect(() => {
        // Clear result when switching from Single Recipe to Daily Plan
        if (mode === 'plan') {
            setResult(null);
        }
    }, [mode]);

    const fetchHistory = async () => {
        if (!user) return;
        
        setHistoryLoading(true);
        try {
            const [mealPlans, singleRecipes] = await Promise.all([
                api.getMealPlanRuns(user.id),
                api.getSingleRecipeRuns(user.id)
            ]);
            
            // Combine and sort by date
            const combined = [...mealPlans, ...singleRecipes]
                .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                .slice(0, 10); // Show last 10 items
                
            setHistory(combined);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleDietaryPrefChange = (pref: string) => {
        setDietaryPrefs(prev => 
            prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            if (mode === 'plan') {
                if (!selectedChildId) {
                    showError('Please select a child');
                    return;
                }
                
                const selectedChild = children.find(c => c.id === selectedChildId);
                if (!selectedChild) {
                    showError('Selected child not found');
                    return;
                }

                const prompt = {
                    childName: selectedChild.name,
                    childAge: selectedChild.age,
                    motherAge: femaleAge, // Use the female user's age instead of default
                    dietaryPreferences: dietaryPrefs,
                    additionalInstructions,
                    language
                };

                const mealPlan = await geminiService.generateMealPlan(
                    { name: selectedChild.name, age: selectedChild.age },
                    dietaryPrefs,
                    language,
                    femaleAge, // Use the female user's age
                    additionalInstructions
                );
                setResult(mealPlan);

                // Save to database
                await api.saveMealPlanRun({
                    user_id: user.id,
                    prompt,
                    result: mealPlan
                });

                // Refresh history
                fetchHistory();
            } else {
                if (!dishName.trim()) {
                    showError('Please enter a dish name');
                    return;
                }

                const prompt = { dishName, language };
                const recipe = await geminiService.generateSingleRecipe(dishName, language);
                setResult(recipe);

                // Save to database
                await api.saveSingleRecipeRun({
                    user_id: user.id,
                    prompt,
                    result: recipe
                });

                // Refresh history
                fetchHistory();
            }
        } catch (error) {
            console.error('Error generating result:', error);
            showError('Failed to generate result. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderHistoryItem = (item: MealPlanRun | SingleRecipeRun) => {
        const isRecipe = 'dish_name' in item.result;
        const date = new Date(item.created_at || '').toLocaleDateString();
        
        if (isRecipe) {
            return (
                <button
                    onClick={() => setResult(item.result)}
                    className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                    <div className="font-medium text-blue-600 dark:text-blue-400">
                        Single Recipe: {(item.result as SingleRecipeRun['result']).dish_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{date}</div>
                </button>
            );
        } else {
            return (
                <button
                    onClick={() => setResult(item.result)}
                    className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                    <div className="font-medium text-green-600 dark:text-green-400">
                        Daily Plan for {'childName' in item.prompt ? item.prompt.childName : 'Child'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{date}</div>
                </button>
            );
        }
    };

    const renderResult = () => {
        if (!result) return null;
        
        // Check if it's a new 1-day Baby/Mother format
        if ('breakfast' in result && 'lunch' in result && 'dinner' in result && 'snack' in result) {
            const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
            
            // Use the shopping_list from API response if available, otherwise build from individual ingredients
            let consolidatedIngredients: string[] = [];
            
            if ('shopping_list' in result && Array.isArray(result.shopping_list) && result.shopping_list.length > 0) {
                // Use the API-provided shopping list
                consolidatedIngredients = result.shopping_list.sort();
            } else {
                // Fallback: extract ingredients manually
                const allIngredients: string[] = [];
                
                mealTypes.forEach(mealType => {
                    const meal = result[mealType];
                    if (meal?.baby?.ingredients) {
                        allIngredients.push(...meal.baby.ingredients);
                    }
                    if (meal?.mother?.ingredients) {
                        allIngredients.push(...meal.mother.ingredients);
                    }
                });
                
                // Remove duplicates and sort
                consolidatedIngredients = [...new Set(allIngredients)].sort();
            }
            
            return (
                <Card title="Today's Meal Plan - Baby & Mother" variant="glass">
                    <div className="mb-4 flex justify-end">
                        <Button onClick={handlePrint} variant="secondary">
                            🖨️ Print/PDF
                        </Button>
                    </div>
                    <div className="space-y-6">
                        {/* Meal Plans by Time - Show First */}
                        <div className="space-y-6">
                            {mealTypes.map(mealType => {
                                const meal = result[mealType];
                                if (!meal) return null;
                                
                                return (
                                    <div key={mealType} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                                        <h3 className="text-xl font-semibold capitalize mb-4 text-gray-800 dark:text-gray-200">
                                            {mealType}
                                        </h3>
                                        
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Baby Column */}
                                            <div className="border rounded-lg p-4 bg-pink-50 dark:bg-pink-900/20">
                                                <h4 className="text-lg font-semibold mb-3 text-pink-800 dark:text-pink-200 flex items-center">
                                                    👶 Baby
                                                </h4>
                                                {meal.baby && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h5 className="font-medium text-pink-700 dark:text-pink-300">
                                                                {meal.baby.name}
                                                            </h5>
                                                        </div>
                                                        
                                                        {/* Recipe First */}
                                                        {meal.baby.recipe && (
                                                            <div>
                                                                <h6 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Recipe:</h6>
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-2 rounded">
                                                                    {typeof meal.baby.recipe === 'string' ? meal.baby.recipe : JSON.stringify(meal.baby.recipe, null, 2)}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Then Ingredients */}
                                                        {meal.baby.ingredients && meal.baby.ingredients.length > 0 && (
                                                            <div>
                                                                <h6 className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">Ingredients:</h6>
                                                                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                                                    {meal.baby.ingredients.map((ingredient: string, idx: number) => (
                                                                        <li key={idx}>{ingredient}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        
                                                        {meal.baby.instructions && (
                                                            <div>
                                                                <h6 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Instructions:</h6>
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-2 rounded">
                                                                    {typeof meal.baby.instructions === 'string' ? meal.baby.instructions : JSON.stringify(meal.baby.instructions, null, 2)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Mother Column */}
                                            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                                                <h4 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200 flex items-center">
                                                    👩 Mother
                                                </h4>
                                                {meal.mother && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h5 className="font-medium text-blue-700 dark:text-blue-300">
                                                                {meal.mother.name}
                                                            </h5>
                                                        </div>
                                                        
                                                        {/* Recipe First */}
                                                        {meal.mother.recipe && (
                                                            <div>
                                                                <h6 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Recipe:</h6>
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-2 rounded">
                                                                    {typeof meal.mother.recipe === 'string' ? meal.mother.recipe : JSON.stringify(meal.mother.recipe, null, 2)}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Then Ingredients */}
                                                        {meal.mother.ingredients && meal.mother.ingredients.length > 0 && (
                                                            <div>
                                                                <h6 className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">Ingredients:</h6>
                                                                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                                                    {meal.mother.ingredients.map((ingredient: string, idx: number) => (
                                                                        <li key={idx}>{ingredient}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        
                                                        {meal.mother.instructions && (
                                                            <div>
                                                                <h6 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Instructions:</h6>
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-2 rounded">
                                                                    {typeof meal.mother.instructions === 'string' ? meal.mother.instructions : JSON.stringify(meal.mother.instructions, null, 2)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Shopping List - Show After Meal Plans */}
                        {consolidatedIngredients.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">
                                    Shopping List - All Ingredients for Today
                                </h3>
                                
                                {/* Buy All Buttons */}
                                <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <a 
                                        href={`https://blinkit.com/s/?q=${consolidatedIngredients.map(i => encodeURIComponent(i)).join('+')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                                    >
                                        🛒 Buy All on BlinkIt
                                    </a>
                                    <a 
                                        href={`https://www.zepto.com/search?query=${consolidatedIngredients.map(i => encodeURIComponent(i)).join('+')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                                    >
                                        🛒 Buy All on Zepto
                                    </a>
                                    <a 
                                        href={`https://www.flipkart.com/search?q=${consolidatedIngredients.map(i => encodeURIComponent(i)).join('+')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                                    >
                                        🛒 Buy All on Flipkart Minutes
                                    </a>
                                    <a 
                                        href={`https://www.amazon.in/s?k=${consolidatedIngredients.map(i => encodeURIComponent(i)).join('+')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                                    >
                                        🛒 Buy All on Amazon Fresh
                                    </a>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-blue-200 dark:border-blue-700">
                                                <th className="text-left py-2 px-2 text-blue-800 dark:text-blue-200">Ingredient</th>
                                                <th className="text-center py-2 px-2 text-blue-800 dark:text-blue-200">BlinkIt</th>
                                                <th className="text-center py-2 px-2 text-blue-800 dark:text-blue-200">Zepto</th>
                                                <th className="text-center py-2 px-2 text-blue-800 dark:text-blue-200">Flipkart Minutes</th>
                                                <th className="text-center py-2 px-2 text-blue-800 dark:text-blue-200">Amazon Fresh</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consolidatedIngredients.map((ingredient, index) => {
                                                const encodedIngredient = encodeURIComponent(ingredient);
                                                return (
                                                    <tr key={index} className="border-b border-blue-100 dark:border-blue-800">
                                                        <td className="py-2 px-2 font-medium text-blue-900 dark:text-blue-100">{ingredient}</td>
                                                        <td className="py-2 px-2 text-center">
                                                            <a 
                                                                href={`https://blinkit.com/s/?q=${encodedIngredient}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium inline-block"
                                                            >
                                                                Buy on BlinkIt
                                                            </a>
                                                        </td>
                                                        <td className="py-2 px-2 text-center">
                                                            <a 
                                                                href={`https://www.zepto.com/search?query=${encodedIngredient}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-medium inline-block"
                                                            >
                                                                Buy on Zepto
                                                            </a>
                                                        </td>
                                                        <td className="py-2 px-2 text-center">
                                                            <a 
                                                                href={`https://www.flipkart.com/search?q=${encodedIngredient}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium inline-block"
                                                            >
                                                                Buy on Flipkart Minutes
                                                            </a>
                                                        </td>
                                                        <td className="py-2 px-2 text-center">
                                                            <a 
                                                                href={`https://www.amazon.in/s?k=${encodedIngredient}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs font-medium inline-block"
                                                            >
                                                                Buy on Amazon Fresh
                                                            </a>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            );
        }
        
        // Legacy format handling for old meal plans
        if ('meal_plan' in result && Array.isArray(result.meal_plan) && result.meal_plan.length > 0) {
            const firstDay = result.meal_plan[0];
            const hasEnhancedFormat = firstDay && typeof firstDay.breakfast === 'object' && 'ingredients' in firstDay.breakfast;
            
            if (hasEnhancedFormat) {
                return (
                    <Card title="Legacy 7-Day Meal Plan">
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                This is a legacy 7-day meal plan. New plans will show 1-day format with Baby & Mother sections.
                            </p>
                        </div>
                    </Card>
                );
            }
        }
        
        if ('instructions' in result) { // SingleRecipeRun result
            // Helper function to render ingredients (supports both old and new format)
            const renderIngredients = () => {
                if (Array.isArray(result.ingredients) && result.ingredients.length > 0) {
                    if (typeof result.ingredients[0] === 'string') {
                        // Old format: string array
                        return result.ingredients.map((item, i) => (
                            <li key={i} className="text-gray-700 dark:text-gray-300">{item}</li>
                        ));
                    } else {
                        // New format: object array
                        return result.ingredients.map((item, i) => (
                            <li key={i} className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">{item.item}</span>
                                {item.notes && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({item.notes})</span>}
                            </li>
                        ));
                    }
                }
                return null;
            };

            // Helper function to render instructions (supports both old and new format)
            const renderInstructions = () => {
                if (Array.isArray(result.instructions) && result.instructions.length > 0) {
                    if (typeof result.instructions[0] === 'string') {
                        // Old format: string array
                        return result.instructions.map((step, i) => (
                            <li key={i} className="mb-3 text-gray-700 dark:text-gray-300">{step}</li>
                        ));
                    } else {
                        // New format: object array
                        return result.instructions.map((step, i) => (
                            <li key={i} className="mb-4 text-gray-700 dark:text-gray-300">
                                <div className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        {step.step}
                                    </span>
                                    <div className="flex-1">
                                        {step.title && <h4 className="font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100">{step.title}</h4>}
                                        <p className="mb-2">{step.instruction}</p>
                                        {step.tip && (
                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-2 mt-2">
                                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                    <span className="font-medium">💡 Pro Tip:</span> {step.tip}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ));
                    }
                }
                return null;
            };

            return (
                <Card title={`Recipe: ${result.dish_name}`} variant="nature">
                    <div className="mb-6 flex justify-end">
                        <Button onClick={handlePrint} variant="secondary">
                            🖨️ Print/PDF
                        </Button>
                    </div>
                    
                    {/* Recipe Header with Description and Meta Info */}
                    {result.description && (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">About This Recipe</h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{result.description}</p>
                        </div>
                    )}

                    {/* Recipe Meta Information */}
                    {(result.prep_time || result.cook_time || result.servings || result.difficulty) && (
                        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {result.prep_time && (
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="text-2xl mb-1">⏱️</div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Prep Time</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{result.prep_time}</div>
                                </div>
                            )}
                            {result.cook_time && (
                                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <div className="text-2xl mb-1">🔥</div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Cook Time</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{result.cook_time}</div>
                                </div>
                            )}
                            {result.servings && (
                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="text-2xl mb-1">🍽️</div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Servings</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{result.servings}</div>
                                </div>
                            )}
                            {result.difficulty && (
                                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <div className="text-2xl mb-1">📊</div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Difficulty</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{result.difficulty}</div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Ingredients Section */}
                        <div>
                            <h3 className="font-semibold text-xl mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                                🥘 Ingredients
                            </h3>
                            <ul className="space-y-2">
                                {renderIngredients()}
                            </ul>
                        </div>

                        {/* Instructions Section */}
                        <div>
                            <h3 className="font-semibold text-xl mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                                👩‍🍳 Instructions
                            </h3>
                            <ol className="space-y-3">
                                {renderInstructions()}
                            </ol>
                        </div>
                    </div>

                    {/* Expert Tips */}
                    {result.expert_tips && result.expert_tips.length > 0 && (
                        <div className="mt-8">
                            <h3 className="font-semibold text-xl mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                                💡 Expert Tips
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {result.expert_tips.map((tip, i) => (
                                    <div key={i} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400">
                                        <p className="text-gray-700 dark:text-gray-300">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Nutritional Info */}
                    {result.nutritional_info && (
                        <div className="mt-8">
                            <h3 className="font-semibold text-xl mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                                🌱 Nutritional Benefits
                            </h3>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <p className="text-gray-700 dark:text-gray-300">{result.nutritional_info}</p>
                            </div>
                        </div>
                    )}

                    {/* Variations */}
                    {result.variations && result.variations.length > 0 && (
                        <div className="mt-8">
                            <h3 className="font-semibold text-xl mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                                🔄 Variations & Customizations
                            </h3>
                            <ul className="space-y-2">
                                {result.variations.map((variation, i) => (
                                    <li key={i} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                        <p className="text-gray-700 dark:text-gray-300">{variation}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Storage Tips */}
                    {result.storage_tips && (
                        <div className="mt-8">
                            <h3 className="font-semibold text-xl mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                                🥡 Storage Tips
                            </h3>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                <p className="text-gray-700 dark:text-gray-300">{result.storage_tips}</p>
                            </div>
                        </div>
                    )}

                    {/* Shopping List */}
                    <div className="mt-8">
                        <h3 className="font-semibold text-xl mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                            🛒 Shopping List
                        </h3>
                        
                        {/* Buy All Buttons for Single Recipe */}
                        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <a 
                                href={`https://blinkit.com/s/?q=${result.shopping_list.map(i => encodeURIComponent(i)).join('+')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                            >
                                🛒 Buy All on BlinkIt
                            </a>
                            <a 
                                href={`https://www.zepto.com/search?query=${result.shopping_list.map(i => encodeURIComponent(i)).join('+')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                            >
                                🛒 Buy All on Zepto
                            </a>
                            <a 
                                href={`https://www.flipkart.com/search?q=${result.shopping_list.map(i => encodeURIComponent(i)).join('+')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                            >
                                🛒 Buy All on Flipkart Minutes
                            </a>
                            <a 
                                href={`https://www.amazon.in/s?k=${result.shopping_list.map(i => encodeURIComponent(i)).join('+')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium text-center"
                            >
                                🛒 Buy All on Amazon Fresh
                            </a>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                        <th className="text-left py-2 px-3 text-gray-900 dark:text-gray-100">Ingredient</th>
                                        <th className="text-center py-2 px-2 text-gray-900 dark:text-gray-100">BlinkIt</th>
                                        <th className="text-center py-2 px-2 text-gray-900 dark:text-gray-100">Zepto</th>
                                        <th className="text-center py-2 px-2 text-gray-900 dark:text-gray-100">Flipkart Minutes</th>
                                        <th className="text-center py-2 px-2 text-gray-900 dark:text-gray-100">Amazon Fresh</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.shopping_list.map((item, i) => {
                                        const encodedItem = encodeURIComponent(item);
                                        return (
                                            <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                                                <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-100">{item}</td>
                                                <td className="py-2 px-2 text-center">
                                                    <a 
                                                        href={`https://blinkit.com/s/?q=${encodedItem}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium inline-block"
                                                    >
                                                        Buy on BlinkIt
                                                    </a>
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <a 
                                                        href={`https://www.zepto.com/search?query=${encodedItem}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-medium inline-block"
                                                    >
                                                        Buy on Zepto
                                                    </a>
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <a 
                                                        href={`https://www.flipkart.com/search?q=${encodedItem}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium inline-block"
                                                    >
                                                        Buy on Flipkart Minutes
                                                    </a>
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <a 
                                                        href={`https://www.amazon.in/s?k=${encodedItem}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs font-medium inline-block"
                                                    >
                                                        Buy on Amazon Fresh
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            );
        }

        return null;
    };

    const handleModeChange = (newMode: 'plan' | 'recipe') => {
        setMode(newMode);
        setResult(null); // Clear previous results when switching tabs
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card variant="glass">
                <div className="flex justify-center border-b border-white/20 pb-4 mb-6">
                    <div className="flex bg-white/10 rounded-2xl p-2 gap-2">
                        <button 
                            onClick={() => handleModeChange('plan')} 
                            className={`px-8 py-4 font-semibold rounded-xl transition-all duration-300 min-w-[140px] ${
                                mode === 'plan' 
                                    ? 'bg-white text-purple-600 shadow-lg transform scale-105' 
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            🍽️ Daily Plan
                        </button>
                        <button 
                            onClick={() => handleModeChange('recipe')} 
                            className={`px-8 py-4 font-semibold rounded-xl transition-all duration-300 min-w-[140px] ${
                                mode === 'recipe' 
                                    ? 'bg-white text-purple-600 shadow-lg transform scale-105' 
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            👨‍🍳 Single Recipe
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'plan' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Child</label>
                                <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                                    {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dietary Preferences</label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {DIETARY_PREFERENCES.map(pref => (
                                        <button key={pref} type="button" onClick={() => handleDietaryPrefChange(pref)} className={`px-3 py-1 text-sm rounded-full ${dietaryPrefs.includes(pref) ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>
                                            {pref}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Additional Instructions</label>
                                <textarea
                                    value={additionalInstructions}
                                    onChange={e => setAdditionalInstructions(e.target.value)}
                                    placeholder="e.g., No dairy products, extra spicy, baby-led weaning friendly..."
                                    className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600 resize-vertical text-gray-900 dark:text-gray-100"
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Specify allergies, preferences, or special requirements for both mother and baby
                                </p>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label htmlFor="dishName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dish Name</label>
                            <input type="text" id="dishName" value={dishName} onChange={e => setDishName(e.target.value)} required placeholder="e.g., Macaroni and Cheese" className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                        </div>
                    )}
                    <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                    <Button type="submit" isLoading={loading} variant="gradient" size="lg">
                        {mode === 'plan' ? '✨ Generate Meal Plan' : '🔥 Get Recipe'}
                    </Button>
                </form>
            </Card>

            {loading && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 shadow-2xl">
                        <Loader 
                            size="lg" 
                            type="pulse"
                            message={mode === 'plan' ? "🍽️ Creating your personalized meal plan..." : "👨‍🍳 Generating your recipe..."}
                        />
                        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                            This usually takes 10-15 seconds
                        </div>
                    </div>
                </div>
            )}
            {renderResult()}

            <HistorySection title="Recent Meal Plans & Recipes" history={history} renderItem={renderHistoryItem} isLoading={historyLoading} />
        </div>
    );
};
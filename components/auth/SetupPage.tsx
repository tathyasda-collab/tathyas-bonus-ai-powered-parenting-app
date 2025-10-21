import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api, ApiError } from '../../services/api';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { LOGO_URL } from '../../constants';

const SetupPage: React.FC = () => {
    const { user, completeSetup, logout } = useAuth();
    // User Profile State
    const [name, setName] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [street, setStreet] = useState('');
    const [district, setDistrict] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [address, setAddress] = useState('');
    const [spouseName, setSpouseName] = useState('');
    const [spouseGender, setSpouseGender] = useState('');
    const [spouseAge, setSpouseAge] = useState('');

    // Child Details State
    const [babyName, setBabyName] = useState('');
    const [babyDob, setBabyDob] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            await api.saveUserProfile(user.id, { 
                name, 
                gender, 
                age: parseInt(age), 
                pincode,
                street,
                district,
                state,
                address,
                spouse_name: spouseName,
                spouse_gender: spouseGender,
                spouse_age: spouseAge ? parseInt(spouseAge) : undefined,
            });
            await api.saveChild(user.id, { 
                baby_name: babyName, 
                baby_dob: new Date(babyDob).toISOString() 
            });
            completeSetup();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.userMessage);
            } else {
                setError('An unexpected error occurred. Please try again.');
                console.error("An unexpected error occurred during setup:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-4xl">
                 <div className="flex justify-center mb-8">
                    <img src={LOGO_URL} alt="Tathyas Logo" className="h-20 w-auto" />
                </div>
                <Card>
                    <h2 className="text-2xl font-bold text-center mb-4">Welcome! Let's get you set up.</h2>
                    <p className="text-center text-gray-500 mb-6">Please provide some details to personalize your experience.</p>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal & Child Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Your Details</h3>
                                <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <input type="text" placeholder="Gender" value={gender} onChange={e => setGender(e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <input type="number" placeholder="Your Age" value={age} onChange={e => setAge(e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                             <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Your Child's Details</h3>
                                <input type="text" placeholder="Baby's Name" value={babyName} onChange={e => setBabyName(e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <div>
                                    <label className="text-sm text-gray-500">Baby's Date of Birth</label>
                                    <input type="date" value={babyDob} onChange={e => setBabyDob(e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                </div>
                            </div>
                        </div>

                        {/* Address Details */}
                        <div>
                             <h3 className="text-lg font-semibold border-b pb-2 mb-4">Address Details</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <input type="text" placeholder="Street" value={street} onChange={e => setStreet(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <input type="text" placeholder="District" value={district} onChange={e => setDistrict(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <input type="text" placeholder="State" value={state} onChange={e => setState(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <input type="text" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <textarea placeholder="Full Address" value={address} onChange={e => setAddress(e.target.value)} rows={3} className="md:col-span-2 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                             </div>
                        </div>

                         {/* Spouse's Details */}
                        <div>
                             <h3 className="text-lg font-semibold border-b pb-2 mb-4">Spouse's Details (Optional)</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                <input type="text" placeholder="Spouse's Name" value={spouseName} onChange={e => setSpouseName(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <input type="text" placeholder="Spouse's Gender" value={spouseGender} onChange={e => setSpouseGender(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <input type="number" placeholder="Spouse's Age" value={spouseAge} onChange={e => setSpouseAge(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                             </div>
                        </div>

                        {error && <p className="text-red-500 text-center">{error}</p>}
                        
                        <div className="pt-4">
                            <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                                {loading ? 'Saving...' : 'Complete Setup'}
                            </Button>
                        </div>
                    </form>
                    <div className="text-center mt-4">
                        <button 
                            onClick={() => logout()} 
                            disabled={loading}
                            className="text-sm font-medium text-green-600 hover:text-green-500 disabled:text-gray-400"
                        >
                            Back to Login
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SetupPage;
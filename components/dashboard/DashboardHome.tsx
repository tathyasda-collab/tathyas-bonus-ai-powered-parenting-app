import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import type { UserProfile, Child } from '../../types';
import Loader from '../shared/Loader';

type View = 'home' | 'planner' | 'meal' | 'emotion';

interface DashboardHomeProps {
    setActiveView: (view: View) => void;
}

const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


const DashboardHome: React.FC<DashboardHomeProps> = ({ setActiveView }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [child, setChild] = useState<Child | null>(null);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const userProfile = await api.getUserProfile(user.id);
                    const children = await api.getChildren(user.id);
                    setProfile(userProfile);
                    if (children.length > 0) {
                        setChild(children[0]);
                    }
                } catch (error) {
                    console.error("Failed to fetch dashboard data:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user]);

    const tools = [
        { name: 'Parenting Planner', description: 'Get a personalized daily activity plan to support your child\'s development.', view: 'planner' as View, icon: '📅' },
        { name: 'Meal Assistant', description: 'Generate healthy and tasty meal plans tailored to your child\'s needs.', view: 'meal' as View, icon: '🍲' },
        { name: 'Emotion Check-in', description: 'A space for you to reflect on your feelings and receive a moment of support.', view: 'emotion' as View, icon: '❤️' },
    ];
    
    if (loading) {
        return <Loader />;
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {profile && (
                    <Card className="lg:col-span-2">
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">Your Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                            <div><strong>Name:</strong> {profile.name}</div>
                            <div><strong>Age:</strong> {profile.age}</div>
                            <div><strong>Gender:</strong> {profile.gender}</div>
                            <div><strong>Pincode:</strong> {profile.pincode}</div>
                            <div className="md:col-span-2"><strong>Address:</strong> {`${profile.street}, ${profile.district}, ${profile.state}`}</div>
                             {profile.spouse_name && (
                                <div className="md:col-span-2 mt-4 pt-4 border-t dark:border-gray-600">
                                    <h4 className="font-semibold text-md mb-2">Spouse's Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><strong>Name:</strong> {profile.spouse_name}</div>
                                        <div><strong>Gender:</strong> {profile.spouse_gender}</div>
                                        <div><strong>Age:</strong> {profile.spouse_age}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}
                 {child && (
                    <Card>
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">Your Child's Profile</h3>
                         <div className="space-y-2 text-gray-700 dark:text-gray-300">
                             <div><strong>Name:</strong> {child.baby_name}</div>
                             <div><strong>Date of Birth:</strong> {new Date(child.baby_dob).toLocaleDateString()}</div>
                             <div><strong>Age:</strong> {calculateAge(child.baby_dob)} years old</div>
                         </div>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <Card key={tool.name} className="flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
                        <div className="text-5xl mb-4">{tool.icon}</div>
                        <h3 className="text-xl font-semibold mb-2">{tool.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 flex-grow">{tool.description}</p>
                        <button
                            onClick={() => setActiveView(tool.view)}
                            className="mt-6 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
                        >
                            Open Tool
                        </button>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default DashboardHome;
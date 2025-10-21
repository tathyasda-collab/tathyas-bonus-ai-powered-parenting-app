import React, { useState, useEffect } from 'react';
import Header from '../shared/Header';
import DashboardHome from './DashboardHome';
import ParentingPlanner from '../tools/ParentingPlanner';
import MealAssistant from '../tools/MealAssistant';
import EmotionCheckin from '../tools/EmotionCheckin';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import Card from '../shared/Card';
import Button from '../shared/Button';

type View = 'home' | 'planner' | 'meal' | 'emotion';

const UserDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<View>('home');
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    const [renewalLink, setRenewalLink] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            api.getUserDaysRemaining(user.id).then(data => {
                if (data) {
                    setDaysRemaining(data.days_remaining);
                }
            });
            api.getRenewalLink().then(setRenewalLink);
        }
    }, [user]);

    const renderActiveView = () => {
        switch (activeView) {
            case 'planner':
                return <ParentingPlanner />;
            case 'meal':
                return <MealAssistant />;
            case 'emotion':
                return <EmotionCheckin />;
            case 'home':
            default:
                return <DashboardHome setActiveView={setActiveView} />;
        }
    };

    const isSubscriptionExpired = daysRemaining !== null && daysRemaining <= 0;

    return (
        <div>
            <Header />
            <main className="p-4 sm:p-8">
                {isSubscriptionExpired ? (
                    <Card className="max-w-2xl mx-auto text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Subscription Expired</h2>
                        <p className="mb-6">Your access to the AI tools has expired. Please renew your subscription to continue.</p>
                        {renewalLink ? (
                             <a href={renewalLink} target="_blank" rel="noopener noreferrer">
                                <Button className="bg-green-600 hover:bg-green-700 text-white">
                                    Renew Now
                                </Button>
                            </a>
                        ) : (
                             <p>Please contact support for renewal information.</p>
                        )}
                    </Card>
                ) : (
                    <>
                        {activeView !== 'home' && (
                            <button
                                onClick={() => setActiveView('home')}
                                className="mb-6 text-sm font-semibold text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 no-print"
                            >
                                &larr; Back to Dashboard
                            </button>
                        )}
                        {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7 && (
                             <Card className="mb-6 bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 text-center no-print">
                                <p>Your subscription will expire in <strong>{daysRemaining}</strong> day(s). <a href={renewalLink || '#'} target="_blank" rel="noopener noreferrer" className="font-bold underline">Renew now</a> to avoid interruption.</p>
                            </Card>
                        )}
                        {renderActiveView()}
                    </>
                )}
            </main>
        </div>
    );
};

export default UserDashboard;
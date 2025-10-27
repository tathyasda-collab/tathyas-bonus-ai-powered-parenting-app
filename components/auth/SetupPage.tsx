
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { UserProfile, Child } from '../../types';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { APP_NAME, LOGO_URL } from '../../constants';
import { useError } from '../../context/ErrorContext';

export const SetupPage: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({ full_name: '', address: '' });
  const [childData, setChildData] = useState<Omit<Child, 'id' | 'user_id'>>({ name: '', age: 1, gender: 'male', interests: '' });
  const [loading, setLoading] = useState(false);
  const { showError } = useError();

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };
  
  const handleChildChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.name === 'age' ? parseInt(e.target.value, 10) : e.target.value;
    setChildData({ ...childData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await api.saveUserProfile({ id: user.id, ...profileData });
      await api.saveChild({ user_id: user.id, ...childData });
      // The auth context will automatically detect the profile change and transition away from this page.
      // We can force a reload to ensure the context updates if needed, but it's often not necessary.
      window.location.reload();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center items-center mb-6">
          <img src={LOGO_URL} alt="Logo" className="h-12 w-12 dark:invert" />
          <h1 className="text-3xl font-bold ml-4 text-gray-800 dark:text-gray-200">{APP_NAME}</h1>
        </div>
        <Card title="Welcome! Let's get you set up.">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Please provide a few details to personalize your experience.
          </p>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Parent Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Your Information</h3>
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input type="text" name="full_name" id="full_name" required onChange={handleProfileChange} value={profileData.full_name} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address (Optional)</label>
                <input type="text" name="address" id="address" onChange={handleProfileChange} value={profileData.address} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>

            {/* Child Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Child's Information</h3>
               <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Child's Name</label>
                <input type="text" name="name" id="name" required onChange={handleChildChange} value={childData.name} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                  <input type="number" name="age" id="age" required min="0" max="18" onChange={handleChildChange} value={childData.age} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                  <select name="gender" id="gender" required onChange={handleChildChange} value={childData.gender} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="interests" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interests (e.g., dinosaurs, drawing)</label>
                <textarea name="interests" id="interests" rows={3} onChange={handleChildChange} value={childData.interests} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
              </div>
            </div>
            
            <div className="pt-5">
              <div className="flex justify-end">
                <Button type="submit" isLoading={loading}>Save and Continue</Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
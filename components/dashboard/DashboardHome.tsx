
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { Child } from '../../types';
import { Card } from '../shared/Card';

interface DashboardHomeProps {
  setActiveView: (view: 'home' | 'planner' | 'meal' | 'emotion') => void;
}

const ToolCard: React.FC<{ title: string, description: string, icon: string, onClick: () => void }> = ({ title, description, icon, onClick }) => (
    <div
        onClick={onClick}
        className="cursor-pointer bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg shadow-lg hover:shadow-xl hover:bg-white/20 transition-all transform hover:-translate-y-1"
    >
        <div className="flex items-center mb-4">
            <span className="text-3xl mr-4">{icon}</span>
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-white/80">{description}</p>
    </div>
);

export const DashboardHome: React.FC<DashboardHomeProps> = ({ setActiveView }) => {
  const { user, profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);
  
  // Edit states
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingSpouse, setIsEditingSpouse] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  
  // Form data states
  const [editUserData, setEditUserData] = useState<any>({});
  const [editSpouseData, setEditSpouseData] = useState<any>({});
  const [editAddressData, setEditAddressData] = useState<any>({}); // Set to true by default

  useEffect(() => {
    if (user) {
      // Fetch children
      api.getChildren(user.id).then(setChildren);
      
      // Fetch complete user profile
      api.getUserProfile(user.id).then((profile) => {
        setFullProfile(profile);
      });
    }
  }, [user]);

  const greeting = `Welcome back, ${fullProfile?.name || fullProfile?.full_name || profile?.full_name || user?.email}!`;

  // Edit handlers
  const handleEditUser = () => {
    setEditUserData({
      full_name: fullProfile?.name || fullProfile?.full_name || '',
      gender: fullProfile?.gender || '',
      age: fullProfile?.age || '',
      phone: fullProfile?.phone || ''
    });
    setIsEditingUser(true);
  };

  const handleEditSpouse = () => {
    setEditSpouseData({
      spouse_name: fullProfile?.spouse_name || '',
      spouse_gender: fullProfile?.spouse_gender || '',
      spouse_age: fullProfile?.spouse_age || ''
    });
    setIsEditingSpouse(true);
  };

  const handleEditAddress = () => {
    setEditAddressData({
      street_address: fullProfile?.street || fullProfile?.street_address || '',
      address: fullProfile?.address || '',
      district: fullProfile?.district || '',
      state: fullProfile?.state || '',
      pin_code: fullProfile?.pincode || fullProfile?.pin_code || ''
    });
    setIsEditingAddress(true);
  };

  const handleSaveUser = async () => {
    try {
      // Call API to update user profile
      await api.updateUserProfile(user.id, {
        full_name: editUserData.full_name,
        gender: editUserData.gender,
        age: editUserData.age,
        phone: editUserData.phone
      });
      
      // Update the local state with new data
      setFullProfile(prev => ({ ...prev, ...editUserData }));
      setIsEditingUser(false);
    } catch (error: any) {
      alert(`Failed to save user data: ${error.message}`);
    }
  };

  const handleSaveSpouse = async () => {
    try {
      // Call API to update spouse profile
      await api.updateUserProfile(user.id, {
        spouse_name: editSpouseData.spouse_name,
        spouse_gender: editSpouseData.spouse_gender,
        spouse_age: editSpouseData.spouse_age
      });
      
      // Update the local state with new data
      setFullProfile(prev => ({ ...prev, ...editSpouseData }));
      setIsEditingSpouse(false);
    } catch (error: any) {
      alert(`Failed to save spouse data: ${error.message}`);
    }
  };

  const handleSaveAddress = async () => {
    try {
      // Call API to update address profile
      await api.updateUserProfile(user.id, {
        street_address: editAddressData.street_address,
        address: editAddressData.address,
        district: editAddressData.district,
        state: editAddressData.state,
        pin_code: editAddressData.pin_code
      });
      
      // Update the local state with new data
      setFullProfile(prev => ({ ...prev, ...editAddressData }));
      setIsEditingAddress(false);
    } catch (error: any) {
      alert(`Failed to save address data: ${error.message}`);
    }
  };

  const handleCancelEdit = (section: 'user' | 'spouse' | 'address') => {
    if (section === 'user') setIsEditingUser(false);
    if (section === 'spouse') setIsEditingSpouse(false);
    if (section === 'address') setIsEditingAddress(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">{/* Centering container */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">{greeting}</h2>
        <p className="mt-1 text-lg text-white/80">What can we help with today?</p>
      </div>

      <Card variant="glass">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsProfileExpanded(!isProfileExpanded)}>
          <h3 className="text-xl font-bold text-white">👨‍👩‍👧‍👦 Family Profile Summary</h3>
          <button className="text-white/70 hover:text-white transition-colors">
            {isProfileExpanded ? '🔼' : '🔽'}
          </button>
        </div>
        
        {/* Show details only when expanded */}
        <div className={`mt-4 transition-all duration-300 ${isProfileExpanded ? 'block' : 'hidden'}`}>
          <div className="space-y-6">
          {/* User Details Table */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-lg text-white">User Details</h4>
              {!isEditingUser ? (
                <button 
                  onClick={handleEditUser}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-blue-100 border border-blue-300/30 hover:border-blue-300/50 backdrop-blur-sm px-3 py-1 rounded-md text-sm transition-all duration-200"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveUser}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-200 hover:text-green-100 border border-green-300/30 hover:border-green-300/50 backdrop-blur-sm px-3 py-1 rounded-md text-sm transition-all duration-200"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => handleCancelEdit('user')}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100 border border-red-300/30 hover:border-red-300/50 backdrop-blur-sm px-3 py-1 rounded-md text-sm transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                <tbody>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Name</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingUser ? (
                        fullProfile?.name || fullProfile?.full_name || profile?.full_name || 'Not provided'
                      ) : (
                        <input
                          type="text"
                          value={editUserData.full_name}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, full_name: e.target.value }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          placeholder="Enter full name"
                        />
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Email</td>
                    <td className="px-4 py-2 text-white/90">{fullProfile?.email || profile?.email || user?.email}</td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Gender</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingUser ? (
                        fullProfile?.gender || 'Not provided'
                      ) : (
                        <select
                          value={editUserData.gender}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Age</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingUser ? (
                        fullProfile?.age ? `${fullProfile.age} years` : 'Not provided'
                      ) : (
                        <input
                          type="number"
                          value={editUserData.age}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, age: parseInt(e.target.value) || '' }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          placeholder="Enter age"
                          min="1"
                          max="120"
                        />
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Phone</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingUser ? (
                        fullProfile?.phone || 'Not provided'
                      ) : (
                        <input
                          type="tel"
                          value={editUserData.phone}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          placeholder="Enter phone number"
                        />
                      )}
                    </td>
                  </tr>
                  {/* System fields - Read-only */}
                  <tr className="border-b border-white/20 bg-gray-500/10">
                    <td className="px-4 py-2 font-medium text-white/70 bg-gray-500/20">Member Since</td>
                    <td className="px-4 py-2 text-white/70">{fullProfile?.created_at ? new Date(fullProfile.created_at).toLocaleDateString() : 'Unknown'}</td>
                  </tr>
                  <tr className="border-b border-white/20 bg-gray-500/10">
                    <td className="px-4 py-2 font-medium text-white/70 bg-gray-500/20">Last Updated</td>
                    <td className="px-4 py-2 text-white/70">{fullProfile?.updated_at ? new Date(fullProfile.updated_at).toLocaleDateString() : 'Not available'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Spouse Details Table */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-lg text-white">Spouse Details</h4>
              {!isEditingSpouse ? (
                <button 
                  onClick={handleEditSpouse}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-blue-100 border border-blue-300/30 hover:border-blue-300/50 backdrop-blur-sm px-3 py-1 rounded-md text-sm transition-all duration-200"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveSpouse}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-200 hover:text-green-100 border border-green-300/30 hover:border-green-300/50 backdrop-blur-sm px-3 py-1 rounded-md text-sm transition-all duration-200"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => handleCancelEdit('spouse')}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100 border border-red-300/30 hover:border-red-300/50 backdrop-blur-sm px-3 py-1 rounded-md text-sm transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                <tbody>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Spouse Name</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingSpouse ? (
                        fullProfile?.spouse_name || 'Not provided'
                      ) : (
                        <input
                          type="text"
                          value={editSpouseData.spouse_name}
                          onChange={(e) => setEditSpouseData(prev => ({ ...prev, spouse_name: e.target.value }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          placeholder="Enter spouse name"
                        />
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Spouse Gender</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingSpouse ? (
                        fullProfile?.spouse_gender || 'Not provided'
                      ) : (
                        <select
                          value={editSpouseData.spouse_gender}
                          onChange={(e) => setEditSpouseData(prev => ({ ...prev, spouse_gender: e.target.value }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Spouse Age</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingSpouse ? (
                        fullProfile?.spouse_age ? `${fullProfile.spouse_age} years` : 'Not provided'
                      ) : (
                        <input
                          type="number"
                          value={editSpouseData.spouse_age}
                          onChange={(e) => setEditSpouseData(prev => ({ ...prev, spouse_age: parseInt(e.target.value) || '' }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          placeholder="Enter spouse age"
                          min="1"
                          max="120"
                        />
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Child Details Table */}
          {children.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg text-white">Child Details</h4>
                <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-blue-100 border border-blue-300/30 hover:border-blue-300/50 backdrop-blur-sm px-3 py-1 rounded-md text-sm transition-all duration-200">
                  Edit
                </button>
              </div>
              <div className="overflow-x-auto">
                                <table className="min-w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-white">Name</th>
                      <th className="px-4 py-2 text-left font-medium text-white">Age</th>
                      <th className="px-4 py-2 text-left font-medium text-white">Gender</th>
                      <th className="px-4 py-2 text-left font-medium text-white">Interests</th>
                      <th className="px-4 py-2 text-left font-medium text-white">Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map((child, index) => (
                      <tr key={child.id} className={index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'}>
                        <td className="px-4 py-2 text-white/90">{child.name}</td>
                        <td className="px-4 py-2 text-white/90">{child.age} years</td>
                        <td className="px-4 py-2 text-white/90">{child.gender}</td>
                        <td className="px-4 py-2 text-white/90">{child.interests || 'Not specified'}</td>
                        <td className="px-4 py-2 text-white/90">
                          {child.created_at ? new Date(child.created_at).toLocaleDateString() : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-semibold text-lg text-white mb-3">Child Details</h4>
              <p className="text-white/70 italic">No children profiles added yet.</p>
            </div>
          )}

          {/* Address Details Table */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-lg text-white">Address Details</h4>
              {!isEditingAddress ? (
                <button 
                  onClick={handleEditAddress}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-blue-100 border border-blue-300/30 hover:border-blue-300/50 backdrop-blur-sm px-3 py-1 rounded-md text-sm transition-all duration-200"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveAddress}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-200 hover:text-green-100 border border-green-300/30 hover:border-green-300/50 backdrop-blur-sm px-3 py-1 rounded-md text-sm transition-all duration-200"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => handleCancelEdit('address')}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100 border border-red-300/30 hover:border-red-300/50 backdrop-blur-sm px-3 py-1 rounded-md text-sm transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                <tbody>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Street Address</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingAddress ? (
                        fullProfile?.street || fullProfile?.street_address || 'Not provided'
                      ) : (
                        <input
                          type="text"
                          value={editAddressData.street_address}
                          onChange={(e) => setEditAddressData(prev => ({ ...prev, street_address: e.target.value }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          placeholder="Enter street address"
                        />
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Address</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingAddress ? (
                        fullProfile?.address || 'Not provided'
                      ) : (
                        <input
                          type="text"
                          value={editAddressData.address}
                          onChange={(e) => setEditAddressData(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          placeholder="Enter address"
                        />
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">District</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingAddress ? (
                        fullProfile?.district || 'Not provided'
                      ) : (
                        <input
                          type="text"
                          value={editAddressData.district}
                          onChange={(e) => setEditAddressData(prev => ({ ...prev, district: e.target.value }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          placeholder="Enter district"
                        />
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">State</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingAddress ? (
                        fullProfile?.state || 'Not provided'
                      ) : (
                        <input
                          type="text"
                          value={editAddressData.state}
                          onChange={(e) => setEditAddressData(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          placeholder="Enter state"
                        />
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="px-4 py-2 font-medium text-white bg-white/10">Pin Code</td>
                    <td className="px-4 py-2 text-white/90">
                      {!isEditingAddress ? (
                        fullProfile?.pincode || fullProfile?.pin_code || 'Not provided'
                      ) : (
                        <input
                          type="text"
                          value={editAddressData.pin_code}
                          onChange={(e) => setEditAddressData(prev => ({ ...prev, pin_code: e.target.value }))}
                          className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          placeholder="Enter pin code"
                        />
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </Card>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-6">Available Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <ToolCard
            title="Parenting Planner"
            description="Generate a daily plan with activities and tips tailored to your child's needs."
            icon="📅"
            onClick={() => setActiveView('planner')}
          />
          <ToolCard
            title="Meal Assistant"
            description="Create weekly meal plans or get quick, kid-friendly recipes and shopping lists."
            icon="🍲"
            onClick={() => setActiveView('meal')}
          />
          <ToolCard
            title="Emotion Check-in"
            description="Feeling overwhelmed? Get a moment of encouragement and support."
            icon="💖"
            onClick={() => setActiveView('emotion')}
          />
        </div>
      </div>
    </div>
  );
};
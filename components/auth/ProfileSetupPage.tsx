import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { APP_NAME, LOGO_URL } from '../../constants';
import { useError } from '../../context/ErrorContext';
import { useTheme } from '../../context/ThemeContext';
import * as api from '../../services/api';

export const ProfileSetupPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // User Profile Data
    full_name: '',
    gender: '',
    age: '',
    phone: '',
    spouse_name: '',
    spouse_gender: '',
    spouse_age: '',
    street_address: '',
    address: '',
    district: '',
    state: '',
    pin_code: '',
    preferred_language: 'English',
    goals: '',
    challenges: '',
    
    // Child Data
    baby_name: '',
    baby_gender: '',
    baby_date_of_birth: '',
    child_age: '',
    child_interests: ''
  });
  const [loading, setLoading] = useState(false);
  const { showError } = useError();
  const { theme } = useTheme();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate step 1 (User Details)
      if (!formData.full_name.trim()) {
        showError('Please enter your full name');
        return;
      }
      if (!formData.age || parseInt(formData.age) < 18 || parseInt(formData.age) > 100) {
        showError('Please enter a valid age (18-100 years)');
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2 (Address Details) - Optional validation
      // No strict validation for address fields
    } else if (currentStep === 3) {
      // Validate step 3 (Child Details)
      if (!formData.baby_name.trim()) {
        showError('Please enter your child\'s name');
        return;
      }
      if (!formData.child_age || parseInt(formData.child_age) < 0 || parseInt(formData.child_age) > 18) {
        showError('Please enter a valid child age (0-18 years)');
        return;
      }
      if (!formData.baby_gender) {
        showError('Please select your child\'s gender');
        return;
      }
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (!formData.goals.trim()) {
      showError('Please share your parenting goals');
      return;
    }

    setLoading(true);
    
    try {
      await api.completeUserProfile({
        // User profile data
        full_name: formData.full_name.trim(),
        gender: formData.gender,
        age: parseInt(formData.age),
        phone: formData.phone.trim(),
        spouse_name: formData.spouse_name.trim(),
        spouse_gender: formData.spouse_gender,
        spouse_age: formData.spouse_age ? parseInt(formData.spouse_age) : undefined,
        street_address: formData.street_address.trim(),
        address: formData.address.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        pin_code: formData.pin_code.trim(),
        preferred_language: formData.preferred_language,
        goals: formData.goals.trim(),
        challenges: formData.challenges.trim(),
        
        // Child data
        baby_name: formData.baby_name.trim(),
        baby_gender: formData.baby_gender,
        baby_date_of_birth: formData.baby_date_of_birth,
        child_age: parseInt(formData.child_age),
        child_interests: formData.child_interests.trim()
      });
      
      // Profile completion will trigger auth context update and redirect
    } catch (err: any) {
      console.error('Profile setup error:', err);
      showError(err.message || 'Failed to complete profile setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">👤 Personal Details</h3>
              <p className="text-white/70">Tell us about yourself</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-white/90 mb-2">
                  Full Name *
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-white/90 mb-2">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                >
                  <option value="" className="bg-gray-800 text-white">Select Gender</option>
                  <option value="male" className="bg-gray-800 text-white">Male</option>
                  <option value="female" className="bg-gray-800 text-white">Female</option>
                  <option value="other" className="bg-gray-800 text-white">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-white/90 mb-2">
                  Age *
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                  placeholder="e.g., 28"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                  placeholder="e.g., +1234567890"
                />
              </div>
            </div>
            
            <div className="border-t border-white/20 pt-6">
              <h4 className="text-lg font-semibold text-white mb-4">👫 Spouse Details (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="spouse_name" className="block text-sm font-medium text-white/90 mb-2">
                    Spouse Name
                  </label>
                  <input
                    id="spouse_name"
                    name="spouse_name"
                    type="text"
                    value={formData.spouse_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="Spouse's name"
                  />
                </div>
                
                <div>
                  <label htmlFor="spouse_gender" className="block text-sm font-medium text-white/90 mb-2">
                    Spouse Gender
                  </label>
                  <select
                    id="spouse_gender"
                    name="spouse_gender"
                    value={formData.spouse_gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                  >
                    <option value="" className="bg-gray-800 text-white">Select Gender</option>
                    <option value="male" className="bg-gray-800 text-white">Male</option>
                    <option value="female" className="bg-gray-800 text-white">Female</option>
                    <option value="other" className="bg-gray-800 text-white">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="spouse_age" className="block text-sm font-medium text-white/90 mb-2">
                    Spouse Age
                  </label>
                  <input
                    id="spouse_age"
                    name="spouse_age"
                    type="number"
                    min="18"
                    max="100"
                    value={formData.spouse_age}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="e.g., 30"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">🏠 Address Details</h3>
              <p className="text-white/70">Where are you located?</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="street_address" className="block text-sm font-medium text-white/90 mb-2">
                  Street Address
                </label>
                <input
                  id="street_address"
                  name="street_address"
                  type="text"
                  value={formData.street_address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                  placeholder="e.g., 123 Main Street, Apt 4B"
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-white/90 mb-2">
                  Full Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 resize-none"
                  placeholder="Complete address with landmarks"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-white/90 mb-2">
                    District/City
                  </label>
                  <input
                    id="district"
                    name="district"
                    type="text"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="e.g., Mumbai"
                  />
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-white/90 mb-2">
                    State/Province
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="e.g., Maharashtra"
                  />
                </div>
                
                <div>
                  <label htmlFor="pin_code" className="block text-sm font-medium text-white/90 mb-2">
                    PIN/ZIP Code
                  </label>
                  <input
                    id="pin_code"
                    name="pin_code"
                    type="text"
                    value={formData.pin_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="e.g., 400001"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">👶 Child Details</h3>
              <p className="text-white/70">Tell us about your little one</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="baby_name" className="block text-sm font-medium text-white/90 mb-2">
                  Child's Name *
                </label>
                <input
                  id="baby_name"
                  name="baby_name"
                  type="text"
                  value={formData.baby_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                  placeholder="Enter your child's name"
                />
              </div>
              
              <div>
                <label htmlFor="baby_gender" className="block text-sm font-medium text-white/90 mb-2">
                  Child's Gender *
                </label>
                <select
                  id="baby_gender"
                  name="baby_gender"
                  value={formData.baby_gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                >
                  <option value="" className="bg-gray-800 text-white">Select Gender</option>
                  <option value="male" className="bg-gray-800 text-white">Boy</option>
                  <option value="female" className="bg-gray-800 text-white">Girl</option>
                  <option value="other" className="bg-gray-800 text-white">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="child_age" className="block text-sm font-medium text-white/90 mb-2">
                  Child's Age (years) *
                </label>
                <input
                  id="child_age"
                  name="child_age"
                  type="number"
                  min="0"
                  max="18"
                  value={formData.child_age}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                  placeholder="e.g., 2"
                />
              </div>
              
              <div>
                <label htmlFor="baby_date_of_birth" className="block text-sm font-medium text-white/90 mb-2">
                  Date of Birth
                </label>
                <input
                  id="baby_date_of_birth"
                  name="baby_date_of_birth"
                  type="date"
                  value={formData.baby_date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="child_interests" className="block text-sm font-medium text-white/90 mb-2">
                Child's Interests & Activities
              </label>
              <textarea
                id="child_interests"
                name="child_interests"
                value={formData.child_interests}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 resize-none"
                placeholder="What does your child enjoy? (e.g., drawing, singing, playing with blocks, outdoor activities)"
              />
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">🎯 Parenting Preferences</h3>
              <p className="text-white/70">Help us personalize your experience</p>
            </div>
            
            <div>
              <label htmlFor="preferred_language" className="block text-sm font-medium text-white/90 mb-2">
                Preferred Language
              </label>
              <select
                id="preferred_language"
                name="preferred_language"
                value={formData.preferred_language}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
              >
                <option value="English" className="bg-gray-800 text-white">English</option>
                <option value="Spanish" className="bg-gray-800 text-white">Spanish</option>
                <option value="French" className="bg-gray-800 text-white">French</option>
                <option value="German" className="bg-gray-800 text-white">German</option>
                <option value="Hindi" className="bg-gray-800 text-white">Hindi</option>
                <option value="Chinese" className="bg-gray-800 text-white">Chinese</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="goals" className="block text-sm font-medium text-white/90 mb-2">
                Parenting Goals *
              </label>
              <textarea
                id="goals"
                name="goals"
                value={formData.goals}
                onChange={handleInputChange}
                rows={4}
                required
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 resize-none"
                placeholder="What are your main parenting goals? (e.g., better sleep routines, healthy eating habits, emotional development, discipline strategies)"
              />
            </div>
            
            <div>
              <label htmlFor="challenges" className="block text-sm font-medium text-white/90 mb-2">
                Current Challenges
              </label>
              <textarea
                id="challenges"
                name="challenges"
                value={formData.challenges}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 resize-none"
                placeholder="What parenting challenges are you facing? (e.g., bedtime struggles, picky eating, tantrums, screen time management)"
              />
            </div>
            
            <div className="bg-white/10 border border-white/20 rounded-xl p-4">
              <p className="text-white/80 text-sm">
                <span className="font-medium">💡 Note:</span> This information helps us provide personalized recommendations and content tailored to your unique parenting journey.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800' 
        : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'
    }`}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="relative">
              <img src={LOGO_URL} alt="Logo" className="h-16 w-16 filter brightness-0 invert rounded-xl pulse-glow" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full sparkle"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{APP_NAME}</h1>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full mx-auto mb-4"></div>
          <p className="text-white/90 text-lg">Complete your profile to get started</p>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step <= currentStep
                      ? 'bg-white text-purple-600'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="flex justify-center space-x-2 text-xs text-white/80">
              <span className={currentStep === 1 ? 'font-bold' : ''}>Personal</span>
              <span className={currentStep === 2 ? 'font-bold' : ''}>Address</span>
              <span className={currentStep === 3 ? 'font-bold' : ''}>Child</span>
              <span className={currentStep === 4 ? 'font-bold' : ''}>Preferences</span>
            </div>
          </div>
        </div>
        
        <Card variant="glass" className="relative overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                👶 Profile Setup
              </h2>
              <p className="text-white/80">
                Step {currentStep} of 4 - Tell us about yourself and your child to personalize your experience
              </p>
            </div>
            
            <form onSubmit={currentStep === 4 ? handleSubmit : (e) => e.preventDefault()}>
              {renderStepContent()}
              
              <div className="flex justify-between mt-8 pt-6 border-t border-white/20">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="px-6"
                  >
                    ← Previous
                  </Button>
                )}
                
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    variant="gradient"
                    className={`px-6 ${currentStep === 1 ? 'ml-auto' : ''}`}
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="gradient"
                    className="px-6 ml-auto"
                    isLoading={loading}
                  >
                    {loading ? 'Setting up your profile...' : '✨ Complete Setup'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};
// Fix: Creating the LanguageSelector component.
import React from 'react';

interface LanguageSelectorProps {
    selectedLanguage: string;
    onLanguageChange: (language: string) => void;
    className?: string;
}

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'gu', name: 'Gujarati' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange, className }) => {
    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <label htmlFor="language-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Language:
            </label>
            <select
                id="language-select"
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-green-500 focus:border-green-500"
            >
                {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.name}>
                        {lang.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;
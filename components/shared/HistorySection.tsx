
import React, { useState } from 'react';
import { Card } from './Card';

interface HistorySectionProps<T> {
  title: string;
  history: T[];
  renderItem: (item: T) => React.ReactNode;
  isLoading: boolean;
}

export const HistorySection = <T extends { id?: string }>({ title, history, renderItem, isLoading }: HistorySectionProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-t-lg flex justify-between items-center font-semibold text-gray-800 dark:text-gray-200"
      >
        <span>{title}</span>
        <svg className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      {isOpen && (
        <div className="p-4 border border-t-0 border-gray-200 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-800">
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No history yet.</p>
          ) : (
            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {history.map((item, index) => (
                <div key={item.id || index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                    {renderItem(item)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
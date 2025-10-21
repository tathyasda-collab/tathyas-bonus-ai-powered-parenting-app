import React, { useState } from 'react';

// Fix: Made the component generic to correctly infer the type of history items.
// The base item shape that the HistorySection component requires.
// All history items should at least have these properties.
interface BaseHistoryItem {
    id: string;
    created_at: string;
}

interface HistorySectionProps<T extends BaseHistoryItem> {
    history: T[];
    title: string;
    renderItem: (item: T) => { title: React.ReactNode; content: React.ReactNode };
}

const HistorySection = <T extends BaseHistoryItem>({ history, title, renderItem }: HistorySectionProps<T>) => {
    const [openItemId, setOpenItemId] = useState<string | null>(null);

    const toggleItem = (id: string) => {
        setOpenItemId(openItemId === id ? null : id);
    };

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{title}</h3>
            {history.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No history yet.</p>
            ) : (
                <div className="space-y-2">
                    {history.map((item) => {
                        const { title: itemTitle, content: itemContent } = renderItem(item);
                        return (
                            <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                                <button
                                    onClick={() => toggleItem(item.id)}
                                    className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center rounded-t-lg"
                                >
                                    <span className="font-medium">
                                        {itemTitle}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(item.created_at).toLocaleString()}
                                    </span>
                                </button>
                                {openItemId === item.id && (
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg">
                                        <h4 className="font-semibold mb-2">Result:</h4>
                                        <div>{itemContent}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HistorySection;

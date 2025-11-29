import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, MessageCircle } from 'lucide-react';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (number: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onDelete, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-8 w-full max-w-md animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
          <Clock size={14} /> Recent Chats
        </h3>
        <button 
          onClick={onClear}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          Clear All
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-all cursor-pointer"
            onClick={() => onSelect(item.number)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <MessageCircle size={16} />
              </div>
              <div>
                <p className="font-mono text-gray-800 text-sm font-medium">{item.number}</p>
                <p className="text-[10px] text-gray-400">
                  {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove from history"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
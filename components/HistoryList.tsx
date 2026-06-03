import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, MessageCircle, Phone, PhoneOff } from 'lucide-react';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (number: string) => void;
  onCall: (number: string) => void;
  onToggleNoWhatsApp: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ 
  history, 
  onSelect, 
  onCall,
  onToggleNoWhatsApp,
  onDelete, 
  onClear 
}) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-8 w-full max-w-md animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
          <Clock size={14} /> Recent Activities
        </h3>
        <button 
          onClick={onClear}
          className="text-xs text-red-400 hover:text-red-600 transition-colors bg-red-50/50 px-2 py-1 rounded"
        >
          Clear All
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-all cursor-pointer"
            onClick={() => {
              if (item.noWhatsApp) {
                onCall(item.number);
              } else {
                onSelect(item.number);
              }
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                item.noWhatsApp ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'
              }`}
              title={item.noWhatsApp ? "Dial regular call" : "Start WhatsApp Chat"}
              >
                {item.noWhatsApp ? <Phone size={15} /> : <MessageCircle size={15} />}
              </div>
              <div className="truncate flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-gray-800 text-sm font-medium truncate">{item.number}</p>
                  {item.noWhatsApp && (
                    <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/60 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                      No WhatsApp
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
            
            {/* Actions Section */}
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Phone Dialer Quick Action (Enabled always, especially useful for regular chats too) */}
              <button 
                onClick={() => onCall(item.number)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-slate-50 rounded"
                title="Call via Phone Dialer"
              >
                <Phone size={15} />
              </button>

              {/* Toggle No WhatsApp status */}
              <button 
                onClick={() => onToggleNoWhatsApp(item.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-all ${
                  item.noWhatsApp 
                    ? 'text-amber-700 bg-amber-50' 
                    : 'text-gray-400 hover:text-amber-700 hover:bg-amber-50 md:opacity-0 md:group-hover:opacity-100'
                }`}
                title={item.noWhatsApp ? "Mark as has WhatsApp" : "Mark as no WhatsApp"}
              >
                {item.noWhatsApp ? <PhoneOff size={14} className="inline mr-0.5" /> : "No WA?"}
              </button>

              {/* Delete button */}
              <button 
                onClick={() => onDelete(item.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity rounded"
                title="Remove from history"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
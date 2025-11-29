import React, { useState, useEffect } from 'react';
import { MessageCircle, ExternalLink, Info, AlertCircle, RotateCcw, X, Download } from 'lucide-react';
import NumberInput from './components/NumberInput';
import HistoryList from './components/HistoryList';
import { HistoryItem } from './types';
import { extractPhoneNumber } from './services/geminiService';
import { formatPhoneNumber } from './utils/phoneUtils';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [countryCode, setCountryCode] = useState(''); // Default to Auto
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  
  // Undo state
  const [lastDeleted, setLastDeleted] = useState<HistoryItem | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('quickwa_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem('quickwa_history', JSON.stringify(history));
  }, [history]);

  const showNotification = (msg: string, type: 'error' | 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartChat = (numberToUse?: string) => {
    const rawInput = numberToUse || text;
    
    // Process the number using our utility
    let formattedNumber: string | null = null;

    if (numberToUse) {
        formattedNumber = formatPhoneNumber(numberToUse, ''); 
    } else {
        formattedNumber = formatPhoneNumber(rawInput, countryCode);
    }
    
    if (!formattedNumber) {
        showNotification("Please enter a valid number.", 'error');
        return;
    }

    // Add to history
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      number: formattedNumber, // Store the clean formatted number
      rawText: !numberToUse && text.length > 20 ? text.substring(0, 20) + '...' : undefined,
      timestamp: Date.now(),
    };

    // Avoid duplicates at the top of the list
    setHistory(prev => {
        const filtered = prev.filter(item => item.number !== formattedNumber);
        return [newItem, ...filtered].slice(0, 10);
    });

    // wa.me URL requires number in international format without + or leading zeros
    const url = `https://wa.me/${formattedNumber}`;
    
    window.open(url, '_blank');
    
    // Only clear if it was a manual entry
    if (!numberToUse) {
        setText(''); 
    }
  };

  const handleAiExtract = async () => {
    setIsAiLoading(true);
    const result = await extractPhoneNumber(text);
    setIsAiLoading(false);

    if (result && result.phoneNumber) {
      setCountryCode(''); 
      setText(result.phoneNumber);
      showNotification("Number extracted successfully!", 'success');
    } else {
      // If result is null, it could be no number found OR missing API key.
      // We keep the message generic but helpful.
      showNotification("Could not find a valid number or AI unavailable.", 'error');
    }
  };

  const handleDeleteHistory = (id: string) => {
    const itemToDelete = history.find(h => h.id === id);
    if (itemToDelete) {
      // Clear any existing undo timeout to restart the timer
      if (undoTimeout) clearTimeout(undoTimeout);

      setLastDeleted(itemToDelete);
      setHistory(prev => prev.filter(h => h.id !== id));

      // Auto-dismiss undo toast after 5 seconds
      const timeout = setTimeout(() => {
        setLastDeleted(null);
      }, 5000);
      setUndoTimeout(timeout);
    }
  };

  const handleUndoDelete = () => {
    if (lastDeleted) {
      setHistory(prev => {
        // Add back and sort by timestamp (newest first)
        const restored = [...prev, lastDeleted].sort((a, b) => b.timestamp - a.timestamp);
        return restored;
      });
      setLastDeleted(null);
      if (undoTimeout) clearTimeout(undoTimeout);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      setHistory([]);
      setLastDeleted(null); // Clear any pending undo when full clear happens
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#E5DDD5] flex flex-col items-center py-12 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-32 bg-[#00a884] z-0 shadow-lg"></div>
      
      {/* Main Content */}
      <div className="z-10 w-full flex flex-col items-center max-w-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 text-white relative">
          <MessageCircle size={48} className="drop-shadow-md" />
          <h1 className="text-3xl font-bold tracking-tight drop-shadow-md">WhatsaLink</h1>
          
          {/* PWA Install Button (Floating next to header on Desktop, or inline) */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="absolute -right-24 top-2 bg-white text-[#00a884] p-2 rounded-full shadow-lg hover:bg-gray-100 transition-transform hover:scale-110 hidden sm:flex"
              title="Install App"
            >
              <Download size={20} />
            </button>
          )}
        </div>

        {/* Introduction Card */}
        <div className="mb-8 text-center bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-white/50 w-full max-w-md">
          <p className="text-gray-600 text-sm">
            Chat on WhatsApp without saving contacts.
            <br/>
            <span className="text-xs text-gray-500 font-medium">Supports international numbers & Israeli 05 format.</span>
          </p>
        </div>

        {/* Input Section */}
        <NumberInput 
          value={text} 
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
          onChange={setText} 
          onSubmit={() => handleStartChat()} 
          onAiExtract={handleAiExtract}
          isAiLoading={isAiLoading}
          onPasteError={(msg) => showNotification(msg, 'error')}
        />

        {/* Notification Toast (Error/Info) */}
        {notification && (
          <div className={`mt-4 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce-short text-sm font-medium ${
            notification.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {notification.type === 'error' ? <AlertCircle size={16}/> : <Info size={16}/>}
            {notification.msg}
          </div>
        )}

        {/* Instructions / Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center text-green-600 mb-1">
                <ExternalLink size={16} />
              </div>
              <h3 className="font-semibold text-gray-800">Direct Chat</h3>
              <p className="text-xs text-gray-500">
                Type a number. Starts with 05? We'll add +972 automatically. Or pick a country code.
              </p>
           </div>
           
           <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center text-purple-600 mb-1">
                 <Info size={16} />
              </div>
              <h3 className="font-semibold text-gray-800">Smart Paste</h3>
              <p className="text-xs text-gray-500">
                Paste messy text or email signatures. Our AI will extract the number for you.
              </p>
           </div>
        </div>

        {/* History Section */}
        <HistoryList 
          history={history} 
          onSelect={(num) => handleStartChat(num)} 
          onDelete={handleDeleteHistory}
          onClear={handleClearHistory}
        />

        {/* Mobile Install Button (Visible only if prompt available) */}
        {deferredPrompt && (
          <div className="mt-8 sm:hidden">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-4 py-2 bg-[#075E54] text-white rounded-lg shadow-md hover:bg-[#064e46] transition-colors text-sm font-medium"
            >
              <Download size={16} />
              Install App
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-400 text-xs">
          <p>WhatsaLink is not affiliated with WhatsApp Inc.</p>
        </div>

      </div>

      {/* Undo Toast (Fixed at bottom) */}
      {lastDeleted && (
        <div className="fixed bottom-6 z-50 flex items-center gap-3 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-xl transition-all transform animate-in slide-in-from-bottom-2 fade-in duration-300">
            <span className="text-sm">Chat deleted from history</span>
            <div className="h-4 w-px bg-gray-600 mx-1"></div>
            <button 
              onClick={handleUndoDelete}
              className="flex items-center gap-1.5 text-green-400 font-bold hover:text-green-300 text-sm tracking-wide px-2 py-1 rounded hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={14} />
              UNDO
            </button>
            <button
              onClick={() => setLastDeleted(null)}
              className="text-gray-400 hover:text-white transition-colors ml-1"
            >
              <X size={16} />
            </button>
        </div>
      )}
    </div>
  );
};

export default App;
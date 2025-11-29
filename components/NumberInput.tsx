import React, { useState, useEffect } from 'react';
import { Send, Wand2, Loader2, Eraser, Globe, ClipboardPaste } from 'lucide-react';

interface NumberInputProps {
  value: string;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onAiExtract: () => void;
  isAiLoading: boolean;
  onPasteError?: (msg: string) => void;
}

const COUNTRY_CODES = [
  { code: "", label: "Auto / Int'l", flag: "🌐" },
  { code: "972", label: "Israel (+972)", flag: "🇮🇱" },
  { code: "1", label: "USA/Can (+1)", flag: "🇺🇸" },
  { code: "44", label: "UK (+44)", flag: "🇬🇧" },
  { code: "91", label: "India (+91)", flag: "🇮🇳" },
  { code: "49", label: "Germany (+49)", flag: "🇩🇪" },
  { code: "33", label: "France (+33)", flag: "🇫🇷" },
  { code: "55", label: "Brazil (+55)", flag: "🇧🇷" },
  { code: "7", label: "Russia (+7)", flag: "🇷🇺" },
];

const NumberInput: React.FC<NumberInputProps> = ({ 
  value, 
  countryCode,
  onCountryCodeChange,
  onChange, 
  onSubmit, 
  onAiExtract,
  isAiLoading,
  onPasteError
}) => {
  const [cleanNumber, setCleanNumber] = useState('');

  // Strip non-digits for visual validation preview
  useEffect(() => {
    setCleanNumber(value.replace(/\D/g, ''));
  }, [value]);

  const isValidish = cleanNumber.length >= 5; // Basic validation
  const looksLikeMessyText = value.length > 20 || (value.includes(' ') && value.length > 10 && !value.startsWith('+'));
  
  // Check if the current input triggers the Israeli 05 heuristic
  const isIsraeli05 = value.replace(/\D/g, '').startsWith('05');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent newline in textarea
      if (isValidish) onSubmit();
      else if (looksLikeMessyText) onAiExtract();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text);
      } else {
        if (onPasteError) onPasteError("Clipboard is empty");
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      if (onPasteError) {
        onPasteError("Please paste manually (Ctrl+V)");
      }
    }
  };

  return (
    <div className="w-full max-w-md relative">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white rounded-xl shadow-xl p-1">
          
          {/* Header Controls */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
             <Globe size={14} className="text-gray-400" />
             <select 
               value={countryCode}
               onChange={(e) => onCountryCodeChange(e.target.value)}
               className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none cursor-pointer w-full hover:text-green-600 transition-colors"
             >
               {COUNTRY_CODES.map(c => (
                 <option key={c.code} value={c.code}>
                   {c.flag} {c.label}
                 </option>
               ))}
             </select>
             {isIsraeli05 && countryCode === "" && (
               <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full whitespace-nowrap font-medium animate-pulse">
                 🇮🇱 05 Detected
               </span>
             )}
          </div>

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste number here (e.g. 0501234567)"
            className="w-full bg-transparent p-4 text-gray-800 placeholder-gray-400 focus:outline-none text-lg font-medium resize-none"
            rows={looksLikeMessyText ? 3 : 1}
            style={{ minHeight: '60px' }}
          />
          
          <div className="flex justify-between items-center px-2 pb-2 mt-2">
            
            {/* Left Actions */}
            <div className="flex gap-2">
              {value && (
                <button 
                  onClick={() => onChange('')}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Clear text"
                >
                  <Eraser size={18} />
                </button>
              )}
            </div>

            {/* Right Actions (Main Call to Actions) */}
            <div className="flex gap-2 items-center">
              
              <button 
                onClick={handlePaste}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Paste from clipboard"
              >
                <ClipboardPaste size={20} />
              </button>

              {/* AI Extraction Button */}
              {looksLikeMessyText && (
                <button
                  onClick={onAiExtract}
                  disabled={isAiLoading}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                    ${isAiLoading 
                      ? 'bg-purple-100 text-purple-400 cursor-not-allowed' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}
                  `}
                >
                  {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  {isAiLoading ? 'Extracting...' : 'Magic Extract'}
                </button>
              )}

              {/* Start Chat Button */}
              <button
                onClick={onSubmit}
                disabled={!isValidish}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all
                  ${isValidish 
                    ? 'bg-[#25D366] hover:bg-[#20bd5a] hover:shadow-lg transform hover:-translate-y-0.5' 
                    : 'bg-gray-300 cursor-not-allowed'}
                `}
              >
                <span>Start Chat</span>
                <Send size={16} className={isValidish ? "ml-1" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="mt-3 flex justify-between text-xs text-gray-400 px-2">
         <span>
           {countryCode ? `Prefix +${countryCode} applied` : "Auto-detecting country"}
         </span>
         {cleanNumber.length > 0 && <span>{cleanNumber.length} digits</span>}
      </div>
    </div>
  );
};

export default NumberInput;
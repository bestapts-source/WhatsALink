import React, { useState, useEffect } from 'react';
import { Send, Wand2, Eraser, Globe, ClipboardPaste } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { COUNTRY_OPTIONS, detectCountry } from '../utils/phoneUtils';

interface NumberInputProps {
  value: string;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onExtract: () => void;
  onPasteError?: (msg: string) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({ 
  value, 
  countryCode,
  onCountryCodeChange,
  onChange, 
  onSubmit, 
  onExtract,
  onPasteError
}) => {
  const [cleanNumber, setCleanNumber] = useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Strip non-digits for visual validation preview
  useEffect(() => {
    setCleanNumber(value.replace(/\D/g, ''));
  }, [value]);

  const isValidish = cleanNumber.length >= 5; // Basic validation
  const looksLikeMessyText = value.length > 20 || (value.includes(' ') && value.length > 10 && !value.startsWith('+'));
  
  const detected = countryCode === '' ? detectCountry(value) : undefined;
  const detectedOption = detected ? COUNTRY_OPTIONS.find(c => c.code === detected) : undefined;
  const selectedOption = COUNTRY_OPTIONS.find(c => c.code === countryCode);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent newline in textarea
      if (isValidish) onSubmit();
      else if (looksLikeMessyText) onExtract();
    }
  };

  const handlePaste = async () => {
    try {
      let text = '';
      if (Capacitor.isNativePlatform()) {
        const { value } = await Clipboard.read();
        text = value ?? '';
      } else {
        text = await navigator.clipboard.readText();
      }
      
      if (text) {
        onChange(text);
      } else {
        if (onPasteError) onPasteError("Clipboard is empty");
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      // Automatically focus the text box so the keyboard pops up and they can paste immediately
      textareaRef.current?.focus();
      if (onPasteError) {
        onPasteError("Clipboard is locked. Tap and hold inside the box to Paste manually!");
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
               <option value="">Auto / International</option>
               {COUNTRY_OPTIONS.map(c => (
                 <option key={c.code} value={c.code}>
                   {c.flag} {c.name} (+{c.dial})
                 </option>
               ))}
             </select>
             {detectedOption && (
               <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full whitespace-nowrap font-medium">
                 {detectedOption.name}
               </span>
             )}
          </div>

          <div className="cursor-text" onClick={() => textareaRef.current?.focus()}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste number here..."
              className="w-full bg-transparent p-4 text-gray-800 placeholder-gray-400 focus:outline-none text-xl sm:text-2xl font-normal resize-none"
              rows={looksLikeMessyText ? 3 : 1}
              style={{ minHeight: '60px' }}
            />
          </div>
          
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
            <div className="flex gap-1 items-center">
              
              <button 
                onClick={handlePaste}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Paste from clipboard"
              >
                <ClipboardPaste size={20} />
              </button>

              {/* Extract number from messy text */}
              {looksLikeMessyText && (
                <button
                  onClick={onExtract}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all bg-purple-100 text-purple-700 hover:bg-purple-200"
                >
                  <Wand2 size={16} />
                  Extract
                </button>
              )}

              {/* Start Chat Button */}
              <button
                onClick={onSubmit}
                disabled={!isValidish}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-white shadow-md whitespace-nowrap transition-all
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
           {selectedOption ? `Prefix +${selectedOption.dial} applied` : "Auto-detecting country"}
         </span>
         {cleanNumber.length > 0 && <span>{cleanNumber.length} digits</span>}
      </div>
    </div>
  );
};

export default NumberInput;
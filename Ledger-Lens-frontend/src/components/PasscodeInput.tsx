import { useRef, useState, KeyboardEvent, ChangeEvent, useEffect } from 'react';

interface PasscodeInputProps {
  length?: number;
  onComplete: (passcode: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function PasscodeInput({ 
  length = 6, 
  onComplete, 
  error,
  disabled = false 
}: PasscodeInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus last input when error occurs
  useEffect(() => {
    if (error) {
      const lastIndex = length - 1;
      const lastFilledIndex = values.findLastIndex(v => v !== '');
      const focusIndex = lastFilledIndex >= 0 ? lastFilledIndex : lastIndex;
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
      }, 0);
    }
  }, [error, length, values]);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;
    
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);

    // Auto-advance to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all inputs are filled
    if (newValues.every(v => v !== '') && newValues.join('').length === length) {
      onComplete(newValues.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Handle backspace
    if (e.key === 'Backspace') {
      if (values[index]) {
        // If current field has value, clear it
        const newValues = [...values];
        newValues[index] = '';
        setValues(newValues);
      } else if (index > 0) {
        // If current field is empty, go to previous and clear it
        const newValues = [...values];
        newValues[index - 1] = '';
        setValues(newValues);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    
    if (/^\d+$/.test(pastedData)) {
      const newValues = pastedData.split('').concat(Array(length - pastedData.length).fill(''));
      setValues(newValues);
      
      // Focus last filled input or first empty
      const lastFilledIndex = Math.min(pastedData.length - 1, length - 1);
      inputRefs.current[lastFilledIndex]?.focus();
      
      if (pastedData.length === length) {
        onComplete(pastedData);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={values[index]}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-14 h-14 text-center text-2xl font-bold
              border-2 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-blue-500
              transition-all duration-200
              ${error 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 bg-white hover:border-blue-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
            `}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}


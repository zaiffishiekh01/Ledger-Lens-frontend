import { useState, useEffect } from 'react';
import PasscodeInput from './PasscodeInput';
import ResetPasscodeModal from './ResetPasscodeModal';
import logo from '../assets/logo.png';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  useEffect(() => {
    // Check lockout status on mount
    const checkLockout = () => {
      if (lockoutUntil) {
        const now = new Date();
        if (now >= lockoutUntil) {
          setLockoutUntil(null);
        }
      }
    };
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handlePasscodeComplete = async (code: string) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pdf/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ passcode: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Extract lockout time from error message
          const match = data.error?.match(/(\d+)\s+minutes/);
          if (match) {
            const minutes = parseInt(match[1]);
            const until = new Date(Date.now() + minutes * 60 * 1000);
            setLockoutUntil(until);
          }
        } else if (data.error?.includes('attempts remaining')) {
          // Extract remaining attempts
          const match = data.error?.match(/(\d+)\s+attempts/);
          if (match) {
            setRemainingAttempts(parseInt(match[1]));
          }
        }
        setError(data.error || 'Invalid passcode');
        setLoading(false);
        return;
      }

      // Success
      onLoginSuccess();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = () => {
    if (!lockoutUntil) return null;
    const now = new Date();
    if (now >= lockoutUntil) {
      setLockoutUntil(null);
      return null;
    }
    const diff = Math.ceil((lockoutUntil.getTime() - now.getTime()) / 1000 / 60);
    return diff;
  };

  const remainingMinutes = getRemainingTime();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src={logo} alt="LedgerLens Logo" className="h-20 w-auto" />
              <h1 className="text-4xl font-bold text-gray-900">LedgerLens</h1>
            </div>
            <p className="text-lg text-gray-600">Enter your passcode to continue</p>
          </div>

          {remainingMinutes && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800 font-medium text-center">
                Too many failed attempts. Please wait {remainingMinutes} minutes.
              </p>
            </div>
          )}

          {remainingAttempts !== null && remainingAttempts > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 font-medium text-center">
                {remainingAttempts} attempts remaining
              </p>
            </div>
          )}

          <div className="mb-6">
            <PasscodeInput
              onComplete={handlePasscodeComplete}
              error={error}
              disabled={loading || !!remainingMinutes}
            />
          </div>

          {error && !remainingMinutes && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 text-center">{error}</p>
            </div>
          )}

          <div className="text-center mt-6">
            <button
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Forgot Passcode?
            </button>
          </div>
        </div>
      </div>

      <ResetPasscodeModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSuccess={() => {
          setError('');
          setRemainingAttempts(null);
        }}
      />
    </div>
  );
}


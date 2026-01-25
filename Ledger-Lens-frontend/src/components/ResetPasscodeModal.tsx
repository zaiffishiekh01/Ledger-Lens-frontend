import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

interface ResetPasscodeModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: () => void;
}

export default function ResetPasscodeModal({ isOpen, onClose, onSuccess }: ResetPasscodeModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  // Check lockout status from backend on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      const checkBackendLockout = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pdf/auth/status/`, {
            credentials: 'include',
          });
          const data = await response.json();
          if (data.creds_locked && data.creds_lockout_minutes) {
            const until = new Date(Date.now() + data.creds_lockout_minutes * 60 * 1000);
            setLockoutUntil(until);
          }
        } catch (err) {
          // Ignore errors
        }
      };
      checkBackendLockout();
    }
  }, [isOpen]);

  // Update lockout countdown
  useEffect(() => {
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    if (newPasscode.length !== 6 || !/^\d+$/.test(newPasscode)) {
      setError('New passcode must be exactly 6 digits');
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setError('Passcodes do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pdf/auth/reset-passcode/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
          new_passcode: newPasscode,
          confirm_passcode: confirmPasscode,
        }),
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
        }
        setError(data.error || 'Failed to reset passcode');
        setLoading(false);
        return;
      }

      // Success
      setUsername('');
      setPassword('');
      setNewPasscode('');
      setConfirmPasscode('');
      onSuccess();
      if (onClose) {
        onClose();
      }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reset Passcode</h2>

        {remainingMinutes && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Too many failed attempts. Please wait {remainingMinutes} minutes.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || !!remainingMinutes}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !!remainingMinutes}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Passcode (6 digits)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={newPasscode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setNewPasscode(val);
              }}
              disabled={loading || !!remainingMinutes}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-center text-2xl font-bold tracking-widest"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Passcode
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={confirmPasscode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setConfirmPasscode(val);
              }}
              disabled={loading || !!remainingMinutes}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-center text-2xl font-bold tracking-widest"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!remainingMinutes}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Passcode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import ResetPasscodeModal from './ResetPasscodeModal';
import logo from '../assets/logo.png';

interface SetupPasscodePageProps {
  onSetupSuccess: () => void;
}

export default function SetupPasscodePage({ onSetupSuccess }: SetupPasscodePageProps) {
  const [showSetupModal, setShowSetupModal] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src={logo} alt="LedgerLens Logo" className="h-20 w-auto" />
              <h1 className="text-4xl font-bold text-gray-900">LedgerLens</h1>
            </div>
            <div className="flex items-center justify-center mb-4">
              <KeyRound className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-lg text-gray-600">
              Set up your 6-digit passcode to get started
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 text-center">
              Use your admin credentials to create your first passcode
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowSetupModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <KeyRound className="w-5 h-5" />
              Set Up Passcode
            </button>
          </div>
        </div>
      </div>

      <ResetPasscodeModal
        isOpen={showSetupModal}
        onSuccess={() => {
          onSetupSuccess();
        }}
      />
    </div>
  );
}


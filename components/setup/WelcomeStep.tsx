import React from 'react';
import { SetupMode } from '../../types';
import { Zap, FileCode, ArrowRight, Check } from 'lucide-react';

interface WelcomeStepProps {
  mode: SetupMode | null;
  onModeSelect: (mode: SetupMode) => void;
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ mode, onModeSelect, onNext }) => {
  return (
    <div className="text-center animate-in fade-in duration-500">
      {/* Logo */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6">
          <span className="text-3xl font-bold text-white">s8</span>
        </div>
        <h1 className="text-3xl font-bold text-textMain mb-2">Welcome to s8vr</h1>
        <p className="text-textMuted">
          Let's set up your personal invoicing system
        </p>
      </div>

      {/* Mode selection */}
      <div className="space-y-4 mb-8">
        <button
          onClick={() => onModeSelect('guided')}
          className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
            mode === 'guided'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-border hover:border-emerald-500/50 bg-surface'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              mode === 'guided' ? 'bg-emerald-500/20' : 'bg-surfaceHighlight'
            }`}>
              <Zap className={`w-6 h-6 ${
                mode === 'guided' ? 'text-emerald-500' : 'text-textMuted'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-textMain">Guided Setup</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-500 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-textMuted">
                I'll help you configure everything step by step. Just have your Supabase, Stripe, and Resend credentials ready.
              </p>
            </div>
            {mode === 'guided' && (
              <Check className="w-5 h-5 text-emerald-500 mt-1" />
            )}
          </div>
        </button>

        <button
          onClick={() => onModeSelect('manual')}
          className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
            mode === 'manual'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-border hover:border-emerald-500/50 bg-surface'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              mode === 'manual' ? 'bg-emerald-500/20' : 'bg-surfaceHighlight'
            }`}>
              <FileCode className={`w-6 h-6 ${
                mode === 'manual' ? 'text-emerald-500' : 'text-textMuted'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-textMain">Manual Setup</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-zinc-500/20 text-zinc-400 rounded-full">
                  Advanced
                </span>
              </div>
              <p className="text-sm text-textMuted">
                I already created my <code className="px-1.5 py-0.5 bg-surfaceHighlight rounded text-xs">.env</code> file with all the credentials.
              </p>
            </div>
            {mode === 'manual' && (
              <Check className="w-5 h-5 text-emerald-500 mt-1" />
            )}
          </div>
        </button>
      </div>

      {/* Continue button */}
      <button
        onClick={onNext}
        disabled={!mode}
        className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
          mode
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
            : 'bg-border text-textMuted cursor-not-allowed'
        }`}
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Requirements hint */}
      <div className="mt-8 p-4 rounded-xl bg-surface border border-border">
        <h4 className="text-sm font-medium text-textMain mb-2">You'll need:</h4>
        <ul className="text-sm text-textMuted space-y-1">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Supabase project (URL, anon key, service key)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Stripe account (secret key, webhook secret)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Resend account (API key)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WelcomeStep;

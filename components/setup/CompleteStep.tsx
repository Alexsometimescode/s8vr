import React from 'react';
import { CheckCircle, RefreshCw, ExternalLink, FileText, CreditCard, Mail } from 'lucide-react';

interface CompleteStepProps {
  onRestart: () => void;
}

export const CompleteStep: React.FC<CompleteStepProps> = ({ onRestart }) => {
  return (
    <div className="animate-in fade-in duration-500 text-center">
      {/* Success icon */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold text-textMain mb-2">Setup Complete!</h2>
        <p className="text-textMuted">
          Your s8vr instance is ready to use
        </p>
      </div>

      {/* What's configured */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-8 text-left">
        <h3 className="font-semibold text-textMain mb-4">What's been configured:</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMain">Database</p>
              <p className="text-xs text-textMuted">Tables and schema created in Supabase</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMain">Payments</p>
              <p className="text-xs text-textMuted">Stripe integration configured</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMain">Emails</p>
              <p className="text-xs text-textMuted">Resend API connected for invoice emails</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-8 text-left">
        <h3 className="font-semibold text-textMain mb-4">Next steps:</h3>
        <ol className="space-y-2 text-sm text-textMuted">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <span>Restart the app to apply your configuration</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <span>Log in with the account you just created</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <span>Connect your Stripe account to receive payments</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
            <span>Create your first invoice!</span>
          </li>
        </ol>
      </div>

      {/* Important note */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8 text-left">
        <p className="text-sm text-yellow-500">
          <strong>Important:</strong> Your <code className="px-1.5 py-0.5 bg-yellow-500/20 rounded text-xs">.env</code> file
          has been created with your credentials. Keep this file secure and never commit it to version control.
        </p>
      </div>

      {/* Restart button */}
      <button
        onClick={onRestart}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-all"
      >
        <RefreshCw className="w-5 h-5" />
        Restart & Login
      </button>

      {/* Help links */}
      <div className="mt-8 flex items-center justify-center gap-6 text-sm">
        <a
          href="https://github.com/Alexsometimescode/s8vr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-textMuted hover:text-emerald-500 flex items-center gap-1"
        >
          Documentation <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href="https://github.com/Alexsometimescode/s8vr/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-textMuted hover:text-emerald-500 flex items-center gap-1"
        >
          Report Issue <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default CompleteStep;

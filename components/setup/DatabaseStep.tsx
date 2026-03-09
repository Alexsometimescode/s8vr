import React, { useEffect } from 'react';
import { Database, ArrowRight, ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';

interface DatabaseStepProps {
  isPushing: boolean;
  result: {
    success: boolean;
    tables: string[];
    error?: string;
  } | null;
  onPushSchema: () => Promise<void>;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
}

export const DatabaseStep: React.FC<DatabaseStepProps> = ({
  isPushing,
  result,
  onPushSchema,
  onNext,
  onBack,
  error,
}) => {
  // Auto-start schema push when step loads
  useEffect(() => {
    if (!result && !isPushing) {
      onPushSchema();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tables = [
    { name: 'users', description: 'Your account data' },
    { name: 'clients', description: 'Client information' },
    { name: 'invoices', description: 'Invoice records' },
    { name: 'invoice_items', description: 'Line items for invoices' },
    { name: 'templates', description: 'Invoice templates' },
    { name: 'email_logs', description: 'Email history' },
    { name: 'app_config', description: 'App settings' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
          <Database className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-textMain mb-2">Setting Up Database</h2>
        <p className="text-textMuted">
          Creating tables and configuring your Supabase database
        </p>
      </div>

      {/* Table list */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="space-y-3">
          {tables.map((table, index) => {
            const isCreated = result?.tables?.includes(table.name);
            const isCreating = isPushing && !result;

            return (
              <div
                key={table.name}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  isCreated
                    ? 'bg-emerald-500/10'
                    : isCreating
                    ? 'bg-surface'
                    : 'bg-surfaceHighlight'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isCreated
                        ? 'bg-emerald-500/20'
                        : 'bg-border'
                    }`}
                  >
                    {isCreated ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : isCreating ? (
                      <Loader2 className="w-4 h-4 text-textMuted animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-textMuted" />
                    )}
                  </div>
                  <div>
                    <code className="text-sm font-medium text-textMain">{table.name}</code>
                    <p className="text-xs text-textMuted">{table.description}</p>
                  </div>
                </div>
                {isCreated && (
                  <span className="text-xs text-emerald-500 font-medium">Created</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status message */}
      {isPushing && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-blue-400 text-sm">Setting up database schema...</span>
        </div>
      )}

      {result?.success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-400 text-sm">Database setup complete!</span>
        </div>
      )}

      {(error || result?.error) && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400 text-sm">{error || result?.error}</span>
          </div>
          <button
            onClick={onPushSchema}
            disabled={isPushing}
            className="text-sm px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isPushing}
          className="flex items-center gap-2 px-4 py-2 text-textMuted hover:text-textMain transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!result?.success}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            result?.success
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-border text-textMuted cursor-not-allowed'
          }`}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DatabaseStep;

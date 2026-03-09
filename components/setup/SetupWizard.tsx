import React, { useState } from 'react';
import { SetupState, SetupStep, SetupWizardProps } from '../../types';
import { testAllConnections, pushSchema, createAccount, writeConfig } from '../../src/lib/setupApi';
import { WelcomeStep } from './WelcomeStep';
import { CredentialsStep } from './CredentialsStep';
import { DatabaseStep } from './DatabaseStep';
import { AccountStep } from './AccountStep';
import { CompleteStep } from './CompleteStep';

const initialState: SetupState = {
  currentStep: 'welcome',
  mode: null,
  credentials: {
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    resendApiKey: '',
    frontendUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  },
  account: {
    name: '',
    email: '',
    password: '',
    businessName: '',
  },
  isTestingConnections: false,
  isPushingSchema: false,
  isCreatingAccount: false,
  connectionResults: {
    supabase: null,
    stripe: null,
    resend: null,
  },
  schemaResult: null,
  error: null,
};

const STEPS: SetupStep[] = ['welcome', 'credentials', 'database', 'account', 'complete'];

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [state, setState] = useState<SetupState>(initialState);

  const currentStepIndex = STEPS.indexOf(state.currentStep);
  const progress = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  const goToStep = (step: SetupStep) => {
    setState(prev => ({ ...prev, currentStep: step, error: null }));
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      goToStep(STEPS[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(STEPS[prevIndex]);
    }
  };

  const updateCredentials = (updates: Partial<SetupState['credentials']>) => {
    setState(prev => ({
      ...prev,
      credentials: { ...prev.credentials, ...updates },
    }));
  };

  const updateAccount = (updates: Partial<SetupState['account']>) => {
    setState(prev => ({
      ...prev,
      account: { ...prev.account, ...updates },
    }));
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 'welcome':
        return (
          <WelcomeStep
            mode={state.mode}
            onModeSelect={(mode) => setState(prev => ({ ...prev, mode }))}
            onNext={nextStep}
          />
        );
      case 'credentials':
        return (
          <CredentialsStep
            credentials={state.credentials}
            onChange={updateCredentials}
            connectionResults={state.connectionResults}
            isTestingConnections={state.isTestingConnections}
            onTestConnections={async () => {
              setState(prev => ({ ...prev, isTestingConnections: true, error: null }));

              try {
                const result = await testAllConnections(state.credentials);

                setState(prev => ({
                  ...prev,
                  isTestingConnections: false,
                  connectionResults: {
                    supabase: result.results.supabase.success,
                    stripe: result.results.stripe.success,
                    resend: result.results.resend.success,
                  },
                  error: result.success
                    ? null
                    : 'Some connections failed. Check the indicators above.',
                }));
              } catch (error: any) {
                setState(prev => ({
                  ...prev,
                  isTestingConnections: false,
                  error: error.message || 'Failed to test connections. Is the backend running?',
                }));
              }
            }}
            onNext={nextStep}
            onBack={prevStep}
            error={state.error}
          />
        );
      case 'database':
        return (
          <DatabaseStep
            isPushing={state.isPushingSchema}
            result={state.schemaResult}
            onPushSchema={async () => {
              setState(prev => ({ ...prev, isPushingSchema: true, error: null }));

              try {
                const result = await pushSchema(
                  state.credentials.supabaseUrl,
                  state.credentials.supabaseServiceKey
                );

                setState(prev => ({
                  ...prev,
                  isPushingSchema: false,
                  schemaResult: {
                    success: result.success,
                    tables: result.tables,
                    error: result.error,
                  },
                  error: result.success ? null : result.error || 'Failed to push schema',
                }));
              } catch (error: any) {
                setState(prev => ({
                  ...prev,
                  isPushingSchema: false,
                  schemaResult: {
                    success: false,
                    tables: [],
                    error: error.message,
                  },
                  error: error.message || 'Failed to push schema. Is the backend running?',
                }));
              }
            }}
            onNext={nextStep}
            onBack={prevStep}
            error={state.error}
          />
        );
      case 'account':
        return (
          <AccountStep
            account={state.account}
            onChange={updateAccount}
            isCreating={state.isCreatingAccount}
            onCreateAccount={async () => {
              setState(prev => ({ ...prev, isCreatingAccount: true, error: null }));

              try {
                // Step 1: Create the owner account
                const accountResult = await createAccount(
                  state.credentials.supabaseUrl,
                  state.credentials.supabaseServiceKey,
                  {
                    name: state.account.name,
                    email: state.account.email,
                    password: state.account.password,
                    businessName: state.account.businessName,
                  }
                );

                if (!accountResult.success) {
                  setState(prev => ({
                    ...prev,
                    isCreatingAccount: false,
                    error: accountResult.error || 'Failed to create account',
                  }));
                  return;
                }

                // Step 2: Write configuration to .env files
                const configResult = await writeConfig(state.credentials);

                if (!configResult.success) {
                  setState(prev => ({
                    ...prev,
                    isCreatingAccount: false,
                    error: configResult.error || 'Account created but failed to write configuration',
                  }));
                  return;
                }

                // Success - move to complete step
                setState(prev => ({ ...prev, isCreatingAccount: false }));
                nextStep();
              } catch (error: any) {
                setState(prev => ({
                  ...prev,
                  isCreatingAccount: false,
                  error: error.message || 'Failed to create account. Is the backend running?',
                }));
              }
            }}
            onBack={prevStep}
            error={state.error}
          />
        );
      case 'complete':
        return (
          <CompleteStep
            onRestart={onComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      {state.currentStep !== 'welcome' && state.currentStep !== 'complete' && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-border z-50">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          {renderStep()}
        </div>
      </div>

      {/* Step indicator */}
      {state.currentStep !== 'welcome' && state.currentStep !== 'complete' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2">
            {STEPS.filter(s => s !== 'welcome' && s !== 'complete').map((step, idx) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  STEPS.indexOf(step) <= currentStepIndex
                    ? 'bg-emerald-500'
                    : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupWizard;

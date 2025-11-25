import React from 'react';
import { Navbar, Section, Button, Badge, LogoIcon } from './ui/Shared';
import { Check, CheckCircle2, ChevronDown, ChevronUp, Bell, CreditCard, Clock, Zap } from 'lucide-react';
import { InvoicePreviewCard } from './app/InvoiceBuilder';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="pt-16">
      <Navbar onAction={onLogin} />
      
      {/* Hero Section */}
      <Section className="text-center pt-32 pb-16">
        <Badge color="gray">The Client Experience</Badge>
        <h1 className="mt-8 text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Designed for <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
            pure simplicity.
          </span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
          The invoicing tool that respects your time, your wallet, and your relationships. No fluff, just collected payments.
        </p>
        
        {/* Hero Visual - Payment Success Modal Mockup */}
        <div className="relative mt-12 mx-auto max-w-3xl">
          <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none opacity-50" />
          <div className="relative bg-[#0A0A0A] border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden group hover:border-zinc-700 transition-all duration-500">
             
             {/* Background Elements to look like app */}
             <div className="absolute top-0 left-0 right-0 h-full opacity-30 pointer-events-none">
                <div className="p-8 space-y-6">
                    <div className="h-8 w-1/3 bg-zinc-800 rounded-lg"></div>
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-zinc-800 rounded"></div>
                        <div className="h-4 w-2/3 bg-zinc-800 rounded"></div>
                    </div>
                </div>
             </div>

             {/* The Payment Modal from Screenshot 2 */}
             <div className="relative z-10 bg-[#111] border border-zinc-800 rounded-2xl p-10 max-w-sm mx-auto text-center shadow-xl">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Payment Received</h3>
                <p className="text-zinc-400">Transfer initiated to your bank.</p>
             </div>
          </div>
        </div>
      </Section>

      {/* Polite Nudges Feature */}
      <Section id="features" className="bg-zinc-950/50">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Polite Nudges</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
                Automated follow-ups that sound like you, not a robot. s8vr sends gentle reminders so you don't have to have the awkward conversations.
            </p>
        </div>
        
        <div className="max-w-2xl mx-auto bg-[#0A0A0A] border border-zinc-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
             {/* Email UI Mockup */}
             <div className="bg-white text-zinc-900 rounded-2xl p-8 shadow-xl max-w-lg mx-auto relative z-10">
                <div className="flex items-start justify-between mb-8 border-b border-zinc-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="font-bold text-lg">Friendly Reminder</div>
                            <div className="text-zinc-500 text-sm">to alex@example.com</div>
                        </div>
                    </div>
                    <span className="text-zinc-400 text-sm">10:42 AM</span>
                </div>
                <div className="space-y-4 text-zinc-600 mb-8">
                    <p>Hi Alex,</p>
                    <p>Hope you're well! Just a friendly reminder that this invoice is due today.</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-6 text-center border border-zinc-100 mb-6">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Amount Due</div>
                    <div className="text-3xl font-bold text-zinc-900 mb-2">$2,400.00</div>
                    <div className="inline-block px-2 py-1 bg-white border border-zinc-200 rounded text-xs text-zinc-500">Invoice #1001</div>
                </div>
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors">
                    Pay Invoice
                </button>
             </div>
        </div>
      </Section>

      {/* Stripe Feature */}
      <Section className="">
        <div className="max-w-5xl mx-auto bg-[#0A0A0A] border border-zinc-800 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
             {/* Purple glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
             
             <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">
                Get paid instantly with <span className="text-indigo-500">Stripe</span>. Every time.
             </h2>
             <p className="text-zinc-400 max-w-2xl mx-auto mb-16 relative z-10">
                One-click payments powered by Stripe. No invoices lost in email. No waiting for bank transfers. Just instant, secure payments.
             </p>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
                {/* Step 1 */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">The Client</div>
                    <div className="w-full bg-zinc-800 rounded-lg p-4 mb-4 opacity-50">
                        <div className="h-2 w-12 bg-zinc-700 rounded mb-2 mx-auto"></div>
                    </div>
                    <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium w-full shadow-[0_0_15px_rgba(79,70,229,0.4)]">Pay Invoice</button>
                    <p className="mt-4 text-sm text-zinc-400">Clicks "Pay Now"</p>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex justify-center text-zinc-600">
                    <CreditCard className="w-8 h-8" />
                </div>

                {/* Step 3 */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">You</div>
                    <div className="bg-black border border-zinc-800 rounded-xl p-4 w-full flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white">S</div>
                        <div className="text-left flex-1">
                            <div className="text-xs text-white font-bold">Stripe</div>
                            <div className="text-[10px] text-zinc-400">Payment received</div>
                        </div>
                        <div className="text-[10px] text-zinc-500">2m ago</div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Deposited to your bank
                    </div>
                </div>
             </div>
        </div>
      </Section>

      {/* Why s8vr? Grid */}
      <Section id="manifesto">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why s8vr?</h2>
            <p className="text-zinc-400">The invoicing tool that respects your time, your wallet, and your relationships.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
                title="No fluff" 
                desc="We cut every feature freelancers never use. No payroll. No CRM. Just invoices, payments, and reminders."
                visual={
                    <div className="relative h-32 w-full bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                        <div className="space-y-3 opacity-30">
                            <div className="flex justify-between text-xs"><div className="w-12 h-2 bg-zinc-600 rounded"></div><div className="w-2 h-2 rounded-full bg-zinc-700"></div></div>
                            <div className="flex justify-between text-xs"><div className="w-16 h-2 bg-zinc-600 rounded"></div><div className="w-2 h-2 rounded-full bg-zinc-700"></div></div>
                            <div className="flex justify-between text-xs"><div className="w-10 h-2 bg-zinc-600 rounded"></div><div className="w-2 h-2 rounded-full bg-zinc-700"></div></div>
                        </div>
                        <div className="absolute inset-x-4 top-12 bottom-4 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-500 text-sm font-medium">
                            Invoices <Check className="w-3 h-3 ml-2"/>
                        </div>
                    </div>
                }
            />
            <FeatureCard 
                title="$9, not $50" 
                desc="Most tools charge $30-50/month for features you'll never touch. We charge $9 for everything you actually need."
                visual={
                    <div className="flex items-end justify-center h-32 gap-4 pb-4 px-4">
                        <div className="w-12 h-full bg-zinc-700 rounded-t-lg relative group">
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-zinc-500">$50</span>
                        </div>
                        <div className="w-12 h-1/4 bg-emerald-500 rounded-t-lg relative shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-emerald-400 font-bold">$9</span>
                        </div>
                    </div>
                }
            />
            <FeatureCard 
                title="Written by humans" 
                desc="Automated reminders shouldn't make you cringe. Ours are written by humans, for humans. Professional, friendly, never desperate."
                visual={
                    <div className="bg-zinc-800/30 border border-zinc-800 p-4 rounded-lg h-32 flex flex-col justify-center">
                         <div className="text-xs text-zinc-500 mb-2">To: Alex (Client)</div>
                         <div className="font-mono text-xs text-zinc-300">
                            Hi Alex, just a quick reminder on Invoice #1023.
                         </div>
                    </div>
                }
            />
        </div>
      </Section>

       {/* Design that Sells Section */}
       <Section>
        <div className="bg-[#0A0A0A] border border-zinc-800 rounded-[2.5rem] p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Design that sells.</h2>
            <p className="text-zinc-400 mb-12 max-w-xl mx-auto">Create invoices that look as good as your work. Maintain your personal brand with minimalist layouts.</p>
            
            <div className="max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-500">
                <InvoicePreviewCard 
                    data={{
                        id: 'demo',
                        invoiceNumber: '002491',
                        clientName: 'Acme Design',
                        clientEmail: 'billing@acme.com',
                        items: [
                            { id: '1', description: 'Brand Identity System', amount: 3000 },
                            { id: '2', description: 'Webflow Development', amount: 1250 }
                        ],
                        status: 'pending',
                        issueDate: '2023-10-01',
                        dueDate: '2023-10-15',
                        amount: 4250,
                        remindersEnabled: true
                    }}
                    minimal
                />
            </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple pricing. No surprises.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-900/20">
                <div className="inline-block px-3 py-1 bg-zinc-800 rounded-full text-xs font-medium text-zinc-400 mb-6">Try it free</div>
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold mb-4">$0<span className="text-lg text-zinc-500 font-normal">/month</span></div>
                <p className="text-zinc-400 mb-8">Perfect to get started</p>
                <ul className="space-y-4 mb-8">
                    <CheckItem>5 invoices per month</CheckItem>
                    <CheckItem>All features included</CheckItem>
                    <CheckItem>Stripe payments</CheckItem>
                    <CheckItem>Automated reminders</CheckItem>
                    <CheckItem>s8vr branding on invoices</CheckItem>
                </ul>
                <Button variant="outline" className="w-full" onClick={onLogin}>Start Free</Button>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-3xl border border-emerald-900/30 bg-zinc-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-black text-xs font-bold px-4 py-1 rounded-bl-xl">Most Popular</div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400 mb-6">
                    <Zap className="w-3 h-3" /> Early Access Special
                </div>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-zinc-500 line-through text-xl">~$12~</span>
                    <span className="text-4xl font-bold">$9</span>
                    <span className="text-lg text-zinc-500">/month</span>
                </div>
                <p className="text-zinc-500 text-sm mb-4">*for early members</p>
                <p className="text-zinc-400 mb-8">Unlimited invoicing, unlimited revenue</p>
                <ul className="space-y-4 mb-8">
                    <CheckItem highlight>Unlimited invoices</CheckItem>
                    <CheckItem highlight>Unlimited automated reminders</CheckItem>
                    <CheckItem highlight>Remove s8vr branding</CheckItem>
                    <CheckItem highlight>Custom invoice templates</CheckItem>
                    <CheckItem highlight>Priority support</CheckItem>
                </ul>
                
                <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 mb-6">
                    <p className="text-xs text-emerald-200">
                        🎁 <span className="font-bold text-white">Early Access Bonus:</span> First 100 members get their first month free + lock in $9/month forever.
                    </p>
                </div>

                <Button variant="primary" className="w-full" onClick={onLogin}>Join Waitlist</Button>
            </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
         <h2 className="text-3xl font-bold text-center mb-12">Questions?</h2>
         <div className="max-w-2xl mx-auto space-y-4">
            <FAQItem question="Will this annoy my clients?">
                No. Reminders are polite, professional, and spaced appropriately. Clients actually appreciate them - they genuinely forget sometimes.
            </FAQItem>
            <FAQItem question="How is this different from other invoice tools?">
                Most tools are bloated CRMs. We focus purely on getting you paid with minimal friction.
            </FAQItem>
            <FAQItem question="What if I don't need reminders for every client?">
                You can toggle reminders on or off for each individual invoice.
            </FAQItem>
         </div>
      </Section>

      <footer className="py-12 border-t border-zinc-900 text-center text-zinc-600 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <LogoIcon className="w-4 h-4" />
                <span>s8vr Inc. © 2025</span>
            </div>
            <div className="flex gap-6">
                <a href="#" className="hover:text-zinc-400">X (@s8vrapp)</a>
                <a href="#" className="hover:text-zinc-400">Privacy</a>
                <a href="#" className="hover:text-zinc-400">Terms</a>
            </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ title: string; desc: string; visual: React.ReactNode }> = ({ title, desc, visual }) => (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
        <div className="mb-8">{visual}</div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const CheckItem: React.FC<{ children: React.ReactNode; highlight?: boolean }> = ({ children, highlight }) => (
    <li className="flex items-start gap-3 text-sm">
        <div className={`mt-0.5 rounded-full p-0.5 ${highlight ? 'bg-emerald-500 text-black' : 'text-zinc-500'}`}>
            <Check className="w-3 h-3" />
        </div>
        <span className={highlight ? 'text-white font-medium' : 'text-zinc-300'}>{children}</span>
    </li>
);

const FAQItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className="border border-zinc-800 rounded-2xl bg-zinc-900/20 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-900/40 transition-colors"
            >
                <span className="font-bold text-lg">{question}</span>
                {isOpen ? <ChevronUp className="text-zinc-500"/> : <ChevronDown className="text-zinc-500"/>}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 text-zinc-400 leading-relaxed">
                    {children}
                </div>
            )}
        </div>
    );
};

export default LandingPage;
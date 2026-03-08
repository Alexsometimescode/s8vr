import React, { useState } from 'react';
import { Navbar, Section, Button, Badge, LogoIcon } from './ui/Shared';
import { Check, CheckCircle2, ChevronDown, ChevronUp, Bell, CreditCard, Zap, FileText, Users, BarChart3, Mail, Palette, Shield, TrendingUp, Settings, ArrowRight, ArrowUpRight, FileText as FileIcon, RefreshCw, BookOpen, Share2, Plus, LayoutGrid, Copy, CheckCheck, Github, Server, Code2 } from 'lucide-react';
import { InvoicePreviewCard } from './app/InvoiceBuilder';
import { Modal } from './ui/Modal';

const GITHUB_REPO = 'https://github.com/s8vr/s8vr';

const LandingPage: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);

  return (
    <div>
      <Navbar githubUrl={GITHUB_REPO} />
      
      {/* Hero Section */}
      <Section className="text-center pt-32 pb-16 relative overflow-hidden -mt-16 pt-48">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-sm font-medium border bg-zinc-800 text-white border-zinc-700">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
          <span>Open Source • MIT License</span>
        </div>
        <h1 className="mt-8 text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Get paid faster with <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
            automated reminders.
          </span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
          Professional invoices, instant Stripe payments, and polite automated follow-ups. Everything you need to get paid, nothing you don't.
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button variant="primary" size="lg" onClick={() => window.open(GITHUB_REPO, '_blank')} icon={<Github className="w-5 h-5" />}>
            View on GitHub
          </Button>
          <Button variant="outline" size="lg" onClick={() => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            See Features
          </Button>
        </div>

        {/* Quick Install */}
        <HeroInstallTabs />
        
        {/* Hero Visual - Dashboard Preview */}
        <div className="relative mt-24 mx-auto max-w-[1400px]">
          <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none opacity-50" />
          {/* Safari Browser Frame */}
          <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-700/50 shadow-2xl overflow-hidden min-h-[700px]">
            {/* Browser Chrome */}
            <div className="bg-zinc-800/80 border-b border-zinc-700/50 px-4 py-3 flex items-center gap-3">
              {/* Traffic Lights */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              {/* Address Bar */}
              <div className="flex-1 bg-zinc-900/50 rounded-full px-4 py-1.5 border border-zinc-700/30 flex items-center gap-2.5">
                <FileIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <div className="flex-1 text-xs text-white font-medium truncate">s8vr.app/dashboard</div>
                <RefreshCw className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              </div>
              {/* Browser Controls */}
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-zinc-700/50 rounded transition-colors">
                  <BookOpen className="w-4 h-4 text-zinc-400" />
                </button>
                <button className="p-1.5 hover:bg-zinc-700/50 rounded transition-colors">
                  <Share2 className="w-4 h-4 text-zinc-400" />
                </button>
                <button className="p-1.5 hover:bg-zinc-700/50 rounded transition-colors">
                  <Plus className="w-4 h-4 text-zinc-400" />
                </button>
                <button className="p-1.5 hover:bg-zinc-700/50 rounded transition-colors">
                  <LayoutGrid className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>
            {/* Dashboard Content */}
            <div className="relative bg-[#0A0A0A] border-x border-b border-zinc-800 rounded-b-2xl p-12 shadow-2xl overflow-hidden group hover:border-zinc-700 transition-all duration-500 min-h-[650px]">
            {/* Header with Hello and Name */}
            <div className="mb-6 pb-4 border-b border-zinc-800">
              <div className="text-left flex items-baseline gap-2">
                <span className="text-2xl text-zinc-400">Hello</span>
                <span className="text-2xl font-bold text-white">Alex</span>
                <span className="text-2xl">👋</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="h-20 bg-zinc-800/50 rounded-xl border border-zinc-800 flex items-center justify-start px-4">
                <div className="text-left">
                  <div className="text-2xl font-bold text-emerald-500">$24,500</div>
                  <div className="text-xs text-zinc-500">Total Revenue</div>
                </div>
              </div>
              <div className="h-20 bg-zinc-800/50 rounded-xl border border-zinc-800 flex items-center justify-start px-4">
                <div className="text-left">
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-xs text-zinc-500">Active Invoices</div>
                </div>
              </div>
              <div className="h-20 bg-zinc-800/50 rounded-xl border border-zinc-800 flex items-center justify-start px-4">
                <div className="text-left">
                  <div className="text-2xl font-bold text-blue-500">8</div>
                  <div className="text-xs text-zinc-500">Clients</div>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="mb-4">
                <div className="text-base font-semibold text-white">Recent Invoices</div>
              </div>
              <div className="space-y-3">
                {[
                  { 
                    id: 1, 
                    client: 'Acme Corp', 
                    days: 3, 
                    amount: 2500,
                    invoiceNumber: '2512-9174',
                    email: 'contact@acme.com',
                    item: 'Brand Identity Design'
                  },
                  { 
                    id: 2, 
                    client: 'Starlight Studio', 
                    days: 5, 
                    amount: 3200,
                    invoiceNumber: '2512-9175',
                    email: 'hello@starlight.com',
                    item: 'Website Development'
                  },
                  { 
                    id: 3, 
                    client: 'Nexus Inc', 
                    days: 7, 
                    amount: 1800,
                    invoiceNumber: '2512-9176',
                    email: 'info@nexus.com',
                    item: 'UI/UX Design'
                  },
                  { 
                    id: 4, 
                    client: 'Digital Dynamics', 
                    days: 2, 
                    amount: 4500,
                    invoiceNumber: '2512-9177',
                    email: 'hello@digital.com',
                    item: 'E-commerce Platform'
                  },
                  { 
                    id: 5, 
                    client: 'Creative Solutions', 
                    days: 10, 
                    amount: 2800,
                    invoiceNumber: '2512-9178',
                    email: 'info@creative.com',
                    item: 'Brand Strategy'
                  }
                ].map((invoice) => (
                  <div 
                    key={invoice.id} 
                    onClick={() => setSelectedInvoice(invoice.id)}
                    className="group relative flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="flex items-center gap-3 z-10 flex-shrink-0">
                      <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500 text-xs font-bold border border-emerald-500/30">
                        {invoice.client.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{invoice.client}</div>
                        <div className="text-xs text-zinc-500">Due in {invoice.days} days</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 z-10 relative min-w-0 flex-1 justify-end">
                      <div className="text-sm font-bold text-white font-mono">${invoice.amount.toLocaleString()}</div>
                      <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
                        Paid
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      </Section>

      {/* Features Section - Main Focus */}
      <Section id="features" className="bg-zinc-950/50">
        <div className="text-center mb-20">
          <Badge color="green">Everything You Need</Badge>
          <h2 className="mt-6 text-4xl md:text-5xl font-bold mb-4 text-white">Powerful features, simple design</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            All the tools you need to create invoices, get paid, and follow up—without the complexity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Feature 1: Professional Invoices */}
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Professional Invoice Creation"
            description="Create beautiful, branded invoices in minutes. Choose from multiple templates, customize colors and fonts, and maintain your personal brand."
            highlights={[
              "Multiple professional templates",
              "Custom colors, fonts & branding",
              "PDF export ready",
              "Mobile-responsive design"
            ]}
            color="emerald"
          />

          {/* Feature 2: Stripe Payments */}
          <FeatureCard
            icon={<CreditCard className="w-6 h-6" />}
            title="Instant Stripe Payments"
            description="Get paid directly to your Stripe account. One-click payments, instant notifications, and automatic invoice updates."
            highlights={[
              "Stripe Connect integration",
              "One-click payment links",
              "Instant notifications",
              "Automatic status updates"
            ]}
            color="indigo"
          />

          {/* Feature 3: Client Management */}
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Client Management"
            description="Track all your clients in one place. View payment history, contact information, and invoice history per client."
            highlights={[
              "Centralized client database",
              "Payment history tracking",
              "Contact management",
              "Invoice history per client"
            ]}
            color="blue"
          />

          {/* Feature 4: Automated Reminders */}
          <FeatureCard
            icon={<Bell className="w-6 h-6" />}
            title="Automated Reminders"
            description="Never chase payments again. Set up polite, professional reminders that send automatically when invoices are overdue."
            highlights={[
              "Customizable reminder frequency",
              "Professional email templates",
              "Multiple reminder tones",
              "Per-invoice control"
            ]}
            color="amber"
          />

          {/* Feature 5: Reports & Analytics */}
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Reports & Analytics"
            description="Track your revenue, view payment trends, and export data. Get insights into your invoicing patterns."
            highlights={[
              "Revenue charts & graphs",
              "Payment trend analysis",
              "CSV export",
              "Time-filtered reports"
            ]}
            color="purple"
          />

          {/* Feature 6: Customizable Invoices */}
          <FeatureCard
            icon={<Palette className="w-6 h-6" />}
            title="Full Customization"
            description="Make every invoice yours. Customize text colors, background colors, accent colors, and font families to match your brand."
            highlights={[
              "Text & background colors",
              "Accent color customization",
              "Google Fonts integration",
              "Brand consistency"
            ]}
            color="pink"
          />
        </div>

        {/* Additional Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-white">Branded Email Templates</h3>
              <p className="text-zinc-400 text-sm">Professional, clean email templates for invoices and reminders. No generic designs—just polished, branded communications.</p>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-white">Secure & Private</h3>
              <p className="text-zinc-400 text-sm">Row-level security ensures your data stays private. Multi-tenant architecture means you only see your own invoices and clients.</p>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-white">Dashboard Overview</h3>
              <p className="text-zinc-400 text-sm">Get a complete overview of your business at a glance. Revenue stats, active invoices, overdue payments, and more.</p>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-white">Easy Configuration</h3>
              <p className="text-zinc-400 text-sm">Set up your profile, upload your logo, configure payment settings, and customize reminders—all in one place.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* How It Works - Stripe Flow */}
      <Section>
        <div className="max-w-5xl mx-auto bg-[#0A0A0A] border border-zinc-800 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">
            Get paid instantly with <span className="text-indigo-500">Stripe</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-16 relative z-10">
            Payments go directly to your Stripe account. No middleman, no delays, just instant transfers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch relative z-10">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-10 md:p-12 flex flex-col items-center justify-between">
              <div className="w-full flex flex-col items-center">
                <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-8">Step 1</div>
                <div className="w-full bg-zinc-900/90 border border-zinc-700/50 rounded-lg p-4 mb-6">
                  <div className="mb-3">
                    <div className="text-sm text-zinc-400">Invoice #2512-9174</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-300">MVP</span>
                      <span className="text-zinc-300 font-bold">$500.00</span>
                    </div>
                  </div>
                </div>
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-base font-medium w-full shadow-[0_0_15px_rgba(79,70,229,0.4)]">Pay Invoice</button>
              </div>
              <p className="mt-6 text-base text-zinc-400">Client clicks "Pay Now"</p>
            </div>

            <div className="hidden md:flex justify-center items-center text-zinc-600 px-2">
              <ArrowRight className="w-10 h-10" />
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-10 md:p-12 flex flex-col items-center justify-between">
              <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest w-full text-center">Step 2</div>
              <div className="w-full flex flex-col items-center justify-center flex-1">
                <div className="bg-zinc-900/90 border border-zinc-700/50 rounded-2xl p-3.5 w-full flex items-center gap-3 shadow-lg backdrop-blur-sm mb-6">
                  <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center shrink-0">
                    <svg 
                      width="28" 
                      height="28" 
                      viewBox="0 0 34 34" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0"
                    >
                      <path d="M15.6548 13.2013C15.6548 12.4033 16.3085 12.0892 17.3952 12.0892C18.9573 12.0892 20.9269 12.5646 22.489 13.4051V8.58297C20.7826 7.9038 19.1016 7.64062 17.4037 7.64062C13.2353 7.64062 10.4677 9.81396 10.4677 13.4475C10.4677 19.1101 18.2696 18.2102 18.2696 20.6552C18.2696 21.5975 17.4461 21.9031 16.3001 21.9031C14.5936 21.9031 12.4203 21.207 10.6969 20.2646V25.1461C12.6071 25.9696 14.5342 26.3177 16.3001 26.3177C20.5703 26.3177 23.5077 24.2038 23.5077 20.5278C23.4738 14.4153 15.6548 15.502 15.6548 13.2013Z" fill="white"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-xs text-white font-semibold">Stripe</div>
                      <div className="text-[10px] text-zinc-500">2m ago</div>
                    </div>
                    <div className="text-xs text-zinc-300 leading-tight">You received a payment of <span className="font-bold text-white">$500.00</span> from Acme Corp.</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 text-base font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Deposited to your bank
                </div>
              </div>
              <div></div>
            </div>
          </div>
        </div>
      </Section>

      {/* Automated Reminders Feature */}
      <Section className="bg-zinc-950/50">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">Never chase payments again</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Automated reminders that sound like you, not a robot. Professional, friendly, and perfectly timed.
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto bg-[#0A0A0A] border border-zinc-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="bg-white text-zinc-900 rounded-2xl p-8 shadow-xl max-w-lg mx-auto relative z-10">
            <div className="flex items-start justify-between mb-8 border-b border-zinc-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-lg">Friendly Reminder</div>
                  <div className="text-zinc-500 text-sm">to contact@acme.com</div>
                </div>
              </div>
              <span className="text-zinc-400 text-sm">10:42 AM</span>
            </div>
            <div className="space-y-4 text-zinc-600 mb-8">
              <p>Hi there,</p>
              <p>Hope you're well! Just a friendly reminder that this invoice is due today.</p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-6 text-center border border-zinc-100 mb-6">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Amount Due</div>
              <div className="text-3xl font-bold text-zinc-900 mb-2">$500.00</div>
              <div className="inline-block px-2 py-1 bg-white border border-zinc-200 rounded text-xs text-zinc-500">Invoice #2512-9174</div>
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors">
              Pay Invoice
            </button>
          </div>
        </div>
      </Section>

      {/* Design that Sells */}
      <Section>
        <div className="bg-[#0A0A0A] border border-zinc-800 rounded-[2.5rem] p-12 text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">Design that sells</h2>
          <p className="text-zinc-400 mb-12 max-w-xl mx-auto">Create invoices that look as good as your work. Maintain your personal brand with minimalist, professional layouts.</p>
          
          <div className="max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-500">
            {/* Custom Invoice Preview Matching Design */}
            <div className="w-full aspect-[3/4] md:aspect-auto md:min-h-[600px] rounded-lg shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col border transition-colors duration-300 bg-white text-black border-zinc-200">
              {/* Header - Top Section */}
              <div className="flex justify-between items-start mb-8">
                {/* Left: Logo + Name + Email */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <LogoIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-black">Alex</div>
                    <div className="text-xs text-gray-500">Contact@alex.com</div>
                  </div>
                </div>
                {/* Right: Invoice Number */}
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Invoice #</div>
                  <div className="font-mono text-lg font-bold text-black">2512-9174</div>
                </div>
              </div>

              {/* Amount Due - Center */}
              <div className="text-center mb-8">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount Due</div>
                <div className="text-5xl md:text-6xl font-bold tracking-tight text-black">$500.00</div>
              </div>

              {/* Billed To - Gray Background */}
              <div className="mb-6 p-4 rounded-lg bg-gray-50">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billed To</div>
                <div className="font-bold text-black text-lg mb-1">Acme Corp.</div>
                <div className="text-sm text-gray-500">contact@acme.com</div>
              </div>

              {/* Line Items */}
              <div className="flex-1 mb-6">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-black font-medium uppercase">MVP</span>
                    <span className="text-gray-500 font-mono">$500.00</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Due in 14 days</span>
                  <span>Thank you for your business</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Self-Hosted Section */}
      <Section id="deploy">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">Self-hosted. Free forever.</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Run s8vr on your own infrastructure. Your data, your servers, no limits.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Self-Hosted */}
          <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-900/20 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
              <Server className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Self-Hosted</h3>
            <p className="text-zinc-400 text-sm mb-6">Deploy on your own server with Docker or bare metal</p>
            <ul className="space-y-3 text-left mb-8">
              <CheckItem>Unlimited invoices</CheckItem>
              <CheckItem>Full data ownership</CheckItem>
              <CheckItem>No usage limits</CheckItem>
              <CheckItem>Community support</CheckItem>
            </ul>
            <Button variant="outline" className="w-full" onClick={() => window.open(GITHUB_REPO, '_blank')}>
              View Docs
            </Button>
          </div>

          {/* Open Source */}
          <div className="p-8 rounded-3xl border border-emerald-900/30 bg-zinc-900/40 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-black text-xs font-bold px-4 py-1 rounded-bl-xl">MIT License</div>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
              <Code2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Open Source</h3>
            <p className="text-zinc-400 text-sm mb-6">Fork, modify, and contribute to the codebase</p>
            <ul className="space-y-3 text-left mb-8">
              <CheckItem highlight>Full source code access</CheckItem>
              <CheckItem highlight>MIT licensed</CheckItem>
              <CheckItem highlight>Active community</CheckItem>
              <CheckItem highlight>Contributions welcome</CheckItem>
            </ul>
            <Button variant="primary" className="w-full" onClick={() => window.open(GITHUB_REPO, '_blank')} icon={<Github className="w-4 h-4" />}>
              Star on GitHub
            </Button>
          </div>

          {/* Cloud (Coming Soon) */}
          <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-900/20 text-center opacity-60">
            <div className="w-16 h-16 bg-zinc-500/10 rounded-2xl flex items-center justify-center text-zinc-500 mx-auto mb-6">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Cloud</h3>
            <p className="text-zinc-400 text-sm mb-6">Managed hosting, zero maintenance</p>
            <ul className="space-y-3 text-left mb-8 text-zinc-500">
              <li className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 rounded-full p-0.5 text-zinc-600"><Check className="w-3 h-3" /></div>
                <span>Automatic updates</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 rounded-full p-0.5 text-zinc-600"><Check className="w-3 h-3" /></div>
                <span>Managed backups</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 rounded-full p-0.5 text-zinc-600"><Check className="w-3 h-3" /></div>
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 rounded-full p-0.5 text-zinc-600"><Check className="w-3 h-3" /></div>
                <span>No server management</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">Questions?</h2>
        <div className="max-w-2xl mx-auto space-y-4">
          <FAQItem question="Is this really free and open source?">
            Yes! s8vr is MIT licensed and completely free to self-host. No usage limits, no hidden fees. The full source code is available on GitHub.
          </FAQItem>
          <FAQItem question="How do I self-host s8vr?">
            You can deploy with Docker, npm, or a simple curl script. Check our GitHub README for detailed installation instructions. Most users are up and running in under 5 minutes.
          </FAQItem>
          <FAQItem question="Do I need a Stripe account?">
            Only if you want to accept online payments. Stripe integration is optional—you can use s8vr purely for invoicing and reminders without it.
          </FAQItem>
          <FAQItem question="Can I customize reminder frequency and tone?">
            Yes! You can set custom intervals, choose from multiple professional tones (friendly, formal, casual), and toggle reminders on or off per invoice.
          </FAQItem>
          <FAQItem question="How can I contribute?">
            We welcome contributions! Check out CONTRIBUTING.md on GitHub for guidelines. You can help with code, documentation, translations, or just report bugs.
          </FAQItem>
          <FAQItem question="Will automated reminders annoy my clients?">
            No. Reminders are polite, professional, and spaced appropriately. Clients actually appreciate them—they genuinely forget sometimes.
          </FAQItem>
        </div>
      </Section>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (() => {
        const invoiceData = [
          { 
            client: 'Acme Corp', 
            days: 3, 
            amount: 2500,
            invoiceNumber: '2512-9174',
            email: 'contact@acme.com',
            item: 'Brand Identity Design'
          },
          { 
            client: 'Starlight Studio', 
            days: 5, 
            amount: 3200,
            invoiceNumber: '2512-9175',
            email: 'hello@starlight.com',
            item: 'Website Development'
          },
          { 
            client: 'Nexus Inc', 
            days: 7, 
            amount: 1800,
            invoiceNumber: '2512-9176',
            email: 'info@nexus.com',
            item: 'UI/UX Design'
          },
          { 
            client: 'Digital Dynamics', 
            days: 2, 
            amount: 4500,
            invoiceNumber: '2512-9177',
            email: 'hello@digital.com',
            item: 'E-commerce Platform'
          },
          { 
            client: 'Creative Solutions', 
            days: 10, 
            amount: 2800,
            invoiceNumber: '2512-9178',
            email: 'info@creative.com',
            item: 'Brand Strategy'
          }
        ];
        const invoice = invoiceData[selectedInvoice - 1];
        if (!invoice) return null;
        return (
          <Modal
            isOpen={true}
            onClose={() => setSelectedInvoice(null)}
            title=""
          >
            <div className="max-w-lg mx-auto">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-lg font-bold text-black mb-1">Alex</div>
                    <div className="text-xs text-gray-500">Contact@alex.com</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Invoice #</div>
                    <div className="font-mono text-lg font-bold text-black">{invoice.invoiceNumber}</div>
                  </div>
                </div>

                {/* Amount Due */}
                <div className="text-center mb-8">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount Due</div>
                  <div className="text-4xl font-bold tracking-tight text-black">${invoice.amount.toLocaleString()}</div>
                </div>

                {/* Billed To */}
                <div className="mb-6 p-4 rounded-lg bg-gray-50">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billed To</div>
                  <div className="font-bold text-black text-lg mb-1">{invoice.client}</div>
                  <div className="text-sm text-gray-500">{invoice.email}</div>
                </div>

                {/* Line Items */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-black font-medium">{invoice.item}</span>
                    <span className="text-black font-bold">${invoice.amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">Due in {invoice.days} days</div>
                  <div className="text-sm text-gray-500">Thank you for your business</div>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      <footer className="py-12 border-t border-zinc-900 text-center text-zinc-600 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon className="w-4 h-4" />
            <span>s8vr © 2025 • MIT License</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 flex items-center gap-1.5">
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a href={`${GITHUB_REPO}#readme`} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400">Docs</a>
            <a href={`${GITHUB_REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400">Contribute</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlights: string[];
  color: 'emerald' | 'indigo' | 'blue' | 'amber' | 'purple' | 'pink';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, highlights, color }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all duration-300 group">
      <div className={`w-14 h-14 ${colorClasses[color]} rounded-xl flex items-center justify-center mb-6 border group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed mb-6">{description}</p>
      <ul className="space-y-2">
        {highlights.map((highlight, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

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

const HeroInstallTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curl' | 'docker' | 'npm'>('curl');
  const [copied, setCopied] = useState(false);

  const commands = {
    curl: 'curl -fsSL https://s8vr.app/install.sh | bash',
    docker: 'docker compose up -d',
    npm: 'npx create-s8vr@latest',
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(commands[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto mb-16">
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm">
        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {(['curl', 'docker', 'npm'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white bg-zinc-800/50 border-b-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Code Block */}
        <div className="relative px-4 py-3">
          <pre className="text-sm text-emerald-400 font-mono overflow-x-auto pr-12">
            <code>{commands[activeTab]}</code>
          </pre>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

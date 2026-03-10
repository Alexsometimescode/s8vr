import React from 'react';
import { ChevronRight, ArrowLeft, Github, Star } from 'lucide-react';

export const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M4 7V5a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M16 3h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 17v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M8 21H6a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M9 12h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export const Logo: React.FC<{ className?: string; collapsed?: boolean }> = ({ className, collapsed }) => (
  <div className={`flex items-center font-bold text-xl tracking-tight select-none cursor-pointer group text-white ${collapsed ? 'justify-center w-full' : 'gap-2'} ${className}`}>
    <div className="transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-90 shrink-0 flex items-center justify-center">
      <LogoIcon className="w-6 h-6 text-current" />
    </div>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'w-0 opacity-0' : 'w-12 opacity-100'}`}>
      <span>s8vr</span>
    </div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    // Primary: Emerald 500 - used sparingly for key CTAs only
    primary: "bg-[#10b981] text-white hover:bg-[#059669] font-medium",
    secondary: "bg-surface border border-border text-textMain hover:bg-surfaceHighlight",
    ghost: "text-textMuted hover:text-textMain hover:bg-surfaceHighlight",
    outline: "border border-border text-textMuted hover:border-textMuted hover:text-textMain bg-transparent",
    danger: "text-red-400 hover:bg-red-500/10 hover:text-red-500 border border-red-500/20"
  };

  const sizes = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
      {icon && <span className="ml-2">{icon}</span>}
    </button>
  );
};

interface NavbarProps {
  onAction?: () => void;
  onRegister?: () => void;
  actionLabel?: string;
  isApp?: boolean;
  onBack?: () => void;
  githubUrl?: string;
}

const GITHUB_REPO = 'https://github.com/Alexsometimescode/s8vr';

export const Navbar: React.FC<NavbarProps> = ({ isApp = false, onBack, githubUrl = GITHUB_REPO }) => {
  return (
    <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <div className="relative flex items-center justify-between px-4 md:px-5 h-14 w-full max-w-4xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-full">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Logo className="text-white" />
        </div>

        {!isApp && (
          <div className="hidden md:flex items-center gap-1 text-sm font-medium text-zinc-400 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors">Features</a>
            <a href="#deploy" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors">Deploy</a>
            <a href="#faq" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors">FAQ</a>
            <a href={`${githubUrl}#readme`} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors">Docs</a>
          </div>
        )}

        {!isApp && (
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 font-medium text-sm transition-all duration-200 active:scale-95"
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Star</span>
            </a>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 font-semibold text-sm transition-all duration-200 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] group"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-10 blur-xl"></span>
            </a>
          </div>
        )}
      </div>
    </nav>
  );
};

export const Section = React.forwardRef<HTMLElement, { children: React.ReactNode; className?: string; id?: string }>(({ children, className = "", id }, ref) => (
  <section ref={ref} id={id} className={`py-24 px-6 ${className}`}>
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </section>
));
Section.displayName = 'Section';

export const Badge: React.FC<{ children: React.ReactNode; color?: 'green' | 'red' | 'yellow' | 'gray' }> = ({ children, color = 'gray' }) => {
  const colors = {
    green: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    yellow: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    gray: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};
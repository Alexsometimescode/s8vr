import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';

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

export const Logo: React.FC = () => (
  <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white select-none cursor-pointer group">
    <LogoIcon className="w-6 h-6 text-white transition-colors" />
    <span>s8vr</span>
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
    primary: "bg-white text-black hover:bg-zinc-200",
    secondary: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    ghost: "text-zinc-400 hover:text-white hover:bg-white/5",
    outline: "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white bg-transparent",
    danger: "text-red-400 hover:bg-red-500/10 hover:text-red-300"
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
  onAction: () => void;
  actionLabel?: string;
  isApp?: boolean;
  onBack?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onAction, actionLabel = "Get Early Access", isApp = false, onBack }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Logo />
        </div>
        
        {!isApp && (
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#manifesto" className="hover:text-white transition-colors">Manifesto</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
        )}

        {actionLabel && (
          <div className="flex items-center gap-4">
            <Button onClick={onAction} size="sm" icon={!isApp && <ChevronRight className="w-4 h-4" />}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = "", id }) => (
  <section id={id} className={`py-24 px-6 ${className}`}>
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </section>
);

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
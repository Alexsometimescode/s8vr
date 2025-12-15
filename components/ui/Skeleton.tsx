import React from 'react';

// Skeleton Shimmer Animation Component
// Uses gradient animation moving left to right like Stripe/Linear/Vercel loading states

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

// CSS for shimmer animation - inline for reliability
const shimmerKeyframes = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height }) => (
  <div 
    className={`relative overflow-hidden rounded-lg ${className}`}
    style={{ 
      width, 
      height,
      backgroundColor: '#18181b', // Zinc 900
    }}
  >
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent, rgba(39, 39, 42, 0.5), transparent)',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  </div>
);

// Skeleton with staggered animation delay
const SkeletonDelayed: React.FC<SkeletonProps & { delay?: number }> = ({ className = '', width, height, delay = 0 }) => (
  <div 
    className={`relative overflow-hidden rounded-lg ${className}`}
    style={{ 
      width, 
      height,
      backgroundColor: '#18181b',
    }}
  >
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent, rgba(39, 39, 42, 0.6), transparent)',
        animation: `shimmer 1.5s infinite`,
        animationDelay: `${delay}ms`,
      }}
    />
  </div>
);

// Dashboard Skeleton - Full page loading state
// Inspired by Linear, Stripe, and Vercel loading states
export const DashboardSkeleton: React.FC = () => {
  return (
    <div 
      className="flex h-screen overflow-hidden font-sans"
      style={{ backgroundColor: '#09090b', color: '#a1a1aa' }}
    >
      {/* Sidebar Skeleton */}
      <aside 
        className="hidden md:flex flex-col py-6 px-6 w-64"
        style={{ 
          backgroundColor: 'rgba(24, 24, 27, 0.5)', 
          borderRight: '1px solid #27272a' 
        }}
      >
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <SkeletonDelayed className="w-6 h-6 rounded-md" delay={0} />
          <SkeletonDelayed className="w-12 h-5 rounded" delay={50} />
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <SkeletonDelayed className="w-5 h-5 rounded" delay={100 + i * 50} />
              <SkeletonDelayed className="w-20 h-4 rounded" delay={150 + i * 50} />
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-3 px-4 py-3">
            <SkeletonDelayed className="w-5 h-5 rounded" delay={400} />
            <SkeletonDelayed className="w-16 h-4 rounded" delay={450} />
          </div>
          <div className="pt-4" style={{ borderTop: '1px solid #27272a' }}>
            <div className="flex items-center gap-3 px-3 py-3">
              <SkeletonDelayed className="w-9 h-9 rounded-full" delay={500} />
              <div className="flex-1">
                <SkeletonDelayed className="w-20 h-4 rounded mb-1" delay={550} />
                <SkeletonDelayed className="w-28 h-3 rounded" delay={600} />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header 
          className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid #27272a' }}
        >
          <SkeletonDelayed className="w-32 h-8 rounded-lg" delay={100} />
          <div className="flex items-center gap-3">
            <SkeletonDelayed className="w-24 h-10 rounded-lg" delay={150} />
            <SkeletonDelayed className="w-32 h-10 rounded-full" delay={200} />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* At a Glance Section */}
          <div className="mb-8">
            <SkeletonDelayed className="w-28 h-5 rounded mb-4" delay={250} />
            
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="rounded-2xl p-6"
                  style={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a' 
                  }}
                >
                  <SkeletonDelayed className="w-28 h-3 rounded mb-3" delay={300 + i * 100} />
                  <SkeletonDelayed className="w-24 h-8 rounded" delay={350 + i * 100} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Invoices Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <SkeletonDelayed className="w-36 h-5 rounded" delay={600} />
              <SkeletonDelayed className="w-20 h-4 rounded" delay={650} />
            </div>

            {/* Invoice List */}
            <div 
              className="rounded-2xl overflow-hidden"
              style={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a' 
              }}
            >
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4"
                  style={{ 
                    borderBottom: i < 3 ? '1px solid #27272a' : 'none' 
                  }}
                >
                  <div className="flex items-center gap-4">
                    <SkeletonDelayed className="w-10 h-10 rounded-lg" delay={700 + i * 75} />
                    <div>
                      <SkeletonDelayed className="w-28 h-4 rounded mb-1" delay={750 + i * 75} />
                      <SkeletonDelayed className="w-16 h-3 rounded" delay={800 + i * 75} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <SkeletonDelayed className="w-20 h-4 rounded" delay={850 + i * 75} />
                    <SkeletonDelayed className="w-12 h-6 rounded" delay={900 + i * 75} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="bg-surface border border-border rounded-2xl p-6">
    <Skeleton className="w-1/3 h-4 rounded mb-4" />
    {[...Array(lines)].map((_, i) => (
      <Skeleton 
        key={i} 
        className="h-3 rounded mb-2" 
        style={{ width: `${100 - i * 15}%` }}
      />
    ))}
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 border-b border-border">
    <Skeleton className="w-10 h-10 rounded-lg" />
    <div className="flex-1">
      <Skeleton className="w-32 h-4 rounded mb-1" />
      <Skeleton className="w-20 h-3 rounded" />
    </div>
    <Skeleton className="w-20 h-4 rounded" />
    <Skeleton className="w-16 h-6 rounded" />
  </div>
);

// Metric Card Skeleton
export const MetricSkeleton: React.FC = () => (
  <div className="bg-surface border border-border rounded-2xl p-6">
    <Skeleton className="w-24 h-3 rounded mb-3" />
    <Skeleton className="w-28 h-8 rounded" />
  </div>
);

// Chart Skeleton - Use deterministic heights based on index
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '300px' }) => {
  // Deterministic heights for chart bars (no random values)
  const barHeights = [45, 70, 55, 85, 40, 75, 60, 90, 50, 80, 65, 72];
  
  return (
    <div className="bg-surface border border-border rounded-2xl p-6" style={{ height }}>
      <Skeleton className="w-32 h-4 rounded mb-4" />
      <div className="relative h-[calc(100%-40px)] flex items-end gap-2">
        {barHeights.map((h, i) => (
          <div 
            key={i} 
            className="flex-1 bg-surface rounded-t overflow-hidden relative"
            style={{ height: `${h}%` }}
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surfaceHighlight/50 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;


import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | 'warning';
  label?: string;
  showPulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusIndicator({ 
  status, 
  label, 
  showPulse = true,
  size = 'md' 
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-accent',
    offline: 'bg-destructive',
    connecting: 'bg-yellow-500',
    warning: 'bg-orange-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div 
          className={cn(
            'rounded-full',
            sizeClasses[size],
            statusColors[status],
            showPulse && status === 'online' && 'animate-pulse'
          )} 
        />
        {showPulse && status === 'connecting' && (
          <div 
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-75',
              statusColors[status]
            )} 
          />
        )}
      </div>
      {label && (
        <span className="text-sm font-medium">{label}</span>
      )}
    </div>
  );
}

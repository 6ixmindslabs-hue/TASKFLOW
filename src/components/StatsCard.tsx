import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'warning' | 'success' | 'destructive';
}

export function StatsCard({ title, value, icon, variant = 'default' }: StatsCardProps) {
  const variants = {
    default: 'bg-card',
    primary: 'gradient-primary text-primary-foreground',
    warning: 'bg-warning/10',
    success: 'bg-success/10',
    destructive: 'bg-destructive/10',
  };

  const iconVariants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    warning: 'bg-warning/20 text-warning',
    success: 'bg-success/20 text-success',
    destructive: 'bg-destructive/20 text-destructive',
  };

  return (
    <Card className={cn('shadow-card border-border/50 overflow-hidden', variants[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-xl', iconVariants[variant])}>
            {icon}
          </div>
          <div>
            <p className={cn(
              'text-sm',
              variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}>
              {title}
            </p>
            <p className={cn(
              'text-2xl font-bold',
              variant === 'default' && 'text-foreground',
              variant === 'warning' && 'text-warning',
              variant === 'success' && 'text-success',
              variant === 'destructive' && 'text-destructive'
            )}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

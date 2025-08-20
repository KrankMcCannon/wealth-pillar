import { memo } from 'react';

interface StepHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}

export const StepHeader = memo<StepHeaderProps>(({ title, subtitle, align = 'center' }) => (
  <div className={`${align === 'center' ? 'text-center' : ''} mb-6`}>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
    {subtitle && <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>}
  </div>
));

StepHeader.displayName = 'StepHeader';


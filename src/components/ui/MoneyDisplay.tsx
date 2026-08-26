import React from 'react';
import { formatBIF } from '../../lib/formatters';

interface MoneyDisplayProps {
  amount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({ amount, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
    xl: 'text-2xl lg:text-3xl font-extrabold',
  };

  return (
    <span className={`tracking-tight text-gray-900 ${sizeClasses[size]} ${className}`}>
      {formatBIF(amount)}
    </span>
  );
};

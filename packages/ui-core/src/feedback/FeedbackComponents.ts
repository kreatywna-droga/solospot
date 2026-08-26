import { colors, borderRadius, spacing } from '../../../design-tokens/src';

export interface AlertProps {
  title?: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  dismissible?: boolean;
  onDismiss?: () => void;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  icon?: string;
  onAction?: () => void;
}

export interface LoadingStateProps {
  message?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
}

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  color?: string;
  showLabel?: boolean;
}

export interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
}

export class FeedbackModel {
  public static getAlertStyles(variant: AlertProps['variant'] = 'info') {
    switch (variant) {
      case 'success':
        return { bg: colors.success[50], border: colors.success[300], text: colors.success[900] };
      case 'warning':
        return { bg: colors.warning[50], border: colors.warning[300], text: colors.warning[900] };
      case 'error':
        return { bg: colors.error[50], border: colors.error[300], text: colors.error[900] };
      default:
        return { bg: colors.info[50], border: colors.info[300], text: colors.info[900] };
    }
  }

  public static clampProgress(value: number, max: number = 100): number {
    if (value < 0) return 0;
    if (value > max) return 100;
    return Math.round((value / max) * 100);
  }
}

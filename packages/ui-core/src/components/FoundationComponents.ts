import { colors, spacing, borderRadius } from '../../../design-tokens/src';

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export interface IconButtonProps {
  icon: string;
  ariaLabel: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export interface InputProps {
  value: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'password' | 'email';
  disabled?: boolean;
  error?: string;
  onChange?: (val: string) => void;
}

export interface TextareaProps {
  value: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  error?: string;
  onChange?: (val: string) => void;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  onChange?: (val: string) => void;
}

export interface CheckboxProps {
  checked: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface SwitchProps {
  checked: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface BadgeProps {
  text: string;
  variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  margin?: string;
}

// Pure Component Model Implementations
export class ButtonModel {
  public static getStyles(props: ButtonProps) {
    const variant = props.variant || 'primary';
    const size = props.size || 'md';
    return {
      borderRadius: borderRadius.md,
      padding: size === 'sm' ? spacing.xs : size === 'lg' ? spacing.md : spacing.sm,
      backgroundColor:
        variant === 'primary'
          ? colors.primary[500]
          : variant === 'secondary'
          ? colors.secondary[500]
          : variant === 'danger'
          ? colors.error[500]
          : 'transparent',
      color: variant === 'outline' ? colors.primary[600] : '#ffffff',
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      opacity: props.disabled ? 0.6 : 1,
    };
  }
}

export class InputModel {
  public static validate(props: InputProps): boolean {
    if (props.type === 'number' && isNaN(Number(props.value))) return false;
    return true;
  }
}

export class BadgeModel {
  public static getColor(variant: BadgeProps['variant'] = 'info'): string {
    switch (variant) {
      case 'success': return colors.success[600];
      case 'warning': return colors.warning[600];
      case 'error': return colors.error[600];
      case 'neutral': return colors.neutral[600];
      default: return colors.info[600];
    }
  }
}

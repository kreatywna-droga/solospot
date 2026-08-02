import { describe, it, expect } from 'vitest';
import {
  ButtonModel,
  InputModel,
  BadgeModel,
  LayoutModel,
  FeedbackModel,
} from './index';

describe('UI Core Component Models', () => {
  it('should generate valid button styles', () => {
    const primaryStyles = ButtonModel.getStyles({ label: 'Click', variant: 'primary' });
    expect(primaryStyles.cursor).toBe('pointer');
    expect(primaryStyles.opacity).toBe(1);

    const disabledStyles = ButtonModel.getStyles({ label: 'Disabled', disabled: true });
    expect(disabledStyles.cursor).toBe('not-allowed');
    expect(disabledStyles.opacity).toBe(0.6);
  });

  it('should validate inputs', () => {
    expect(InputModel.validate({ value: '123', type: 'number' })).toBe(true);
    expect(InputModel.validate({ value: 'abc', type: 'number' })).toBe(false);
  });

  it('should get badge colors correctly', () => {
    expect(BadgeModel.getColor('success')).toContain('#');
    expect(BadgeModel.getColor('error')).toContain('#');
  });

  it('should generate stack and container layout styles', () => {
    const stack = LayoutModel.getStackStyles({ gap: 'md', align: 'center' });
    expect(stack.display).toBe('flex');
    expect(stack.flexDirection).toBe('column');
    expect(stack.alignItems).toBe('center');

    const container = LayoutModel.getContainerStyles({ maxWidth: 'xl', centered: true });
    expect(container.maxWidth).toBe('1280px');
    expect(container.margin).toBe('0 auto');
  });

  it('should calculate feedback styles and progress percentage', () => {
    const alertStyle = FeedbackModel.getAlertStyles('warning');
    expect(alertStyle.bg).toBeDefined();

    expect(FeedbackModel.clampProgress(50, 100)).toBe(50);
    expect(FeedbackModel.clampProgress(150, 100)).toBe(100);
    expect(FeedbackModel.clampProgress(-20, 100)).toBe(0);
  });
});

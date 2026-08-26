import { spacing, containerWidths } from '../../../design-tokens/src';

export interface StackProps {
  gap?: keyof typeof spacing | string;
  align?: 'stretch' | 'flex-start' | 'center' | 'flex-end';
  children?: any[];
}

export interface InlineProps {
  gap?: keyof typeof spacing | string;
  align?: 'flex-start' | 'center' | 'flex-end';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  wrap?: boolean;
}

export interface BoxProps {
  padding?: string;
  margin?: string;
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  width?: string;
  height?: string;
}

export interface ContainerProps {
  maxWidth?: keyof typeof containerWidths | string;
  centered?: boolean;
  padding?: string;
}

export interface GridProps {
  columns: number | string;
  gap?: string;
}

export interface FlexProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  gap?: string;
}

export class LayoutModel {
  public static getStackStyles(props: StackProps) {
    return {
      display: 'flex',
      flexDirection: 'column',
      gap: typeof props.gap === 'string' && props.gap in spacing ? spacing[props.gap as keyof typeof spacing] : props.gap || spacing.md,
      alignItems: props.align || 'stretch',
    };
  }

  public static getInlineStyles(props: InlineProps) {
    return {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: props.wrap ? 'wrap' : 'nowrap',
      gap: typeof props.gap === 'string' && props.gap in spacing ? spacing[props.gap as keyof typeof spacing] : props.gap || spacing.sm,
      alignItems: props.align || 'center',
      justifyContent: props.justify || 'flex-start',
    };
  }

  public static getContainerStyles(props: ContainerProps) {
    const maxW = typeof props.maxWidth === 'string' && props.maxWidth in containerWidths
      ? containerWidths[props.maxWidth as keyof typeof containerWidths]
      : props.maxWidth || containerWidths.xl;
    return {
      maxWidth: maxW,
      margin: props.centered !== false ? '0 auto' : '0',
      padding: props.padding || spacing.md,
      width: '100%',
    };
  }
}

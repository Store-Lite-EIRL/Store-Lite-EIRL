import type React from 'react';

type BaseMaterialProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
};

type SegmentedButtonSetProps = BaseMaterialProps & {
  multiselect?: boolean;
};

type SegmentedButtonProps = BaseMaterialProps & {
  label?: string;
  selected?: boolean;
  disabled?: boolean;
  'no-checkmark'?: boolean;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-outlined-segmented-button-set': SegmentedButtonSetProps;
      'md-outlined-segmented-button': SegmentedButtonProps;
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'md-outlined-segmented-button-set': SegmentedButtonSetProps;
      'md-outlined-segmented-button': SegmentedButtonProps;
    }
  }
}

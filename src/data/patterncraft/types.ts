export interface PatternCraftStyle {
  /** Base background color or gradient */
  background?: string;
  backgroundColor?: string;
  /** CSS background-image value */
  backgroundImage?: string;
  /** CSS background-size value */
  backgroundSize?: string;
  /** CSS background-position value */
  backgroundPosition?: string;
  backgroundRepeat?: string;
  /** Mask properties — for future use (V2 mask support) */
  maskImage?: string;
  WebkitMaskImage?: string;
  maskComposite?: string;
  WebkitMaskComposite?: string;
  maskSize?: string;
  WebkitMaskSize?: string;
  maskPosition?: string;
  WebkitMaskPosition?: string;
  maskRepeat?: string;
  WebkitMaskRepeat?: string;
}

export type PatternCraftCategory = 'gradients' | 'geometric' | 'decorative' | 'effects';

export interface PatternCraftPattern {
  id: string;
  name: string;
  category: PatternCraftCategory;
  badge?: string;
  description?: string;
  hasMask: boolean;
  style: PatternCraftStyle;
}

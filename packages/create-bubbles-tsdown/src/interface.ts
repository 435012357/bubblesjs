import gradient from 'gradient-string';

export type GradientFunction = ReturnType<typeof gradient>;

export type Framework = {
  name: string;
  display: string;
  color: GradientFunction;
  variants: FrameworkVariant[];
};

export type FrameworkVariant = {
  name: string;
  display: string;
  color: GradientFunction;
  customCommand?: string;
};

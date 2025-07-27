import { FC, ReactNode } from "react";

// Props for the animation component
export interface FadeInProps {
  children?: ReactNode;
  from: {
    dx: number;
    dy: number;
    opacity: number;
  };
  to: FadeInProps["from"];
  delay: number;
  onAnimation?: (state: "reset" | "transition") => void;
}

export type FadeInPreset = {
  from?: FadeInProps["from"];
  to?: FadeInProps["to"];
  delay?: FadeInProps["delay"];
  onAnimation?: FadeInProps["onAnimation"];
};

// Type of the FadeIn component, including static presets
export interface FadeInComponentWithPresets extends FC<FadeInProps> {
  fromTop: FC<{ children?: ReactNode } & FadeInPreset>;
  fromBottom: FC<{ children?: ReactNode } & FadeInPreset>;
  fromLeft: FC<{ children?: ReactNode } & FadeInPreset>;
  fromRight: FC<{ children?: ReactNode } & FadeInPreset>;
  opacity: FC<{ children?: ReactNode } & FadeInPreset>;
}

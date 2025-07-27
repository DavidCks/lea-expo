import { FC, ReactNode, useEffect, useRef, useState } from "react";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { FadeInComponentWithPresets } from "./fade-in.type";

export function smooth(value: number, delay: number) {
  return withSpring(value, {
    overshootClamping: true,
    damping: delay,
  });
}

const FadeIn: FadeInComponentWithPresets = ({
  children,
  from,
  to,
  delay,
  onAnimation,
}) => {
  const [renderedChildren, setRenderedChildren] = useState<ReactNode>(null);

  const dx = useSharedValue(from.dx);
  const dy = useSharedValue(from.dy);
  const opacity = useSharedValue(from.opacity);

  useEffect(() => {
    dx.value = smooth(from.dx, delay);
    dy.value = smooth(from.dy, delay);
    opacity.value = smooth(from.opacity, delay);
    // setRenderedChildren(null);
    onAnimation?.("reset");

    const timer = setTimeout(() => {
      setRenderedChildren(children);
      dx.value = smooth(to.dx, delay);
      dy.value = smooth(to.dy, delay);
      opacity.value = smooth(to.opacity, delay);
      onAnimation?.("transition");
    }, delay);

    return () => clearTimeout(timer);
  }, [children, delay, from, to]);

  return (
    <Animated.View
      className={"w-full flex-1"}
      style={{
        translateY: dy,
        translateX: dx,
        opacity: opacity,
      }}
    >
      {renderedChildren}
    </Animated.View>
  );
};

FadeIn.fromTop = ({ children, ...props }) => (
  <FadeIn
    from={{ dx: 0, dy: -60, opacity: 0 }}
    to={{ dx: 0, dy: 0, opacity: 1 }}
    delay={300}
    {...props}
  >
    {children}
  </FadeIn>
);

FadeIn.fromBottom = ({ children, ...props }) => (
  <FadeIn
    from={{ dx: 0, dy: 60, opacity: 0 }}
    to={{ dx: 0, dy: 0, opacity: 1 }}
    delay={300}
    {...props}
  >
    {children}
  </FadeIn>
);

FadeIn.fromLeft = ({ children, ...props }) => (
  <FadeIn
    from={{ dx: -20, dy: 0, opacity: 0 }}
    to={{ dx: 0, dy: 0, opacity: 1 }}
    delay={300}
    {...props}
  >
    {children}
  </FadeIn>
);

FadeIn.fromRight = ({ children, ...props }) => (
  <FadeIn
    from={{ dx: 20, dy: 0, opacity: 0 }}
    to={{ dx: 0, dy: 0, opacity: 1 }}
    delay={300}
    {...props}
  >
    {children}
  </FadeIn>
);

FadeIn.opacity = ({ children, ...props }) => (
  <FadeIn
    from={{ dx: 0, dy: 0, opacity: 0 }}
    to={{ dx: 0, dy: 0, opacity: 1 }}
    delay={300}
    {...props}
  >
    {children}
  </FadeIn>
);

export default FadeIn;

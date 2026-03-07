import React from "react";
import { Pressable, PressableProps, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableButtonProps extends PressableProps {
  scaleValue?: number;
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

export function AnimatedPressableButton({
  scaleValue = 0.97,
  children,
  style,
  onPressIn,
  onPressOut,
  disabled,
  className,
  ...props
}: AnimatedPressableButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    if (!disabled) {
      scale.value = withSpring(scaleValue, {
        damping: 15,
        stiffness: 400,
      });
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, style]}
      className={className}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

export default AnimatedPressableButton;

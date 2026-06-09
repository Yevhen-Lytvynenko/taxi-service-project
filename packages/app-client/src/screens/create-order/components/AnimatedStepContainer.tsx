import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type AnimatedStepContainerProps = {
  stepIndex: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedStepContainer({ stepIndex, children, style }: AnimatedStepContainerProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const prevStep = useRef(stepIndex);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevStep.current = stepIndex;
      return;
    }
    const dir = stepIndex > prevStep.current ? 1 : -1;
    prevStep.current = stepIndex;
    opacity.setValue(0);
    translateX.setValue(14 * dir);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stepIndex, opacity, translateX]);

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ translateX }] }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
});

import * as React from 'react';
import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import Animated, { AnimateProps } from 'react-native-reanimated';
import {
  AnimatedEntryViewStyle,
  AnimatedExitViewStyle,
  ToAnimation,
  useReanimatedAnimationBuilder,
} from '../hooks/useReanimatedAnimationBuilder';
import { optionalCore } from '../internals/optionalCore';

let hasWarnedAboutAutofocus = false;

const getWrapper = (autofocus?: boolean) => {
  if (!autofocus) {
    return React.Fragment;
  }

  const AutofocusContainer = optionalCore?.AutofocusContainer;

  if (AutofocusContainer) {
    return AutofocusContainer;
  }

  if (__DEV__ && !hasWarnedAboutAutofocus) {
    hasWarnedAboutAutofocus = true;
    console.warn(
      '[AMA] AnimatedContainer: the `autofocus` prop needs @react-native-ama/core. Install it to move the screen reader focus to the animated content.',
    );
  }

  return React.Fragment;
};

type UseReanimated = Omit<AnimateProps<ViewProps>, 'entering' | 'exiting'> & {
  autofocus?: boolean;
  duration?: number;
  from: AnimatedEntryViewStyle;
  exitFrom?: AnimatedExitViewStyle;
  exitTo?: ToAnimation;
  to: ToAnimation;
  style?: Pick<ViewProps, 'style'>;
};

export const AnimatedContainer = React.forwardRef<
  Animated.View,
  PropsWithChildren<UseReanimated>
>(
  (
    {
      from,
      to,
      exitFrom,
      exitTo,
      duration = 300,
      style,
      autofocus,
      children,
      ...rest
    },
    forwardRef,
  ) => {
    const { entering, exiting } = useReanimatedAnimationBuilder({
      from,
      to,
      exitFrom,
      exitTo,
      duration,
    });

    const Wrapper = getWrapper(autofocus);
    return (
      <Wrapper>
        <Animated.View
          style={style}
          entering={entering}
          exiting={exiting}
          ref={forwardRef}
          {...rest}
        >
          {children}
        </Animated.View>
      </Wrapper>
    );
  },
);

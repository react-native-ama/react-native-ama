import * as React from 'react';
import { AccessibilityInfo } from 'react-native';
import { optionalCore } from './optionalCore';

const getCoreContext = (): { isReduceMotionEnabled: boolean } | null => {
  try {
    return optionalCore?.useAMAContext?.() ?? null;
  } catch {
    // core is installed but the app isn't wrapped in <AMAProvider />
    return null;
  }
};

/**
 * Reads the system "Reduce motion" setting directly, used when the AMA context
 * isn't available. Falling back to `false` would play motion animations for
 * users who asked the OS not to.
 */
const useSystemReduceMotion = (enabled: boolean) => {
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] =
    React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(value => {
        if (isMounted) {
          setIsReduceMotionEnabled(Boolean(value));
        }
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      value => setIsReduceMotionEnabled(Boolean(value)),
    );

    return () => {
      isMounted = false;
      subscription?.remove?.();
    };
  }, [enabled]);

  return isReduceMotionEnabled;
};

export const useAMAContextSafe = (): { isReduceMotionEnabled: boolean } => {
  const context = getCoreContext();
  const systemReduceMotion = useSystemReduceMotion(context === null);

  if (context) {
    return { isReduceMotionEnabled: Boolean(context.isReduceMotionEnabled) };
  }

  return { isReduceMotionEnabled: systemReduceMotion };
};

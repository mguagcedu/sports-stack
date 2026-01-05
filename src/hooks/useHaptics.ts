import { useCallback } from 'react';
import { haptics } from '@/services/haptics';

export function useHaptics() {
  const tapFeedback = useCallback(() => {
    haptics.impact('light');
  }, []);

  const buttonFeedback = useCallback(() => {
    haptics.impact('medium');
  }, []);

  const heavyFeedback = useCallback(() => {
    haptics.impact('heavy');
  }, []);

  const successFeedback = useCallback(() => {
    haptics.notification('success');
  }, []);

  const warningFeedback = useCallback(() => {
    haptics.notification('warning');
  }, []);

  const errorFeedback = useCallback(() => {
    haptics.notification('error');
  }, []);

  const selectionFeedback = useCallback(() => {
    haptics.selection();
  }, []);

  const vibrate = useCallback((duration?: number) => {
    haptics.vibrate(duration);
  }, []);

  return {
    tapFeedback,
    buttonFeedback,
    heavyFeedback,
    successFeedback,
    warningFeedback,
    errorFeedback,
    selectionFeedback,
    vibrate,
  };
}

export default useHaptics;

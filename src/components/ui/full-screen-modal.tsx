import { PremiumColors } from "@/constants/colors";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { Modal, StyleSheet, View } from "react-native";

/**
 * A full-bleed page presented over the current screen.
 *
 * Replaces the draggable bottom sheets: content that fills the screen should
 * not ask the user to drag it into view first. The imperative handle mirrors
 * the sheet API the screens already call, so `present()` / `dismiss()` keep
 * working unchanged.
 */

export interface FullScreenModalHandle {
  present(): void;
  dismiss(): void;
}

interface FullScreenModalProps {
  /** Receives `close`, so content can dismiss without holding its own ref. */
  children: (close: () => void) => React.ReactNode;
  /** Runs after the page closes, however it was closed. */
  onDismiss?: () => void;
}

export const FullScreenModal = forwardRef<
  FullScreenModalHandle,
  FullScreenModalProps
>(({ children, onDismiss }, ref) => {
  const [visible, setVisible] = useState(false);

  const close = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  useImperativeHandle(
    ref,
    () => ({ present: () => setVisible(true), dismiss: close }),
    [close],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      // Android's back gesture and iOS's swipe both land here, so there is one
      // close path no matter how the user leaves the page.
      onRequestClose={close}
    >
      <View style={styles.screen}>{children(close)}</View>
    </Modal>
  );
});

FullScreenModal.displayName = "FullScreenModal";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PremiumColors.background.primary },
});

export default FullScreenModal;

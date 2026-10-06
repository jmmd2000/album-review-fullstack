import { Toast } from "@base-ui/react/toast";
import { CheckCircleIcon, CircleNotchIcon, InfoIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { toastManager } from "@/lib/toast";
import styles from "./Toaster.module.css";

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <Toast.Portal>
        <Toast.Viewport className={styles.viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map(toast => (
    <Toast.Root key={toast.id} toast={toast} className={styles.toast}>
      <Toast.Content className={styles.content}>
        <ToastIcon type={toast.type} />
        <Toast.Title className={styles.title} />
        <Toast.Close className={styles.close} aria-label="Close">
          <XIcon weight="bold" aria-hidden="true" />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

function ToastIcon({ type }: { type?: string }) {
  switch (type) {
    case "loading":
      return <CircleNotchIcon weight="bold" className={styles.spinner} aria-hidden="true" />;
    case "success":
      return <CheckCircleIcon weight="bold" className={styles.icon} aria-hidden="true" />;
    case "error":
      return <WarningCircleIcon weight="bold" className={styles.error} aria-hidden="true" />;
    default:
      return <InfoIcon weight="bold" className={styles.icon} aria-hidden="true" />;
  }
}

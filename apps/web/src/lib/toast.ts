import { Toast } from "@base-ui/react/toast";

/** The one toast manager. The Toaster shows what it holds. */
export const toastManager = Toast.createToastManager();

export const toast = {
  success: (title: string) => toastManager.add({ title, type: "success" }),
  error: (title: string) => toastManager.add({ title, type: "error", priority: "high" }),
  info: (title: string) => toastManager.add({ title, type: "info" }),
  /** Shows the loading message while the promise runs, then changes it to the success or error message. */
  promise: <Value>(promise: Promise<Value>, messages: { loading: string; success: string; error: string }) =>
    toastManager.promise(promise, {
      loading: { title: messages.loading, type: "loading" },
      success: { title: messages.success, type: "success" },
      error: { title: messages.error, type: "error", priority: "high" },
    }),
};

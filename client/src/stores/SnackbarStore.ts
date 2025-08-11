import { action, makeObservable, observable } from "mobx";

export interface SnackbarMessage {
  id: string;
  message: string;
  severity: "success" | "error" | "info" | "warning";
  duration?: number;
}

export class SnackbarStore {
  messages: SnackbarMessage[] = [];

  constructor() {
    makeObservable(this, {
      messages: observable,
      showMessage: action,
      removeMessage: action,
    });
  }

  showMessage(
    message: string,
    severity: SnackbarMessage["severity"] = "info",
    duration = 4000
  ) {
    const id = Date.now().toString();
    const newMessage: SnackbarMessage = {
      id,
      message,
      severity,
      duration,
    };

    this.messages.push(newMessage);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeMessage(id);
    }, duration);

    return id;
  }

  removeMessage(id: string) {
    const index = this.messages.findIndex((msg) => msg.id === id);
    if (index !== -1) {
      this.messages.splice(index, 1);
    }
  }

  // Convenience methods
  showSuccess(message: string, duration?: number) {
    return this.showMessage(message, "success", duration);
  }

  showError(message: string, duration?: number) {
    return this.showMessage(message, "error", duration);
  }

  showInfo(message: string, duration?: number) {
    return this.showMessage(message, "info", duration);
  }

  showWarning(message: string, duration?: number) {
    return this.showMessage(message, "warning", duration);
  }
}

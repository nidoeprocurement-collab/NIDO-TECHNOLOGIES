import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ActionKind = "delete" | "save" | "resubmit" | "submit";

type PendingAction = {
  kind: ActionKind;
  label: string;
  resume: () => void;
};

const ACTION_PATTERN =
  /\b(delete|remove|save|resubmit|re-submit|resubmission|submit)\b/i;

function getActionableElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest(
    'button, input[type="submit"], input[type="button"], [role="button"], [role="menuitem"]',
  ) as HTMLElement | null;
}

function getActionLabel(element: HTMLElement): string {
  const inputValue =
    element instanceof HTMLInputElement ? element.value : "";
  return [
    element.getAttribute("data-confirmation-action"),
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.textContent,
    inputValue,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function getActionKind(label: string, isSubmitButton = false): ActionKind | null {
  const normalized = label.toLowerCase();
  if (/\b(resubmit|re-submit|resubmission)\b/.test(normalized)) {
    return "resubmit";
  }
  if (/\b(delete|remove)\b/.test(normalized)) return "delete";
  if (/\bsave\b/.test(normalized)) return "save";
  if (/\bsubmit\b/.test(normalized) || isSubmitButton) return "submit";
  return null;
}

function getConfirmationCopy(kind: ActionKind, label: string) {
  if (kind === "delete") {
    return {
      title: label.match(/\b(remove|delete)\b/i)?.[1] === "remove"
        ? "Confirm removal"
        : "Confirm deletion",
      description:
        "Are you sure you want to continue? This action may not be reversible.",
      confirmLabel: label.match(/\bremove\b/i) ? "Remove" : "Delete",
    };
  }
  if (kind === "resubmit") {
    return {
      title: "Confirm resubmission",
      description: "Are you sure you want to resubmit this request?",
      confirmLabel: "Resubmit",
    };
  }
  if (kind === "save") {
    return {
      title: "Confirm save",
      description: "Are you sure you want to save these changes?",
      confirmLabel: "Save",
    };
  }
  return {
    title: "Confirm submission",
    description: "Are you sure you want to submit this request?",
    confirmLabel: "Submit",
  };
}

/**
 * Applies one consistent confirmation step to mutation-style actions across
 * both the internal NIDO platform and the client portal.
 *
 * Existing pages can opt out with data-confirmation-skip when they already
 * provide a more specific confirmation flow.
 */
export default function ActionConfirmationGuard() {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const replaying = useRef(false);

  useEffect(() => {
    const originalConfirm = window.confirm;
    const guardedConfirm = (message?: string) =>
      replaying.current ? true : originalConfirm.call(window, message);
    window.confirm = guardedConfirm;

    const shouldSkip = (element: HTMLElement) =>
      Boolean(element.closest("[data-confirmation-skip]"));

    const requestConfirmation = (
      event: Event,
      element: HTMLElement,
      kind: ActionKind,
      resume: () => void,
    ) => {
      if (replaying.current || shouldSkip(element)) return;
      event.preventDefault();
      event.stopPropagation();
      setPending({
        kind,
        label: getActionLabel(element),
        resume,
      });
    };

    const handleClick = (event: MouseEvent) => {
      if (replaying.current) return;
      const element = getActionableElement(event.target);
      if (!element || element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
        return;
      }
      const isSubmitButton =
        element instanceof HTMLButtonElement &&
        element.type === "submit";
      const kind = getActionKind(getActionLabel(element), isSubmitButton);
      if (!kind) return;
      requestConfirmation(event, element, kind, () => element.click());
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (replaying.current || !(form instanceof HTMLFormElement)) {
        return;
      }
      const submitter = event.submitter as HTMLElement | null;
      const fallbackSubmitter = submitter ??
        getActionableElement(form.querySelector(
          'button[type="submit"], input[type="submit"], button:not([type])',
        ));
      const label = fallbackSubmitter
        ? getActionLabel(fallbackSubmitter)
        : "Submit";
      const kind = getActionKind(label) ??
        (fallbackSubmitter ? null : "submit");
      if (!kind) return;
      requestConfirmation(event, fallbackSubmitter ?? form, kind, () => {
        if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
          form.requestSubmit(submitter);
        } else {
          form.requestSubmit();
        }
      });
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      if (window.confirm === guardedConfirm) window.confirm = originalConfirm;
    };
  }, []);

  const confirmCopy = pending
    ? getConfirmationCopy(pending.kind, pending.label)
    : null;

  const handleConfirm = () => {
    if (!pending) return;
    const action = pending;
    setPending(null);
    replaying.current = true;
    try {
      action.resume();
    } finally {
      replaying.current = false;
    }
  };

  return (
    <Dialog open={Boolean(pending)} onOpenChange={open => !open && setPending(null)}>
      {confirmCopy && (
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmCopy.title}</DialogTitle>
            <DialogDescription>{confirmCopy.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              variant={pending?.kind === "delete" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {confirmCopy.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
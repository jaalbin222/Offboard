import type { Difficulty } from "./types";

const ARROWS = /\s*(?:➜|⮕|➡|→|►|▸|›)\s*/g;

const DEFAULT_STEPS: Record<Difficulty, string[]> = {
  easy: [
    "Open the deletion page while you are signed in.",
    "Follow the prompts and confirm. Easy accounts usually finish in one sitting.",
    "Download anything you want to keep before the last confirmation.",
  ],
  medium: [
    "Open the deletion page and sign in.",
    "Cancel an active subscription first if the service requires it.",
    "Finish the extra confirmation. Some accounts send a code or impose a short wait.",
  ],
  limited: [
    "Open the deletion page. This service only removes part of your data.",
    "Submit the privacy request they offer and note what they say they will keep.",
    "Download a copy of anything you want, then lock whatever account remains.",
  ],
  hard: [
    "Open the deletion page. Expect identity checks, a support request, or a long wait.",
    "Follow every email they send until the account is actually closed.",
    "Export your data before you start. Hard deletions are difficult to undo.",
  ],
  impossible: [
    "This service does not let you delete the account.",
    "Remove the profile details, posts, and payment methods you can.",
    "Change the password, turn on two-factor authentication, and revoke connected apps.",
    "Stop using the account, and check back if the deletion policy changes.",
  ],
};

const CLOSER: Record<Difficulty, string> = {
  easy: "Save the confirmation email so you can show the account is closed.",
  medium: "If a waiting period starts, put a reminder on your calendar and confirm it finished.",
  limited: "After the partial deletion, change the password and turn on two-factor authentication.",
  hard: "Keep the support ticket until you have written confirmation that the account is gone.",
  impossible: "Treat a password change and two-factor authentication as the close-out for this account.",
};

function finish(step: string): string {
  const trimmed = step.replace(/^[\s•·-]+/, "").trim();
  if (!trimmed) return "";
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

export function deletionSteps(input: {
  difficulty: Difficulty;
  notes?: string;
  email?: string;
  emailSubject?: string;
}): string[] {
  const notes = (input.notes ?? "").replace(/\s+/g, " ").trim();
  let steps: string[] = [];

  if (notes) {
    const normalized = notes.replace(ARROWS, "\n").replace(/(?:^|\s)\d+[.)]\s+/g, "\n");
    steps = normalized
      .split(/\n+/)
      .flatMap((chunk) => chunk.split(/(?<=[.!?])\s+/))
      .map(finish)
      .filter((step) => step.length > 1);
  }

  if (steps.length === 0) {
    steps = [...DEFAULT_STEPS[input.difficulty]];
  } else if (steps.length === 1) {
    steps = [...steps, CLOSER[input.difficulty]];
  }

  const email = input.email?.trim();
  const emailStep =
    email && email.includes("@")
      ? `If the page does not finish the job, email ${email} and ask them to delete the account.${
          input.emailSubject?.trim()
            ? ` Use the subject “${input.emailSubject.trim()}”.`
            : ""
        }`
      : "";

  const max = emailStep ? 5 : 6;
  return [...steps.slice(0, max), ...(emailStep ? [emailStep] : [])];
}

import type { Metadata } from "next";
import { ChecklistApp } from "@/components/checklist-app";

export const metadata: Metadata = {
  title: "Your checklist",
  description:
    "Delete or lock the accounts you no longer want. Breached services are listed first, with direct deletion links.",
};

export default function ChecklistPage() {
  return <ChecklistApp />;
}

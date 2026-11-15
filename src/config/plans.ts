import { MAX_UPLOAD_MB, PAGES_PER_PDF } from "./limits"

// Display-only plan data for the pricing page. Payments are not live yet:
// everyone gets the Free limits, and Pro shows a "Coming soon" message.
export type PlanFeature = { text: string; footnote?: string; negative?: boolean }

export type Plan = {
  name: "Free" | "Pro"
  tagline: string
  price: number
  quota: string
  features: PlanFeature[]
}

export const PLANS: Plan[] = [
  {
    name: "Free",
    tagline: "For trying it out and everyday documents.",
    price: 0,
    quota: "Unlimited PDFs",
    features: [
      { text: `${PAGES_PER_PDF} pages per PDF`, footnote: "The maximum number of pages per PDF file." },
      { text: `${MAX_UPLOAD_MB}MB file size limit`, footnote: "The maximum size of a single PDF file." },
      { text: "Mobile-friendly interface" },
      { text: "Higher-quality responses", footnote: "A stronger AI model for deeper, more accurate answers.", negative: true },
      { text: "Priority support", negative: true },
    ],
  },
  {
    name: "Pro",
    tagline: "For larger documents and heavier use.",
    price: 14,
    quota: "Unlimited PDFs",
    features: [
      { text: "500 pages per PDF", footnote: "The maximum number of pages per PDF file." },
      { text: "64MB file size limit", footnote: "The maximum size of a single PDF file." },
      { text: "Mobile-friendly interface" },
      { text: "Higher-quality responses", footnote: "A stronger AI model for deeper, more accurate answers." },
      { text: "Priority support" },
    ],
  },
]

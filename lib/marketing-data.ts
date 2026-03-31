import type { LucideIcon } from "lucide-react";
import {
  Layers3,
  Megaphone,
  MessageSquareQuote
} from "lucide-react";

export interface CapabilityCard {
  title: string;
  body: string;
  icon: LucideIcon;
}

export interface FeatureMosaicItem {
  title: string;
  copy: string;
  tone: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface Plan {
  name: string;
  price: string;
  blurb: string;
  featured?: boolean;
  points: string[];
}

export const trustedBy = [
  "Northstar Studio",
  "Orbit Labs",
  "Framehouse",
  "DevFoundry",
  "Atlas Creative",
  "Signal Agency"
] as const;

export const capabilityCards: CapabilityCard[] = [
  {
    title: "Create once",
    body: "Turn screenshots, PDFs, notes, links, and raw proof into a clean case-study spine.",
    icon: Layers3
  },
  {
    title: "Distribute fast",
    body: "Generate channel-native copy for LinkedIn, Behance, and Dribbble without reopening the same asset three times.",
    icon: Megaphone
  },
  {
    title: "Monitor trust",
    body: "Pull reviews into one inbox, classify sentiment, and keep responses human-approved.",
    icon: MessageSquareQuote
  }
];

export const featureMosaic: FeatureMosaicItem[] = [
  {
    title: "Angle detection that finds the strongest story",
    copy: "Business ROI, visual craft, developer authority, or operational clarity. The system picks a lead angle before copy generation starts.",
    tone: "from-fuchsia-500/40 via-violet-500/20 to-transparent"
  },
  {
    title: "Platform recommendations before you publish",
    copy: "Visual work routes toward Dribbble or Behance. Proof-heavy work routes toward LinkedIn and authority-led channels.",
    tone: "from-sky-500/35 via-cyan-500/15 to-transparent"
  },
  {
    title: "Fallbacks built in when APIs get weird",
    copy: "If direct publishing fails, copy mode stays ready with assets, tags, CTA, and final text bundled together.",
    tone: "from-amber-500/35 via-orange-500/15 to-transparent"
  }
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "We stopped treating portfolio writing like a quarterly chore. One project now turns into a polished case study and distribution plan in the same session.",
    name: "Nina Foster",
    role: "Independent Designer"
  },
  {
    quote:
      "The angle detection is what made it click for us. It pulled ROI proof out of work we were underselling on every client recap.",
    name: "Rohan Malhotra",
    role: "Agency Founder"
  },
  {
    quote:
      "The ORM inbox matters more than I expected. Reviews do not disappear in email anymore, and the draft responses save real energy.",
    name: "Devon Price",
    role: "Developer Consultant"
  }
];

export const plans: Plan[] = [
  {
    name: "Starter",
    price: "Free",
    blurb: "For solo creators validating the loop.",
    points: [
      "1 active workspace",
      "Project intake + AI structuring",
      "Copy export for 3 channels",
      "Manual review ingest"
    ]
  },
  {
    name: "Pro",
    price: "$29/mo",
    blurb: "For freelancers who want consistent portfolio distribution.",
    featured: true,
    points: [
      "Unlimited projects",
      "Channel generation + save for later",
      "LinkedIn + Behance connections",
      "Sentiment analysis + draft responses"
    ]
  },
  {
    name: "Agency",
    price: "$99/mo",
    blurb: "For teams centralizing proof, publishing, and reputation.",
    points: [
      "Multi-user workspace",
      "Client-facing proof dashboards",
      "Review workflows by teammate",
      "Priority support and launch help"
    ]
  }
];

export const marketingStats = [
  { value: "20 min", label: "time to first case study draft" },
  { value: "70%+", label: "AI acceptance without major edits" },
  { value: "3 channels", label: "adapted from one project asset" }
] as const;

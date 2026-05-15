import type { ProviderName } from "./types"

export const ALL_PROVIDERS: ProviderName[] = ["smallest", "groq", "sarvam"]

export const PROVIDER_LABELS: Record<ProviderName, string> = {
  smallest: "Smallest.ai",
  groq: "Groq PlayAI",
  sarvam: "Sarvam AI",
}

export const PROVIDER_COLORS: Record<ProviderName, string> = {
  smallest: "#6366f1",
  groq: "#f59e0b",
  sarvam: "#ec4899",
}

export const CATEGORY_LABELS: Record<string, string> = {
  hinglish_codeswitch: "Hinglish Conversations",
  indian_proper_nouns_and_codes: "Indian Financial Codes",
  credit_card_otp_readback: "OTP / Card Readback",
}

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  hinglish_codeswitch: "Natural Hindi-English code-switching · 'Sir aapka order deliver ho jayega'",
  indian_proper_nouns_and_codes: "IFSC codes, PAN, Aadhaar · precision parsing of Indian financial identifiers",
  credit_card_otp_readback: "Every digit matters · OTPs, card numbers, and PIN readbacks",
}

export const CATEGORY_COLORS: Record<string, string> = {
  hinglish_codeswitch: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  indian_proper_nouns_and_codes: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  credit_card_otp_readback: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
}

export function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

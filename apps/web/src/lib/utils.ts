import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Standard shadcn/ui helper: merges conditional class names and resolves
// conflicting Tailwind utility classes.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

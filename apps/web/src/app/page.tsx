import { redirect } from "next/navigation";

export default function Home() {
  // The (dashboard) route group handles the actual auth check and will
  // bounce to /login if there's no valid session.
  redirect("/dashboard");
}

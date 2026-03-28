import { redirect } from "next/navigation";

export default function Home() {
  // The middleware will handle redirection to /login if the user is not authenticated.
  // If authenticated, we land here and redirect to the main products dashboard.
  redirect("/products");
}

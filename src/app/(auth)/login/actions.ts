"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(formData: z.infer<typeof loginSchema>) {
  const validatedFields = loginSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields provided.",
    };
  }

  const { email, password } = validatedFields.data;

  // M4 (Auth Specialist) & M3 (DB Specialist) Logic:
  // This server action handles the login process by calling Supabase.
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }
  
  // A redirect is necessary to trigger the middleware and update the session cookie.
  // The middleware will then redirect the user to the appropriate page.
  return redirect("/");
}

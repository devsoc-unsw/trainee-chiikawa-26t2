import { createAuthClient } from "better-auth/react";
import { redirect } from "react-router";
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

export async function logoutAction() {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
      },
    },
  });
  return redirect("/");
}
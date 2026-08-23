import { createAuthClient } from "better-auth/react";
import { redirect } from "react-router";
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

export async function logoutAction() {
  let res = false;
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        res = true;
      },
    },
  });
  return redirect("/");
}
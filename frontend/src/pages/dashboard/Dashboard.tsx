import { Form, redirect, useLoaderData } from "react-router";
import { authClient } from "../../lib/auth";

interface AuthUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image ?: string | null | undefined;
}

export async function dashboardLoader() {
  const { data: session } = await authClient.getSession();
  if (!session) {
    throw redirect("/login");
  }
  return { user: session?.user };
}

export default function Dashboard() {
  const { user }: {user: AuthUser} = useLoaderData();
  return <>
    <h2>user dashboard</h2>
    <p>{user ? "You are logged in as " + user.name : "You are not logged in"}</p>
    {user && <Form method="post" action="/logout">
      <button type="submit">logout</button>
    </Form>}
  </>
}
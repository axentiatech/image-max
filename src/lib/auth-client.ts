import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000",
});

 
export type Session = Awaited<ReturnType<typeof authClient.getSession>>["data"];
export type User = Session["user"];


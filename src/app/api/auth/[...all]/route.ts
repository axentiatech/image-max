    // Example of correct export in Next.js route.ts
    import { auth } from "@/lib/auth";
    import { toNextJsHandler } from "better-auth/next-js";

    export const { GET, POST } = toNextJsHandler(auth);
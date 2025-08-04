import { Role } from "@prisma/client";

export interface TokenUser {
    id: string;
    email: string;
    name: string | null;
    /**
     * RBAC roles assigned to the user
     */
    roles: Role[];
  }
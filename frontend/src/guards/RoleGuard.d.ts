import type { ReactNode } from "react";
import type { UserRole } from "@/constants/roles";
interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: UserRole[];
}
export declare function RoleGuard({ children, allowedRoles }: RoleGuardProps): import("react").JSX.Element;
export {};

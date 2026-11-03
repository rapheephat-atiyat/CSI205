export { User } from "@/server/database/entities/User";
export { Session } from "@/server/database/entities/Session";
export { Account } from "@/server/database/entities/Account";
export { Verification } from "@/server/database/entities/Verification";
export { UserRole } from "@/server/database/entities/UserRole";
export { UserRolePermission } from "@/server/database/entities/UserRolePermission";

import { Account } from "@/server/database/entities/Account";
import { Session } from "@/server/database/entities/Session";
import { User } from "@/server/database/entities/User";
import { UserRolePermission } from "@/server/database/entities/UserRolePermission";
import { UserRole } from "@/server/database/entities/UserRole";
import { Verification } from "@/server/database/entities/Verification";

export const databaseEntities = [
    User,
    Session,
    Account,
    Verification,
    UserRole,
    UserRolePermission,
];

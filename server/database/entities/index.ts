export { User } from "@/server/database/entities/User";
export { Session } from "@/server/database/entities/Session";
export { Account } from "@/server/database/entities/Account";
export { Verification } from "@/server/database/entities/Verification";
export { UserRole } from "@/server/database/entities/UserRole";
export { UserRolePermission } from "@/server/database/entities/UserRolePermission";
export { Events } from "@/server/database/entities/Event";
export { EventSession } from "@/server/database/entities/EventSession";
export { Store } from "@/server/database/entities/Store";
export { Product } from "@/server/database/entities/Product";
export { Wallet } from "@/server/database/entities/Wallet";
export { WalletHistory } from "@/server/database/entities/WalletHistory";

import { Account } from "@/server/database/entities/Account";
import { Events } from "@/server/database/entities/Event";
import { EventSession } from "@/server/database/entities/EventSession";
import { Product } from "@/server/database/entities/Product";
import { Session } from "@/server/database/entities/Session";
import { Store } from "@/server/database/entities/Store";
import { User } from "@/server/database/entities/User";
import { UserRole } from "@/server/database/entities/UserRole";
import { UserRolePermission } from "@/server/database/entities/UserRolePermission";
import { Verification } from "@/server/database/entities/Verification";
import { Wallet } from "@/server/database/entities/Wallet";
import { WalletHistory } from "@/server/database/entities/WalletHistory";

export const databaseEntities = [
    User,
    Session,
    Account,
    Verification,
    UserRole,
    UserRolePermission,
    Events,
    EventSession,
    Store,
    Product,
    Wallet,
    WalletHistory,
];

import "reflect-metadata";

import { Event } from "./Event";
import { Store } from "./Store";
import { StoreMember } from "./StoreMember";
import { User } from "./User";
import { UserEvent } from "./UserEvent";
import { UserEventRole } from "./UserEventRole";
import { UserPermission } from "./UserPermission";
import { UserRole } from "./UserRole";

export {
    Event,
    Store,
    StoreMember,
    User,
    UserEvent,
    UserEventRole,
    UserPermission,
    UserRole,
};

export const databaseEntities = [
    User,
    Event,
    UserRole,
    UserPermission,
    UserEvent,
    UserEventRole,
    Store,
    StoreMember,
];

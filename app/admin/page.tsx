import { redirect } from "next/navigation";
import AdminEventList from "./AdminEventList";
import { requirePageUser } from "@/server/auth/page-user";
import { getDatabase } from "@/server/database/database.souce";
import { Events } from "@/server/database/entities/Event";
import { Role } from "@/server/database/enums/role.enum";

export default async function AdminPage() {
  const user = await requirePageUser("/admin");
  const assignedAdminRoles = user.userRoles.filter(
    (assignment) => assignment.role === Role.ADMIN && assignment.eventId,
  );

  const assignedEventId = assignedAdminRoles[0]?.eventId;

  if (assignedAdminRoles.length === 1 && assignedEventId) {
    const event = await (await getDatabase()).getRepository(Events).findOne({
      where: { id: assignedEventId },
      select: { id: true, slug: true },
    });

    if (event) {
      redirect(`/admin/${encodeURIComponent(event.slug)}`);
    }
  }

  return <AdminEventList />;
}

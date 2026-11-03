import { withHandler } from "@/server/http/handler"
import { success } from "@/server/http/response"
import { getEvents } from "@/server/services/event.service"

export const GET = withHandler(async () => success(await getEvents()))
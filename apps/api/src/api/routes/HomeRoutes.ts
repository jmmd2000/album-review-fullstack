import { Hono } from "hono";
import { HomeService } from "@/api/services/HomeService";

const home = new Hono().get("/", async c => {
  return c.json(await HomeService.getOverview(), 200);
});

export default home;

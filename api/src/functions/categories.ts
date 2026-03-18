import { app, type HttpRequest, type InvocationContext } from "@azure/functions";
import { getCategories } from "../sources";

app.http("categories", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "categories",
  handler: async (req: HttpRequest, _ctx: InvocationContext) => {
    const sourcesParam = req.query.get("sources") ?? "";
    const sourceIds = sourcesParam
      ? sourcesParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    return {
      status: 200,
      jsonBody: { categories: getCategories(sourceIds) },
    };
  },
});

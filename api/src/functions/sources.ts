import { app } from "@azure/functions";
import { listSources } from "../sources";

app.http("sources", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "sources",
  handler: async () => {
    return {
      status: 200,
      jsonBody: {
        sources: listSources(),
      },
    };
  },
});

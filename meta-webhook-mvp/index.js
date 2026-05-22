const express = require("express");
const { serve } = require("inngest/express");
const { inngest } = require("./inngest/client");
const { processFacebookComment } = require("./inngest/functions");

const app = express();
const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = "campaignmind_test_token";

app.use(express.json());

app.get("/webhook/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Meta verification request:", req.query);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook/meta", async (req, res) => {
  console.log("RAW META WEBHOOK EVENT:");
  console.log(JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};

        if (
          change.field === "feed" &&
          value.item === "comment" &&
          value.verb === "add"
        ) {
          console.log("\nNEW FACEBOOK COMMENT RECEIVED");
          console.log("Page ID:", entry.id);
          console.log("Post ID:", value.post_id);
          console.log("Comment ID:", value.comment_id);
          console.log("Message:", value.message);
          console.log("Sender ID:", value.sender_id);
          console.log("Created Time:", value.created_time);
          console.log("----------------------------------\n");

          try {
            const result = await inngest.send({
              name: "facebook/comment.received",
              data: {
                pageId: entry.id,
                postId: value.post_id,
                commentId: value.comment_id,
                message: value.message,
                senderId: value.sender_id,
                createdTime: value.created_time,
              },
            });

            console.log("Queued Inngest event IDs:", result.ids);
          } catch (error) {
            console.error("Failed to queue Inngest event:", error.message);
          }
        }
      }
    }
  }

  return res.sendStatus(200);
});

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [processFacebookComment],
  })
);

app.listen(PORT, () => {
  console.log(`Meta webhook MVP running on http://localhost:${PORT}`);
});

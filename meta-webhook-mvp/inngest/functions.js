const { inngest } = require("./client");

const processFacebookComment = inngest.createFunction(
  {
    id: "process-facebook-comment",
    triggers: { event: "facebook/comment.received" },
  },
  async ({ event, step }) => {
    await step.run("log-comment", async () => {
      console.log("\nINNGEST PROCESSING FACEBOOK COMMENT");
      console.log("Page ID:", event.data.pageId);
      console.log("Post ID:", event.data.postId);
      console.log("Comment ID:", event.data.commentId);
      console.log("Message:", event.data.message);
      console.log("Sender ID:", event.data.senderId);
      console.log("Created Time:", event.data.createdTime);
      console.log("----------------------------------\n");
    });

    return { ok: true };
  }
);

module.exports = { processFacebookComment };

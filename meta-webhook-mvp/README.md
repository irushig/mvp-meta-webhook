# Meta Webhook MVP

Tiny MVP server for testing Facebook Page feed comment webhooks.

The goal of this MVP is only:

```txt
Facebook Page comment -> Meta webhook -> local backend logs the event
```

When a new comment is added to a Facebook Page post, the terminal running this server should print:

```txt
NEW FACEBOOK COMMENT RECEIVED
Page ID: ...
Post ID: ...
Comment ID: ...
Message: ...
Sender ID: ...
Created Time: ...
```

This MVP intentionally does not include Instagram, DMs, database storage, AI classification, reply sending, or HMAC signature verification.

## Project Files

```txt
meta-webhook-mvp/
  index.js
  package.json
  package-lock.json
  .gitignore
```

## How It Was Built

The project was created as a minimal Node.js app:

```cmd
mkdir meta-webhook-mvp
cd meta-webhook-mvp
npm init -y
npm i express
```

The server uses Express and exposes one webhook endpoint:

```txt
GET  /webhook/meta
POST /webhook/meta
```

The GET route is for Meta webhook verification.

The POST route receives webhook events from Meta and logs Page feed comment events.

## Verify Token

The server uses this verify token:

```txt
campaignmind_test_token
```

This value must exactly match the Verify Token entered in the Meta Developer Dashboard.

In code:

```js
const VERIFY_TOKEN = "campaignmind_test_token";
```

## Run The Local Server

Open a terminal:

```cmd
cd "C:\Users\IrushiGunawardana\Documents\mvp facebook\meta-webhook-mvp"
npm.cmd start
```

Expected output:

```txt
Meta webhook MVP running on http://localhost:3000
```

Keep this terminal open.

## Expose The Server With Ngrok

Meta requires an HTTPS callback URL. Since the server runs locally, use ngrok.

Open a second terminal:

```cmd
ngrok http 3000
```

Ngrok will show a forwarding URL like:

```txt
Forwarding https://your-ngrok-url.ngrok-free.dev -> http://localhost:3000
```

Your Meta callback URL is:

```txt
https://your-ngrok-url.ngrok-free.dev/webhook/meta
```

Use the exact URL shown by ngrok. If ngrok shows `.dev`, use `.dev`. If it shows `.app`, use `.app`.

If ngrok says authentication is required, sign in at:

```txt
https://dashboard.ngrok.com/signup
```

Then install your authtoken from:

```txt
https://dashboard.ngrok.com/get-started/your-authtoken
```

Command:

```cmd
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

Then run again:

```cmd
ngrok http 3000
```

## Configure Meta Webhook

Go to:

```txt
Meta Developer Dashboard
-> CampaignMind App
-> Use cases
-> Manage everything on your Page
-> Get real-time notifications with Webhooks
```

Select product:

```txt
Page
```

Configure the webhook:

```txt
Callback URL:
https://your-ngrok-url.ngrok-free.dev/webhook/meta

Verify Token:
campaignmind_test_token
```

Important:

```txt
Attach a client certificate to Webhook requests: OFF
```

Click:

```txt
Verify and save
```

If verification works, the server terminal prints:

```txt
Meta verification request: ...
WEBHOOK_VERIFIED
```

## Subscribe To The Page Feed Webhook

Webhook verification only proves Meta can reach your backend. You must also subscribe the Facebook Page to the app.

Go to:

```txt
Graph API Explorer
```

Use:

```txt
Meta App: CampaignMind
User or Page: MS Club of SLIIT
```

Do not use `User Token` for the subscription call. Use the Page token.

Required permissions:

```txt
pages_show_list
pages_read_engagement
pages_manage_metadata
pages_manage_engagement
pages_read_user_content
```

If Facebook asks to review the access request, click Save.

Confirm the Page ID:

```txt
GET /972640276193556?fields=id,name
```

Expected response:

```json
{
  "id": "972640276193556",
  "name": "MS Club of SLIIT"
}
```

Subscribe the Page to the app:

```txt
POST /972640276193556/subscribed_apps?subscribed_fields=feed
```

Expected response:

```json
{
  "success": true
}
```

Confirm the subscription:

```txt
GET /972640276193556/subscribed_apps
```

Expected response includes:

```json
{
  "name": "CampaignMind",
  "subscribed_fields": [
    "feed"
  ]
}
```

## Test From Meta Dashboard

In the Meta Developer Dashboard:

```txt
Webhooks
-> Page
-> feed
-> Test
-> Send to My Server
```

The server terminal should print:

```txt
RAW META WEBHOOK EVENT:
...
```

This proves:

```txt
Meta Dashboard -> ngrok -> Express server
```

is working.

## Test A Real Facebook Comment

Keep both terminals open:

```txt
Terminal 1: npm.cmd start
Terminal 2: ngrok http 3000
```

Then:

```txt
1. Go to the MS Club of SLIIT Facebook Page.
2. Open any Page post.
3. Add a new comment.
4. Watch the server terminal.
```

Expected output:

```txt
RAW META WEBHOOK EVENT:
...

NEW FACEBOOK COMMENT RECEIVED
Page ID: 972640276193556
Post ID: ...
Comment ID: ...
Message: ...
Sender ID: ...
Created Time: ...
----------------------------------
```

Any Page post can be used. It does not have to be one exact post.

## What A Delete Event Looks Like

If a comment is deleted, Meta may send:

```json
{
  "item": "comment",
  "verb": "remove"
}
```

This proves the webhook is working, but the MVP only prints `NEW FACEBOOK COMMENT RECEIVED` for:

```json
{
  "item": "comment",
  "verb": "add"
}
```

Add a fresh comment and do not delete it to test the new comment log.

## Development Mode Limitation

If the Meta app is in Development Mode, real webhook events only work for people who have a role in the app.

For testing, make sure the Facebook account adding the comment is added under:

```txt
Meta Developer Dashboard
-> App roles
```

Allowed roles include:

```txt
Admin
Developer
Tester
```

The account should also be able to manage or access the Facebook Page being tested.

## Existing Comments

Existing comments do not arrive through webhooks.

Webhooks only notify the server about new events after the Page is subscribed.

To fetch old comments, use Graph API:

```txt
GET /972640276193556/posts
```

Pick a post ID, then:

```txt
GET /POST_ID/comments?fields=id,message,from,created_time,permalink_url
```

Webhook:

```txt
New events only
```

Graph API:

```txt
Existing data and historical comments
```

## Troubleshooting

If Meta says the callback URL or verify token could not be validated:

Check that the local server is running:

```cmd
npm.cmd start
```

Check that ngrok is running:

```cmd
ngrok http 3000
```

Check that the callback URL includes the webhook path:

```txt
https://your-ngrok-url.ngrok-free.dev/webhook/meta
```

Check that the verify token is exact:

```txt
campaignmind_test_token
```

Check that client certificate is off:

```txt
Attach a client certificate to Webhook requests: OFF
```

If the ngrok URL says offline, restart ngrok and copy the new forwarding URL into Meta.

If Graph API returns:

```json
{
  "data": []
}
```

for:

```txt
GET /972640276193556/subscribed_apps
```

then the Page is not subscribed yet. Run:

```txt
POST /972640276193556/subscribed_apps?subscribed_fields=feed
```

with the Page token.

If real comments do not arrive:

```txt
1. Confirm the Page is subscribed to feed.
2. Confirm the Webhooks product has the Page feed field subscribed.
3. Confirm npm and ngrok terminals are both open.
4. Confirm the app-role user is making the test comment.
5. Add a new comment after the subscription is active.
```

## Current MVP Status

This MVP has been tested successfully.

Confirmed working:

```txt
Local verification endpoint returns 200
Meta webhook verification prints WEBHOOK_VERIFIED
Page subscription returns success true
GET subscribed_apps shows CampaignMind subscribed to feed
Real Page feed webhook events reach the local terminal
```

Next MVP step:

```txt
Take comment_id
-> Fetch full comment from Graph API
-> Save into inbox_messages table
```

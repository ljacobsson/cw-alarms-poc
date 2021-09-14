const { WebClient } = require("@slack/web-api");
const token = process.env.SlackToken;
const slack = new WebClient(token);

exports.handler = async function (event) {
  if (!event.message.Item) {
    return event;
  }
  const channel = event.message.Item.channel.S;
  const message = await slack.conversations.history({
    channel: channel,
    latest: event.message.Item.ts.S,
    limit: 1,
    inclusive: true,
  });
  const blocks = message.messages[0].blocks;
  const dateDiff =
    Date.parse(event.detail.state.timestamp) -
    Date.parse(event.detail.previousState.timestamp);
  blocks.splice(1, 0, {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `:white_check_mark: Recovered after ${Math.floor(
        dateDiff / 1000 / 60
      )} minutes`,
    },
  });
  const result = await slack.chat.update({
    channel: channel,
    ts: event.message.Item.ts.S,
    blocks: blocks,
  });

  return event;
};

const { WebClient } = require("@slack/web-api");
const token = process.env.SlackToken;
const slack = new WebClient(token);
const fs = require("fs");

exports.handler = async function (event) {
  const channel = `alerts-${event.tags.team}-${process.env.Environment}`;
  const service = event.detail.alarmName.split(":")[2];
  const resourceName = event.detail.alarmName.split(":")[1];
  const stack =
    event.tags["aws:cloudformation:stack-name"] ||
    resourceName.split(/(?=-[A-Z])/)[0];
  const split = resourceName.split("-");
  split.pop();
  const logicalName =
    event.tags["aws:cloudformation:logical-id"] || split.pop();

  let linkParser;
  if (fs.existsSync(`./src/${service}/linkParser.js`)) {
    linkParser = require(`./${service}/linkParser`);
  }
  let cursor;
  let found = false;

  do {
    const list = await slack.conversations.list({
      exclude_archived: true,
      cursor: cursor,
    });
    const existing = list.channels.filter((p) => p.name === channel);
    if (existing.length) {
      found = true;
      event.channelId = existing[0].id;
      break;
    }
    cursor = list.response_metadata.next_cursor;
  } while (cursor);
  console.log("found ", found);
  if (!found) {
    await slack.conversations.create({ name: channel });
    console.log(`Created ${channel}`);
  }

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${logicalName}*: ${event.detail.configuration.description}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Alarm :aws:",
            emoji: true,
          },
          value: "alarm_link",
          url: `https://${process.env.AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION}#alarmsV2:alarm/${event.detail.alarmName}`,
          action_id: "actionId-0",
        },
      ],
    },
  ];

  if (linkParser) {
    blocks[1].elements.push({
      type: "button",
      text: {
        type: "plain_text",
        text: "Resource :aws:",
        emoji: true,
      },
      value: "resource_link",
      url: linkParser.getConsoleLink(resourceName),
      action_id: "actionId-1",
    });
  }

  const result = await slack.chat.postMessage({
    text: event.detail.alarmName + " is in alarm state",
    channel: `#${channel}`,
    username: "Alert for " + stack,
    icon_emoji: ":alert:",
    blocks: blocks,
  });
  event.ts = result.ts;
  return event;
};

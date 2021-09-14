const AWS = require("aws-sdk");
const logs = new AWS.CloudWatchLogs();
const { WebClient } = require("@slack/web-api");
const token = process.env.SlackToken;
const slack = new WebClient(token);

exports.handler = async function (event) {
  const resourceName = event.detail.alarmName.split(":")[1];
  const events = [];
  let token;
  do {
    const logEvents = await logs
      .filterLogEvents({
        logGroupName: `/aws/lambda/${resourceName}`,
        filterPattern: "?Exception ?ERROR ?timed",
        nextToken: token,
        startTime: new Date().getTime() - 60 * 60 * 1000,
      })
      .promise();
    events.push(
      ...logEvents.events.map((p) => {
        return { message: p.message, time: p.ingestionTime };
      })
    );
    token = logEvents.nextToken;
  } while (token);
  const latest = events.pop();
  await slack.chat.postMessage({
    channel: event.channelId,
    thread_ts: event.ts,
    text: `Latest <https://eu-west-1.console.aws.amazon.com/cloudwatch/home?region=eu-west-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${resourceName}|error log>:
\`\`\`${latest.message}\`\`\``,
    mrkdwn: true,
    icon_emoji: ":aws:",
    username: "CloudWatch Logs"
  });
  return event;
};

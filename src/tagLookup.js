const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

exports.handler = async function (event) {
  const tags = await cloudwatch
    .listTagsForResource({ ResourceARN: event.resources[0] })
    .promise();
  console.log(tags);
  const tagMap = {};
  for (const tag of tags.Tags) {
    tagMap[tag.Key] = tag.Value
  }
  event.tags = tagMap;
  event.tags.team = event.tags.team || "noteam";
  return event;
};

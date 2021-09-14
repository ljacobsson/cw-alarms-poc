const AWS = require("aws-sdk");
function getConsoleLink(resourceName) {
  return `https://${AWS.config.region}.console.aws.amazon.com/lambda/home?region=${AWS.config.region}#/functions/${resourceName}?tab=monitoring`;
}

module.exports = {
    getConsoleLink
}

const AWS = require("aws-sdk");
const cloudWatch = new AWS.CloudWatch();

exports.handler = async (event, context) => {
  const functionName = event.functionName;
  await cloudWatch.deleteAlarms({
    AlarmNames: [`auto:${functionName}:lambda:errors:anomaly`],
  }).promise();
  await cloudWatch.deleteAnomalyDetector({
    MetricName: `Errors`,
    Namespace: "AWS/Lambda",
    Stat: "Sum",
    Dimensions: [{ Name: "FunctionName", Value: functionName }],
  }).promise();
};

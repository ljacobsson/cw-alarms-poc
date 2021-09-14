const CloudWatch = require("aws-sdk/clients/cloudwatch");
const cloudWatch = new CloudWatch();

exports.handler = async (event) => {
  const functionName = event.functionName;
  const tags = event.tags;

  const threshold = tags["alarm:lambda:errors:anomaly:threshold"] || 2;
  await cloudWatch
    .putAnomalyDetector({
      MetricName: `Errors`,
      Namespace: "AWS/Lambda",
      Stat: "Sum",
      Dimensions: [{ Name: "FunctionName", Value: functionName }],
    })
    .promise();

  const response = await cloudWatch
    .putMetricAlarm({
      AlarmName: `auto:${functionName}:lambda:errors:anomaly`,
      AlarmDescription: `Error anomaly detected`,
      ComparisonOperator: "LessThanLowerOrGreaterThanUpperThreshold",
      Metrics: [
        {
          Id: "ad1",
          Expression: `ANOMALY_DETECTION_BAND(m1, ${threshold})`,
        },
        {
          Id: "m1",
          MetricStat: {
            Metric: {
              MetricName: "Errors",
              Namespace: "AWS/Lambda",
              Dimensions: [{ Name: "FunctionName", Value: functionName }],
            },
            Period: 300,
            Stat: "Sum",
          },
        },
      ],
      Tags: Object.keys(tags).map((p) => {
        return { Key: p, Value: tags[p] };
      }),
      EvaluationPeriods: 2,
      ThresholdMetricId: "ad1",
      TreatMissingData: "ignore",
    })
    .promise();

};

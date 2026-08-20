import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns_subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class EventStack extends cdk.Stack {
  public readonly complaintTopic: sns.Topic;
  public readonly complaintQueue: sqs.Queue;
  public readonly complaintDLQ: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.complaintDLQ = new sqs.Queue(this, 'ComplaintDLQ', {
      queueName: 'complaint-dlq',
      retentionPeriod: cdk.Duration.days(14),
    });

    this.complaintQueue = new sqs.Queue(this, 'ComplaintQueue', {
      queueName: 'complaint-queue',
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        queue: this.complaintDLQ,
        maxReceiveCount: 3,
      },
    });

    this.complaintTopic = new sns.Topic(this, 'ComplaintTopic', {
      topicName: 'complaint-events',
    });

    this.complaintTopic.addSubscription(
      new sns_subs.SqsSubscription(this.complaintQueue)
    );
  }
}

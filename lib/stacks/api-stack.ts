import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda_events from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';

interface ApiStackResources {
  complaintsTable: dynamodb.Table;
  complaintTopic: sns.Topic;
  complaintQueue: sqs.Queue;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps, resources?: ApiStackResources) {
    super(scope, id, props);

    const { complaintsTable, complaintTopic, complaintQueue } = resources!;

    const createComplaintLambda = new NodejsFunction(this, 'CreateComplaintFunction', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_24_X,
      handler: 'handler',
      entry: path.join(__dirname, '../resources/lambdas/create-complaint.ts'),
      environment: {
        TABLE_NAME: complaintsTable.tableName,
        TOPIC_ARN: complaintTopic.topicArn,
      },
    });

    const getComplaintLambda = new NodejsFunction(this, 'GetComplaintFunction', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_24_X,
      handler: 'handler',
      entry: path.join(__dirname, '../resources/lambdas/get-complaint.ts'),
      environment: {
        TABLE_NAME: complaintsTable.tableName,
      },
    });

    const processComplaintLambda = new NodejsFunction(this, 'ProcessComplaintFunction', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_24_X,
      handler: 'handler',
      entry: path.join(__dirname, '../resources/lambdas/process-complaint.ts'),
      timeout: cdk.Duration.seconds(60),
      environment: {
        TABLE_NAME: complaintsTable.tableName,
      },
    });

    // Grant permissions
    complaintsTable.grantReadWriteData(createComplaintLambda);
    complaintsTable.grantReadData(getComplaintLambda);

    complaintsTable.grantWriteData(processComplaintLambda); 
    complaintTopic.grantPublish(createComplaintLambda);
    complaintQueue.grantConsumeMessages(processComplaintLambda); 

    processComplaintLambda.addEventSource(
      new lambda_events.SqsEventSource(complaintQueue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      })
    );

    const api = new apigateway.RestApi(this, 'ComplaintsApi', {
      restApiName: 'Complaints Service',
      description: 'Serverless Complaints API',
    });

    const complaintsResource = api.root.addResource('complaints');
    complaintsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createComplaintLambda)
    );

    const idResource = complaintsResource.addResource('{id}');
    idResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getComplaintLambda)
    );

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });
  }
}

#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { EventStack } from '../lib/stacks/event-stack';
import { ApiStack } from '../lib/stacks/api-stack';

const app = new cdk.App();

const dbStack = new DatabaseStack(app, 'DatabaseStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

const eventStack = new EventStack(app, 'EventStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

new ApiStack(app, 'ApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
}, {
  complaintsTable: dbStack.complaintsTable,
  complaintTopic: eventStack.complaintTopic,
  complaintQueue: eventStack.complaintQueue,
});

app.synth();

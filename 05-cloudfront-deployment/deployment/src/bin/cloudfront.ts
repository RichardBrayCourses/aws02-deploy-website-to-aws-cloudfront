#!/usr/bin/env node
import { resolve } from "path";
import { config } from "dotenv";
import * as cdk from "aws-cdk-lib";

config({ path: resolve(__dirname, "..", "..", ".env") });
import { CloudFrontStack } from "../lib/cloudfrontStack";

const bucketName = process.env.CDK_UI_BUCKETNAME;
if (!bucketName) {
  throw new Error("Set CDK_UI_BUCKETNAME in deployment/.env.");
}

const app = new cdk.App();
new CloudFrontStack(app, "ui-cloudfront", { bucketName });

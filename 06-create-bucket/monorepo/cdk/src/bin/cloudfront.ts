import * as cdk from "aws-cdk-lib";
import { CloudfrontStack } from "../lib/cloudfrontStack";

const app = new cdk.App();
new CloudfrontStack(app, "cloudfront-website");

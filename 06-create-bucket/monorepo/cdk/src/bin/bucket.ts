#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BucketStack } from "../lib/bucketStack.js";

const app = new cdk.App();
new BucketStack(app, "lesson-bucket");

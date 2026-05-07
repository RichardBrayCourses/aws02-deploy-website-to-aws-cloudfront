/*
  This stack defines the production shape of the lesson UI: static files live in a private S3
  bucket, users never talk to S3 directly, and CloudFront is the only public front door. CDK
  wires up origin access control (OAC) so CloudFront may read objects while the bucket stays
  non-public, then uploads the built Vite bundle and can invalidate the CDN when files change.
*/

import { join } from "path";
import { Duration, CfnOutput, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { Bucket, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";

/*
  CDK runs from compiled-or-interpreted code under `deployment/`, but the UI build output is
  produced next to it under `ui/dist`. This path walks up to the lesson root and into `ui/dist`,
  so you must run a production build of the UI before deploy; otherwise the asset path is empty
  or stale.
*/
const uiDist = join(__dirname, "..", "..", "..", "ui", "dist");

export interface CloudFrontStackProps extends StackProps {
  /* S3 bucket names are globally unique in AWS; the app id reads this from `deployment/.env`. */
  bucketName: string;
}

export class CloudFrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);

    /*
      The website bucket does not use a public bucket policy. Instead, CloudFront will be
      granted read access via OAC below. `BLOCK_ALL` makes that intent explicit: object URLs
      on the bucket hostname stay unusable for anonymous web browsing. For a lesson stack we
      also enable `autoDeleteObjects` and `DESTROY` so teardown removes content and the bucket
      without lingering manual cleanup.
    */
    const bucket = new Bucket(this, "UiBucket", {
      bucketName: props.bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    /*
      The distribution is what you give browsers: a CloudFront hostname and HTTPS. The default
      behavior attaches this bucket as an origin using OAC, so only CloudFront can fetch objects.
      `REDIRECT_TO_HTTPS` avoids serving the site over plain HTTP. `defaultRootObject` makes
      requests to `/` return `index.html`, which is what a typical SPA entry point needs.
    */
    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      /*
        Client-side routers (React Router and friends) use paths like `/profile` that are not
        real objects in S3. A first load to those URLs would otherwise become a 403/404 from the
        origin. Mapping those statuses to `200` + `/index.html` serves the SPA shell so the
        router can run in the browser. `ttl: 0` avoids long caching of these synthetic responses.
      */
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.seconds(0),
        },
      ],
    });

    /*
      This construct zips the local `uiDist` folder and uploads it to the bucket during deploy.
      Passing `distribution` with `distributionPaths` triggers a cache invalidation so visitors
      see new HTML and assets soon after a release instead of stale CloudFront copies.
    */
    new BucketDeployment(this, "DeployUi", {
      sources: [Source.asset(uiDist)],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    /*
      CloudFront assigns a domain name like `d111111abcdef8.cloudfront.net`. Outputs appear in
      the CDK CLI after deploy so you have a single obvious URL to open without digging through
      the console.
    */
    new CfnOutput(this, "SiteUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "Open this URL in a browser after deploy finishes",
    });
  }
}

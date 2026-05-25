import { CfnOutput, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export class CloudfrontStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const websiteBucket = new Bucket(this, "CloudfrontWebsiteBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });

    const distribution = new Distribution(this, "CloudfrontDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    const distributionDomain = `https://${distribution.distributionDomainName}`;

    new StringParameter(this, "CloudfrontDistributionDomainParameter", {
      parameterName: "/cloudfront/distribution-domain",
      stringValue: distributionDomain,
    });

    new StringParameter(this, "CloudfrontDistributionIdParameter", {
      parameterName: "/cloudfront/distribution-id",
      stringValue: distribution.distributionId,
    });

    new StringParameter(this, "WebsiteBucketNameParameter", {
      parameterName: "/cloudfront/website-bucket-name",
      stringValue: websiteBucket.bucketName,
    });

    new CfnOutput(this, "CloudfrontDistributionDomainName", {
      value: distribution.distributionDomainName,
    });

    new CfnOutput(this, "CloudfrontDistributionUrl", {
      value: distributionDomain,
    });

    new CfnOutput(this, "CloudfrontDistributionId", {
      value: distribution.distributionId,
    });

    new CfnOutput(this, "WebsiteBucketName", {
      value: websiteBucket.bucketName,
    });
  }
}

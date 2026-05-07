# CloudFront deployment lesson

This lesson extends [lesson 04](../04-bootstrap/README.md). Follow the numbered steps in order to transform lesson 04 into lesson 05.

# Step 1 - Create the deployment code files first

Under the lesson root, create the source folders and files first:

- `deployment/src/bin/cloudfront.ts`
- `deployment/src/lib/cloudfrontStack.ts`

Add this to `deployment/src/lib/cloudfrontStack.ts`:

```typescript
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
```

Then add this to `deployment/src/bin/cloudfront.ts`:

```typescript
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
```

# Step 2 - Add the environment variable file

Create `deployment/.env` and set a globally unique S3 bucket name:

```env
CDK_UI_BUCKETNAME=your-unique-bucket-name
```

`cloudfront.ts` reads this value and throws if it is missing.

# Step 3 - Add deployment/package.json

Create `deployment/package.json` so the new workspace package can run CDK:

```json
{
  "name": "@root/deployment",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "deploy": "cdk deploy ui-cloudfront --require-approval never --app 'tsx ./src/bin/cloudfront.ts'",
    "destroy": "cdk destroy ui-cloudfront --force --require-approval never --app 'tsx ./src/bin/cloudfront.ts'",
    "synth": "cdk synth --app 'tsx ./src/bin/cloudfront.ts'",
    "diff": "cdk diff --app 'tsx ./src/bin/cloudfront.ts'",
    "type-check": "tsc --noEmit",
    "package-cleanup": "rm -rf node_modules dist cdk.out"
  },
  "dependencies": {
    "aws-cdk-lib": "2.235.1",
    "constructs": "10.4.5"
  },
  "devDependencies": {
    "@types/node": "25.0.3",
    "aws-cdk": "2.1101.0",
    "dotenv": "17.2.3",
    "tsx": "4.21.0",
    "typescript": "5.9.3"
  }
}
```

# Step 4 - Add deployment/tsconfig.json

Create `deployment/tsconfig.json`:

```json
{
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["es2022"],
    "esModuleInterop": true,
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules", "cdk.out", "dist"]
}
```

# Step 5 - Add deployment/cdk.json

Create `deployment/cdk.json`:

```json
{
  "notices": false
}
```

# Step 6 - Add root scripts to run deployment

In the lesson root `package.json`, add:

```json
    "deploy-cloudfront": "pnpm -F @root/ui build && pnpm -F @root/deployment run deploy",
    "destroy-cloudfront": "pnpm -F @root/deployment run destroy",
```

`deploy-cloudfront` builds the Vite app and deploys the CDK stack. `destroy-cloudfront` tears down the stack.

# Step 7 - Allow AWS SDK build in pnpm workspace

In `pnpm-workspace.yaml`, add `aws-sdk: true` under `allowBuilds`:

```yaml
allowBuilds:
  aws-sdk: true
  esbuild: true
  msw: true
```

# Step 8 - Install dependencies

From the lesson root, run:

```bash
pnpm install
```

This picks up the new `@root/deployment` package and updates `pnpm-lock.yaml`.

# Step 9 - Ensure AWS credentials and bootstrap are ready

Make sure your AWS credentials target the right account/region. Run lesson 04 bootstrap if required for your target account and regions.

# Step 10 - Deploy CloudFront + S3

From the lesson root:

```bash
pnpm run deploy-cloudfront
```

After deploy completes, copy the `SiteUrl` output and open it in a browser.

# Step 11 - Destroy when finished

```bash
pnpm run destroy-cloudfront
```

This deletes the `ui-cloudfront` stack and removes uploaded objects because the bucket uses `autoDeleteObjects` and `RemovalPolicy.DESTROY`.

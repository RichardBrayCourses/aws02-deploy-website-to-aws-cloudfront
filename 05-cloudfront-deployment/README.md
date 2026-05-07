# CloudFront deployment lesson

This lesson extends [lesson 04](../04-bootstrap/README.md). You should have the bootstrap folder, root `package.json` scripts for `bootstrap-up` / `bootstrap-down`, and a working `ui` app. Below are the edits that turn that tree into this one: a CDK app that builds the UI, uploads it to a private S3 bucket, fronts it with CloudFront (with OAC and SPA-style error routing), and exposes root scripts to deploy or destroy the stack.

# Allow the AWS CDK v2 build script in pnpm

At the **lesson root** (same folder as this README), edit `pnpm-workspace.yaml`. Under `allowBuilds`, add `aws-sdk: true` so pnpm can run the `aws-sdk` postinstall used by the CDK CLI. The block should look like this:

```yaml
allowBuilds:
  aws-sdk: true
  esbuild: true
  msw: true
```

# Add deploy and destroy scripts to the root package.json

In the root `package.json`, add two scripts beside your existing `bootstrap-up`, `bootstrap-down`, and `dev` entries:

```json
    "deploy-cloudfront": "pnpm -F @root/ui build && pnpm -F @root/deployment run deploy",
    "destroy-cloudfront": "pnpm -F @root/deployment run destroy",
```

`deploy-cloudfront` builds the Vite UI into `ui/dist`, then runs CDK deploy. `destroy-cloudfront` tears down the stack.

# Create the deployment package folder layout

Under the lesson root, create:

- `deployment/package.json`
- `deployment/cdk.json`
- `deployment/tsconfig.json`
- `deployment/.env` (local only; do not commit real bucket names if this repo is shared)
- `deployment/src/bin/cloudfront.ts`
- `deployment/src/lib/cloudfrontStack.ts`

With `pnpm-workspace.yaml` using `packages: - ./*`, the new `deployment` directory is picked up automatically once it contains a `package.json`.

# Add deployment/package.json

Create `deployment/package.json` with the CDK app name `@root/deployment`, scripts that invoke CDK via `tsx` on the bin entry, and dependencies aligned with AWS CDK v2:

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

# Add deployment/cdk.json

Minimal `cdk.json` (optional notices disabled):

```json
{
  "notices": false
}
```

# Add deployment/tsconfig.json

TypeScript config for CDK + Node:

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

# Configure deployment/.env

Create `deployment/.env` in the **deployment** directory (same folder as `package.json`). Define a **globally unique** S3 bucket name (S3 names are global across AWS):

```env
CDK_UI_BUCKETNAME=your-unique-bucket-name
```

The CDK bin loads this file and throws if `CDK_UI_BUCKETNAME` is missing.

# Add deployment/src/bin/cloudfront.ts

Entry point: load `.env`, read the bucket name, instantiate the stack.

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

# Add deployment/src/lib/cloudfrontStack.ts

Stack definition: private S3 bucket, CloudFront with OAC to the bucket, SPA fallbacks (403/404 → `index.html`), `BucketDeployment` from `ui/dist`, and invalidation on deploy. The UI build output path is `join(__dirname, "..", "..", "..", "ui", "dist")` relative to `deployment/src/lib` (run `pnpm -F @root/ui build` before deploy).

```typescript
import { join } from "path";
import { Duration, CfnOutput, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { Bucket, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";

/** Built Vite app: run `pnpm -F @root/ui build` before `cdk deploy`. */
const uiDist = join(__dirname, "..", "..", "..", "ui", "dist");

export interface CloudFrontStackProps extends StackProps {
  /** From `CDK_UI_BUCKETNAME` in deployment/.env (globally unique). */
  bucketName: string;
}

export class CloudFrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "UiBucket", {
      bucketName: props.bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
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

    new BucketDeployment(this, "DeployUi", {
      sources: [Source.asset(uiDist)],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new CfnOutput(this, "SiteUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "Open this URL in a browser after deploy finishes",
    });
  }
}
```

# Install dependencies from the lesson root

From the lesson root directory:

```bash
pnpm install
```

This links `@root/deployment` into the workspace and updates `pnpm-lock.yaml`.

# Use AWS credentials and CDK bootstrap (from lesson 04)

Ensure your AWS CLI or environment credentials target the account and region you want. Run lesson 04’s bootstrap once per account/region pair as needed (your `bootstrap-up.sh` should match how you deploy).

# Deploy the site and CloudFront stack

From the lesson root:

```bash
pnpm run deploy-cloudfront
```

After deploy completes, note the **SiteUrl** in the CDK output (HTTPS URL for the distribution). Open it in a browser.

# Destroy the stack when finished experimenting

```bash
pnpm run destroy-cloudfront
```

This removes the stack created as `ui-cloudfront` (bucket with `autoDeleteObjects` and `RemovalPolicy.DESTROY` is cleared with the stack).

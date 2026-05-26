#!/usr/bin/env bash

set -euo pipefail

WEBSITE_BUCKET_NAME_PARAMETER="/cloudfront/website-bucket-name"

UI_DIST_DIR="apps/ui/dist"

echo ""
echo "Reading website bucket name from SSM Parameter Store..."
echo ""

WEBSITE_BUCKET_NAME=$(aws ssm get-parameter \
  --name "$WEBSITE_BUCKET_NAME_PARAMETER" \
  --query "Parameter.Value" \
  --output text)

echo "Uploading $UI_DIST_DIR to s3://$WEBSITE_BUCKET_NAME"
echo ""

aws s3 sync "$UI_DIST_DIR" "s3://$WEBSITE_BUCKET_NAME" --delete

echo ""
echo "Upload complete."
echo ""

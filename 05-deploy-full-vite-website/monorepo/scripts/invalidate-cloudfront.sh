#!/usr/bin/env bash

set -euo pipefail

DISTRIBUTION_ID_PARAMETER="/cloudfront/distribution-id"

echo ""
echo "Reading CloudFront distribution ID from SSM Parameter Store..."
echo ""

DISTRIBUTION_ID=$(MSYS_NO_PATHCONV=1 aws ssm get-parameter \
  --name "$DISTRIBUTION_ID_PARAMETER" \
  --query "Parameter.Value" \
  --output text)

echo "Creating CloudFront invalidation for distribution:"
echo "$DISTRIBUTION_ID"
echo ""

MSYS_NO_PATHCONV=1 aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"

echo ""
echo "Invalidation requested."
echo ""

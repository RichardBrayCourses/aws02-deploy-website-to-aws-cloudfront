#!/usr/bin/env bash

set -euo pipefail

REGION="eu-west-2"

DISTRIBUTION_ID_PARAMETER="/cloudfront/distribution-id"

echo ""
echo "Reading CloudFront distribution ID from SSM Parameter Store..."
echo ""

DISTRIBUTION_ID=$(aws ssm get-parameter \
  --name "$DISTRIBUTION_ID_PARAMETER" \
  --region "$REGION" \
  --query "Parameter.Value" \
  --output text)

echo "Creating CloudFront invalidation for distribution:"
echo "$DISTRIBUTION_ID"
echo ""

aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"

echo ""
echo "Invalidation requested."
echo ""

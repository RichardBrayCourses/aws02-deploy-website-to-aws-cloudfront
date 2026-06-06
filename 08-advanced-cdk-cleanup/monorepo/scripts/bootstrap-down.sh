#!/bin/bash

# Delete the CDK bootstrap stack from your main region

aws cloudformation delete-stack --stack-name "CDKToolkit" --region "eu-west-2"


# The CDK bootstrap process may leave behind versioned S3 buckets containing old deployment assets

./bootstrap-delete-buckets.sh

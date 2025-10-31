#!/bin/bash

# Deployment script for Tathyas AI Parenting App to AWS

set -e

echo "🚀 Starting deployment to AWS..."

# Check if required environment variables are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ Error: AWS credentials not set"
    echo "Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    exit 1
fi

# Configuration
BUCKET_NAME="tathyas-parenting-app"
DISTRIBUTION_ID="YOUR_CLOUDFRONT_DISTRIBUTION_ID"  # Replace with actual ID
REGION="us-east-1"

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application for production..."
npm run build:prod

if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "☁️  Uploading to S3 bucket: $BUCKET_NAME..."
aws s3 sync dist/ s3://$BUCKET_NAME --delete --region $REGION

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --region $REGION

echo "✅ Deployment complete!"
echo "🌐 App available at: https://app.tathyas.in"
echo "📊 Check CloudFront for cache invalidation status"
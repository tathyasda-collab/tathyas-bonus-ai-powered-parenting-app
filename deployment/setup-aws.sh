#!/bin/bash

# Complete AWS setup script for Tathyas AI Parenting App

set -e

echo "🚀 Tathyas AI Parenting App - AWS Setup Script"
echo "=============================================="

# Configuration
DOMAIN="bonusaiapp.tathyas.in"
BUCKET_NAME="tathyas-parenting-app"
REGION="us-east-1"
STACK_NAME="tathyas-parenting-app-stack"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

print_status "Prerequisites check passed"

# Step 1: Create S3 bucket
echo "📦 Step 1: Creating S3 bucket..."
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION
    print_status "S3 bucket created: $BUCKET_NAME"
else
    print_warning "S3 bucket already exists: $BUCKET_NAME"
fi

# Step 2: Enable static website hosting
echo "🌐 Step 2: Configuring static website hosting..."
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html
print_status "Static website hosting configured"

# Step 3: Apply bucket policy
echo "🔒 Step 3: Applying bucket policy..."
aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file://deployment/s3-bucket-policy.json
print_status "Bucket policy applied"

# Step 4: Request SSL certificate
echo "🔐 Step 4: Requesting SSL certificate..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name $DOMAIN \
    --validation-method DNS \
    --region $REGION \
    --query 'CertificateArn' \
    --output text)

print_status "SSL certificate requested: $CERT_ARN"
print_warning "Please validate the certificate in AWS Console before proceeding"

# Step 5: Get hosted zone ID
echo "🗂️  Step 5: Finding Route 53 hosted zone..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='tathyas.in.'].Id" \
    --output text | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    print_error "Hosted zone for tathyas.in not found"
    print_warning "Please create a hosted zone for tathyas.in first"
    exit 1
fi

print_status "Found hosted zone: $HOSTED_ZONE_ID"

# Step 6: Deploy CloudFormation stack
echo "☁️  Step 6: Deploying CloudFormation stack..."
print_warning "This step requires the SSL certificate to be validated first"
read -p "Has the SSL certificate been validated? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    aws cloudformation deploy \
        --template-file deployment/cloudformation-template.yml \
        --stack-name $STACK_NAME \
        --parameter-overrides \
            DomainName=$DOMAIN \
            CertificateArn=$CERT_ARN \
            HostedZoneId=$HOSTED_ZONE_ID \
        --capabilities CAPABILITY_IAM

    print_status "CloudFormation stack deployed"
    
    # Get CloudFront distribution ID
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
        --output text)
    
    print_status "CloudFront Distribution ID: $DISTRIBUTION_ID"
else
    print_warning "Skipping CloudFormation deployment. Run this script again after certificate validation."
fi

# Step 7: Build and deploy app
echo "🔨 Step 7: Building and deploying application..."
npm ci
npm run build:prod

aws s3 sync dist/ "s3://$BUCKET_NAME" --delete

if [ ! -z "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*"
    print_status "CloudFront cache invalidated"
fi

print_status "Application deployed successfully!"

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "📋 Summary:"
echo "• S3 Bucket: $BUCKET_NAME"
echo "• Domain: https://$DOMAIN"
echo "• SSL Certificate: $CERT_ARN"
echo "• Hosted Zone: $HOSTED_ZONE_ID"
if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo "• CloudFront Distribution: $DISTRIBUTION_ID"
fi
echo ""
echo "📝 Next Steps:"
echo "1. Deploy Supabase Edge Functions for security:"
echo "   cd supabase && bash deploy-functions.sh"
echo "2. Verify SSL certificate validation in AWS Console"
echo "3. Check DNS propagation for $DOMAIN"
echo "4. Test the application at https://$DOMAIN"
echo "5. Set up monitoring and alerts"
echo "6. Configure GitHub Actions secrets for CI/CD"
echo ""
echo "🔗 GitHub Actions Secrets to configure:"
echo "• AWS_ACCESS_KEY_ID"
echo "• AWS_SECRET_ACCESS_KEY"
echo "• CLOUDFRONT_DISTRIBUTION_ID (if available)"
echo "• VITE_SUPABASE_URL"
echo "• VITE_SUPABASE_ANON_KEY"
echo ""
echo "🔒 Security Note:"
echo "• Gemini API key is now secure in Supabase Edge Functions"
echo "• No API keys are exposed in the frontend"
echo "• Deploy edge functions before testing AI features"
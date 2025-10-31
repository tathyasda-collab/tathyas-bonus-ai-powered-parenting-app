# AWS Deployment Guide for Tathyas AI-Powered Parenting App

## Overview
Deploy the React/Vite parenting app to AWS using CloudFront + S3 for the frontend and integrate with existing tathyas.in domain.

## Architecture Options

### Option 1: Subdomain (Recommended)
- Main site: `tathyas.in`
- App: `app.tathyas.in` or `parenting.tathyas.in`
- Clean separation, easier management

### Option 2: Subdirectory
- Main site: `tathyas.in`
- App: `tathyas.in/parenting-app/`
- Shared domain, requires routing configuration

## Phase 1: Application Preparation

### 1.1 Update Environment Configuration

Create production environment files:

```bash
# .env.production
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
VITE_GEMINI_API_KEY=your_production_gemini_api_key
VITE_APP_URL=https://app.tathyas.in
```

### 1.2 Update Vite Configuration for Production

```typescript
// vite.config.ts updates needed
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: mode === 'production' ? '/parenting-app/' : '/', // if using subdirectory
      // OR
      base: mode === 'production' ? '/' : '/', // if using subdomain
      
      build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              supabase: ['@supabase/supabase-js'],
            }
          }
        }
      },
      server: {
        port: 3001,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // ... rest of config
    };
});
```

### 1.3 Build Optimization

```json
// package.json scripts
{
  "scripts": {
    "build": "tsc && vite build",
    "build:prod": "tsc && vite build --mode production",
    "preview": "vite preview",
    "deploy": "npm run build:prod && aws s3 sync dist/ s3://your-bucket-name --delete"
  }
}
```

## Phase 2: AWS Infrastructure Setup

### 2.1 S3 Bucket Creation

```bash
# AWS CLI commands
aws s3 mb s3://tathyas-parenting-app --region us-east-1

# Enable static website hosting
aws s3 website s3://tathyas-parenting-app \
  --index-document index.html \
  --error-document index.html
```

### 2.2 S3 Bucket Policy for Public Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tathyas-parenting-app/*"
    }
  ]
}
```

### 2.3 CloudFront Distribution Setup

```json
// CloudFront configuration
{
  "DistributionConfig": {
    "CallerReference": "tathyas-parenting-app-2024",
    "Comment": "Tathyas AI Parenting App",
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-tathyas-parenting-app",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad", // Managed-CachingDisabled
      "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" // Managed-CORS-S3Origin
    },
    "Origins": [
      {
        "Id": "S3-tathyas-parenting-app",
        "DomainName": "tathyas-parenting-app.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ],
    "Enabled": true,
    "Aliases": ["app.tathyas.in"],
    "ViewerCertificate": {
      "AcmCertificateArn": "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID",
      "SslSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "CustomErrorResponses": [
      {
        "ErrorCode": 404,
        "ResponseCode": 200,
        "ResponsePagePath": "/index.html"
      }
    ]
  }
}
```

## Phase 3: Domain and SSL Configuration

### 3.1 SSL Certificate (ACM)

```bash
# Request SSL certificate for subdomain
aws acm request-certificate \
  --domain-name app.tathyas.in \
  --validation-method DNS \
  --region us-east-1
```

### 3.2 Route 53 DNS Configuration

```bash
# Create A record for subdomain pointing to CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.tathyas.in",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "d1234567890.cloudfront.net",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
      }
    }]
  }'
```

## Phase 4: Main Website Integration

### 4.1 Add Navigation Link to Main Site

Update your main tathyas.in website to include a link to the new app:

```html
<!-- Add to main site navigation -->
<nav>
  <a href="https://app.tathyas.in">AI Parenting Assistant</a>
  <!-- or -->
  <a href="/parenting-app/">AI Parenting Assistant</a>
</nav>
```

### 4.2 Create Landing Page on Main Site

```html
<!-- /parenting-app-landing.html on main site -->
<!DOCTYPE html>
<html>
<head>
    <title>AI-Powered Parenting Assistant | Tathyas</title>
    <meta name="description" content="Personalized parenting guidance powered by AI">
</head>
<body>
    <section class="hero">
        <h1>AI-Powered Parenting Assistant</h1>
        <p>Get personalized parenting plans, meal suggestions, and emotional support tools</p>
        <a href="https://app.tathyas.in" class="cta-button">Launch App</a>
    </section>
    
    <section class="features">
        <div class="feature">
            <h3>Personalized Planning</h3>
            <p>Custom daily routines based on your child's age and interests</p>
        </div>
        <div class="feature">
            <h3>Meal Assistant</h3>
            <p>Nutritious meal plans and recipes for growing children</p>
        </div>
        <div class="feature">
            <h3>Emotional Check-ins</h3>
            <p>Track and support your child's emotional development</p>
        </div>
    </section>
</body>
</html>
```

## Phase 5: Deployment Pipeline

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: npm run build:prod
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
        
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
        
    - name: Deploy to S3
      run: |
        aws s3 sync dist/ s3://tathyas-parenting-app --delete
        
    - name: Invalidate CloudFront
      run: |
        aws cloudfront create-invalidation \
          --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
          --paths "/*"
```

### 5.2 Manual Deployment Script

```bash
#!/bin/bash
# deploy.sh

echo "Building application..."
npm run build:prod

echo "Uploading to S3..."
aws s3 sync dist/ s3://tathyas-parenting-app --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
echo "App available at: https://app.tathyas.in"
```

## Phase 6: Monitoring and Analytics

### 6.1 CloudWatch Setup

```bash
# Enable CloudFront logging
aws logs create-log-group --log-group-name /aws/cloudfront/tathyas-parenting-app

# Set up custom metrics for app usage
```

### 6.2 Google Analytics Integration

```typescript
// Add to main.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

// Add tracking ID
const GA_TRACKING_ID = 'G-XXXXXXXXXX'

// Initialize in app
if (typeof window !== 'undefined' && GA_TRACKING_ID) {
  // Google Analytics setup
}
```

## Cost Estimation

### Monthly AWS Costs (estimated):
- **S3 Storage**: $1-5 (depending on traffic)
- **CloudFront**: $2-10 (first 1TB free)
- **Route 53**: $0.50 per hosted zone
- **ACM Certificate**: Free
- **Total**: ~$5-20/month for moderate traffic

## Security Considerations

### 6.1 Content Security Policy

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com;">
```

### 6.2 Environment Variables Security

- Never commit production keys to git
- Use AWS Secrets Manager for sensitive data
- Rotate API keys regularly

## Backup Strategy

### 6.1 S3 Versioning
```bash
aws s3api put-bucket-versioning \
  --bucket tathyas-parenting-app \
  --versioning-configuration Status=Enabled
```

### 6.2 Cross-Region Replication
```bash
# Set up backup bucket in different region
aws s3 mb s3://tathyas-parenting-app-backup --region us-west-2
```

## Next Steps After Deployment

1. **Set up monitoring** with CloudWatch and alerts
2. **Configure backup** and disaster recovery
3. **Implement CI/CD pipeline** for automated deployments
4. **Add performance monitoring** with tools like New Relic
5. **Set up error tracking** with Sentry or similar
6. **Configure SEO** for better discoverability

## Support and Maintenance

- **Regular updates**: Schedule monthly dependency updates
- **Performance monitoring**: Use CloudWatch metrics
- **User feedback**: Implement feedback collection system
- **Documentation**: Maintain deployment runbooks
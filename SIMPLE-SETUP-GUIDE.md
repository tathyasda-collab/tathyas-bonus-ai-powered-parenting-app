# Simple Setup Guide for Non-Programmers
## Deploying AI Parenting App to bonusaiapp.tathyas.in

### What You'll Need
1. **Windows Computer** (which you have)
2. **AWS Account** (we'll help you create one)
3. **Access to tathyas.in domain** (which you have)
4. **About 30-60 minutes**

---

## Step 1: Install Required Software

### 1.1 Install Git for Windows
1. Go to: https://git-scm.com/download/win
2. Download and install Git for Windows
3. During installation, choose "Git Bash Here" option
4. This gives you a terminal that can run our setup script

### 1.2 Install AWS CLI
1. Go to: https://aws.amazon.com/cli/
2. Click "Download AWS CLI for Windows"
3. Run the installer
4. Restart your computer after installation

### 1.3 Install Node.js
1. Go to: https://nodejs.org/
2. Download the "LTS" version (recommended)
3. Run the installer with default settings

---

## Step 2: Create AWS Account (If You Don't Have One)

1. Go to: https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the signup process
4. **Important**: You'll need a credit card, but most services we use are free or very cheap ($5-20/month)

---

## Step 3: Get AWS Credentials

### 3.1 Create IAM User
1. Log into AWS Console: https://console.aws.amazon.com/
2. Search for "IAM" and click on it
3. Click "Users" → "Add User"
4. Username: `tathyas-deployment-user`
5. Access type: Check "Programmatic access"
6. Permissions: Select "Attach existing policies directly"
7. Search and attach: `AdministratorAccess`
8. Click "Next" → "Next" → "Create User"
9. **IMPORTANT**: Save the Access Key ID and Secret Access Key (you'll need these)

### 3.2 Configure AWS CLI
1. Open Command Prompt (Press Windows key + R, type `cmd`, press Enter)
2. Type: `aws configure`
3. Enter your Access Key ID
4. Enter your Secret Access Key
5. Region: `us-east-1`
6. Output format: `json`

---

## Step 4: Run the Setup Script

### 4.1 Open the Right Folder
1. Open File Explorer
2. Navigate to: `C:\Users\gupta\Downloads\ai-powered-bonus-parenting-app`
3. Right-click in an empty area
4. Select "Git Bash Here" (this opens a terminal)

### 4.2 Run the Setup
In the Git Bash terminal, type these commands one by one:

```bash
# Make the script executable
chmod +x deployment/setup-aws.sh

# Run the setup script
./deployment/setup-aws.sh
```

### 4.3 What the Script Will Do
The script will:
1. ✅ Create an S3 bucket for your app
2. ✅ Request an SSL certificate for bonusaiapp.tathyas.in
3. ✅ Set up CloudFront (CDN) for fast loading
4. ✅ Configure DNS to point to your app
5. ✅ Build and deploy your app

### 4.4 Manual Steps During Setup
The script will pause and ask you to:
1. **Validate SSL Certificate**: 
   - Go to AWS Console → Certificate Manager
   - Click on your certificate
   - Copy the DNS record shown
   - Add this DNS record to your domain (see Step 5)
   - Wait for validation (5-30 minutes)
   - Return to script and press Y

---

## Step 5: Add DNS Record (SSL Validation)

### Option A: If you manage DNS yourself
1. Go to your domain registrar (where you bought tathyas.in)
2. Find DNS settings
3. Add the CNAME record provided by AWS Certificate Manager

### Option B: If someone else manages your domain
1. Send the DNS record details to your domain manager
2. Ask them to add: `_xxxxx.bonusaiapp.tathyas.in` → `_xxxxx.acm-validations.aws.`
3. Wait for confirmation

---

## Step 6: Verify Everything Works

After the script completes:
1. Wait 5-10 minutes for DNS propagation
2. Visit: https://bonusaiapp.tathyas.in
3. You should see your AI Parenting App!

---

## Step 7: Add Link to Your Main Website

1. Edit your main tathyas.in website
2. Add a navigation link to: `https://bonusaiapp.tathyas.in`
3. Or upload the `landing-page.html` file we created

---

## Troubleshooting

### If the script fails:
1. **Check AWS credentials**: Run `aws sts get-caller-identity`
2. **Check internet connection**
3. **Try again**: The script is safe to run multiple times

### If the website doesn't load:
1. **Wait longer**: DNS changes can take up to 24 hours
2. **Check certificate**: Make sure SSL validation completed
3. **Clear browser cache**: Press Ctrl+F5

### If you get stuck:
1. Take a screenshot of the error
2. Note exactly what step failed
3. Contact support with details

---

## Monthly Costs
- **S3 Storage**: $1-3
- **CloudFront**: $2-5  
- **Route 53**: $0.50
- **Total**: About $5-10 per month

---

## Success! 🎉

Once everything is working:
- Your app will be available at: **https://bonusaiapp.tathyas.in**
- It will load fast worldwide thanks to CloudFront
- SSL certificate will keep it secure
- Any code changes you push to GitHub will automatically deploy

---

## Need Help?

If you get stuck at any step:
1. Take a screenshot of where you're stuck
2. Note any error messages
3. Ask for help with specific details

The setup script is designed to be safe - you can run it multiple times if something fails!
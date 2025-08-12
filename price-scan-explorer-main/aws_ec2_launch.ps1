# AWS EC2 Launch Script for Ollama Product Matching (PowerShell Version)
# This script launches an EC2 instance with all necessary configurations

# Configuration Variables
$REGION = "ap-southeast-1"
$INSTANCE_TYPE = "r6i.xlarge"
$AMI_ID = "ami-0c02fb55956c7d316"  # Ubuntu 22.04 LTS
$KEY_NAME = "ollama-product-matcher"
$SECURITY_GROUP_NAME = "ollama-product-matcher-sg"

Write-Host "🚀 AWS EC2 Launch Script for Ollama Product Matching" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI verified" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Installation guide: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html" -ForegroundColor Yellow
    exit 1
}

# Check if AWS credentials are configured
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS credentials verified" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Set AWS region
aws configure set default.region $REGION

# Get VPC ID (use default VPC)
Write-Host "🔍 Detecting VPC..." -ForegroundColor Yellow
$VPC_ID = aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text
if ($VPC_ID -eq "None" -or [string]::IsNullOrEmpty($VPC_ID)) {
    Write-Host "❌ No default VPC found. Please specify VPC_ID manually." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Using VPC: $VPC_ID" -ForegroundColor Green

# Get Subnet ID (use first available subnet in default VPC)
Write-Host "🔍 Detecting subnet..." -ForegroundColor Yellow
$SUBNET_ID = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0].SubnetId' --output text
if ($SUBNET_ID -eq "None" -or [string]::IsNullOrEmpty($SUBNET_ID)) {
    Write-Host "❌ No subnet found in VPC. Please specify SUBNET_ID manually." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Using subnet: $SUBNET_ID" -ForegroundColor Green

# Create Security Group
Write-Host "🔧 Creating security group..." -ForegroundColor Yellow
try {
    $SECURITY_GROUP_ID = aws ec2 create-security-group --group-name $SECURITY_GROUP_NAME --description "Security group for Ollama product matching" --vpc-id $VPC_ID --query 'GroupId' --output text
    Write-Host "✅ Created security group: $SECURITY_GROUP_ID" -ForegroundColor Green
} catch {
    $SECURITY_GROUP_ID = aws ec2 describe-security-groups --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" --query 'SecurityGroups[0].GroupId' --output text
    Write-Host "✅ Using existing security group: $SECURITY_GROUP_ID" -ForegroundColor Green
}

# Add security group rules
Write-Host "🔧 Configuring security group rules..." -ForegroundColor Yellow
try {
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --description "SSH access" | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 11434 --cidr 0.0.0.0/0 --description "Ollama API" | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --description "HTTP access" | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --description "HTTPS access" | Out-Null
    Write-Host "✅ Security group rules configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Some security group rules may already exist" -ForegroundColor Yellow
}

# Create IAM role for S3 access
Write-Host "🔧 Creating IAM role..." -ForegroundColor Yellow
$ROLE_NAME = "ollama-product-matcher-role"

# Create trust policy
$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

$trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding UTF8

# Create role
try {
    aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://trust-policy.json | Out-Null
    Write-Host "✅ Created IAM role: $ROLE_NAME" -ForegroundColor Green
} catch {
    Write-Host "✅ Using existing IAM role: $ROLE_NAME" -ForegroundColor Green
}

# Create policy for S3 access
$s3Policy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::prodpromo",
        "arn:aws:s3:::prodpromo/*"
      ]
    }
  ]
}
"@

$s3Policy | Out-File -FilePath "s3-policy.json" -Encoding UTF8

# Attach policy to role
aws iam put-role-policy --role-name $ROLE_NAME --policy-name S3AccessPolicy --policy-document file://s3-policy.json | Out-Null

# Create instance profile
try {
    aws iam create-instance-profile --instance-profile-name $ROLE_NAME | Out-Null
} catch {
    Write-Host "✅ Instance profile already exists" -ForegroundColor Green
}

try {
    aws iam add-role-to-instance-profile --instance-profile-name $ROLE_NAME --role-name $ROLE_NAME | Out-Null
} catch {
    Write-Host "✅ Role already attached to instance profile" -ForegroundColor Green
}

Write-Host "✅ IAM role configured" -ForegroundColor Green

# Clean up temporary files
Remove-Item -Path "trust-policy.json" -ErrorAction SilentlyContinue
Remove-Item -Path "s3-policy.json" -ErrorAction SilentlyContinue

# Launch EC2 instance
Write-Host "🚀 Launching EC2 instance..." -ForegroundColor Yellow

# Read the setup script content
$setupScript = Get-Content -Path "setup_aws_ollama.sh" -Raw -Encoding UTF8

# Launch instance with user data
$INSTANCE_ID = aws ec2 run-instances --image-id $AMI_ID --instance-type $INSTANCE_TYPE --key-name $KEY_NAME --security-group-ids $SECURITY_GROUP_ID --subnet-id $SUBNET_ID --iam-instance-profile Name=$ROLE_NAME --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":100,"VolumeType":"gp3","DeleteOnTermination":true}}]' --user-data "$setupScript" --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ollama-product-matcher},{Key=Project,Value=price-scanner},{Key=Environment,Value=production}]' --query 'Instances[0].InstanceId' --output text

Write-Host "✅ Instance launched: $INSTANCE_ID" -ForegroundColor Green

# Wait for instance to be running
Write-Host "⏳ Waiting for instance to be running..." -ForegroundColor Yellow
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP address
Write-Host "🔍 Getting public IP address..." -ForegroundColor Yellow
$PUBLIC_IP = aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

Write-Host "✅ Public IP: $PUBLIC_IP" -ForegroundColor Green

# Wait for setup to complete (give it some time)
Write-Host "⏳ Waiting for setup to complete (this may take 15-20 minutes)..." -ForegroundColor Yellow
Write-Host "You can monitor the setup progress by connecting to the instance:" -ForegroundColor White
Write-Host "ssh -i ollama-product-matcher.pem ubuntu@$PUBLIC_IP" -ForegroundColor Blue

# Create connection script
$connectionScript = @"
# PowerShell Connection Script for Ollama Product Matcher
Write-Host "Connecting to Ollama Product Matcher instance..."
Write-Host "Instance ID: $INSTANCE_ID"
Write-Host "Public IP: $PUBLIC_IP"
Write-Host ""
Write-Host "SSH Command:"
Write-Host "ssh -i ollama-product-matcher.pem ubuntu@$PUBLIC_IP"
Write-Host ""
Write-Host "Once connected, you can:"
Write-Host "1. Check setup status: /home/ubuntu/monitor_ollama.sh"
Write-Host "2. Run health check: /home/ubuntu/health_check.sh"
Write-Host "3. Start product matching: /home/ubuntu/start_product_matching.sh"
Write-Host ""
Write-Host "Monitoring commands:"
Write-Host "- Check Ollama status: sudo systemctl status ollama"
Write-Host "- View logs: sudo journalctl -u ollama -f"
Write-Host "- Check system resources: htop"
"@

$connectionScript | Out-File -FilePath "connect_to_instance.ps1" -Encoding UTF8

# Create instance info file
$instanceInfo = @"
AWS EC2 Instance Information
============================
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
Instance Type: $INSTANCE_TYPE
Region: $REGION
Security Group: $SECURITY_GROUP_ID
VPC: $VPC_ID
Subnet: $SUBNET_ID
IAM Role: $ROLE_NAME

Connection Details:
==================
SSH Command: ssh -i ollama-product-matcher.pem ubuntu@$PUBLIC_IP

Setup Status:
===========
The instance is currently being set up with:
- Ollama (nomic-embed-text + llama3.1:8b)
- Python dependencies
- ChromaDB
- Product matching scripts

Setup typically takes 15-20 minutes.

Monitoring:
==========
- Check setup: /home/ubuntu/monitor_ollama.sh
- Health check: /home/ubuntu/health_check.sh
- Start matching: /home/ubuntu/start_product_matching.sh

Cost Information:
================
Instance Type: r6i.xlarge
Estimated Monthly Cost: ~$180
Storage: 100GB GP3 (~$10/month)

To stop the instance:
aws ec2 stop-instances --instance-ids $INSTANCE_ID

To terminate the instance:
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
"@

$instanceInfo | Out-File -FilePath "instance_info.txt" -Encoding UTF8

Write-Host ""
Write-Host "🎉 EC2 Instance Setup Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Instance ID: $INSTANCE_ID" -ForegroundColor Blue
Write-Host "Public IP: $PUBLIC_IP" -ForegroundColor Blue
Write-Host "Instance Type: $INSTANCE_TYPE" -ForegroundColor Blue
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait 15-20 minutes for setup to complete"
Write-Host "2. Connect to the instance: .\connect_to_instance.ps1"
Write-Host "3. Check setup status: /home/ubuntu/monitor_ollama.sh"
Write-Host "4. Start product matching: /home/ubuntu/start_product_matching.sh"
Write-Host ""
Write-Host "📁 Files Created:" -ForegroundColor Yellow
Write-Host "- connect_to_instance.ps1 (connection helper)"
Write-Host "- instance_info.txt (instance details)"
Write-Host ""
Write-Host "💰 Cost Information:" -ForegroundColor Yellow
Write-Host "- Instance: ~$180/month"
Write-Host "- Storage: ~$10/month"
Write-Host "- Total: ~$190/month"
Write-Host ""
Write-Host "✅ Setup script completed successfully!" -ForegroundColor Green 
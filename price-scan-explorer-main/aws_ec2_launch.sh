#!/bin/bash
# AWS EC2 Launch Script for Ollama Product Matching
# This script launches an EC2 instance with all necessary configurations

set -e

# Configuration Variables
REGION="ap-southeast-1"
INSTANCE_TYPE="r6i.xlarge"
AMI_ID="ami-0c02fb55956c7d316"  # Ubuntu 22.04 LTS
KEY_NAME="ollama-product-matcher"  # Replace with your key pair name
SECURITY_GROUP_NAME="ollama-product-matcher-sg"
VPC_ID=""  # Will be auto-detected
SUBNET_ID=""  # Will be auto-detected

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 AWS EC2 Launch Script for Ollama Product Matching${NC}"
echo "=================================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "Installation guide: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI and credentials verified${NC}"

# Set AWS region
aws configure set default.region $REGION

# Get VPC ID (use default VPC)
echo -e "${YELLOW}🔍 Detecting VPC...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    echo -e "${RED}❌ No default VPC found. Please specify VPC_ID manually.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Using VPC: $VPC_ID${NC}"

# Get Subnet ID (use first available subnet in default VPC)
echo -e "${YELLOW}🔍 Detecting subnet...${NC}"
SUBNET_ID=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0].SubnetId' --output text)
if [ "$SUBNET_ID" = "None" ] || [ -z "$SUBNET_ID" ]; then
    echo -e "${RED}❌ No subnet found in VPC. Please specify SUBNET_ID manually.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Using subnet: $SUBNET_ID${NC}"

# Create Security Group
echo -e "${YELLOW}🔧 Creating security group...${NC}"
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name $SECURITY_GROUP_NAME \
    --description "Security group for Ollama product matching" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

echo -e "${GREEN}✅ Security group: $SECURITY_GROUP_ID${NC}"

# Add security group rules
echo -e "${YELLOW}🔧 Configuring security group rules...${NC}"
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --description "SSH access" 2>/dev/null || echo "SSH rule already exists"

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 11434 \
    --cidr 0.0.0.0/0 \
    --description "Ollama API" 2>/dev/null || echo "Ollama API rule already exists"

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --description "HTTP access" 2>/dev/null || echo "HTTP rule already exists"

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --description "HTTPS access" 2>/dev/null || echo "HTTPS rule already exists"

echo -e "${GREEN}✅ Security group rules configured${NC}"

# Create IAM role for S3 access
echo -e "${YELLOW}🔧 Creating IAM role...${NC}"
ROLE_NAME="ollama-product-matcher-role"

# Create trust policy
cat > trust-policy.json << EOF
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
EOF

# Create role
aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file://trust-policy.json 2>/dev/null || echo "Role already exists"

# Create policy for S3 access
cat > s3-policy.json << EOF
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
EOF

# Attach policy to role
aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name S3AccessPolicy \
    --policy-document file://s3-policy.json

# Create instance profile
aws iam create-instance-profile \
    --instance-profile-name $ROLE_NAME 2>/dev/null || echo "Instance profile already exists"

aws iam add-role-to-instance-profile \
    --instance-profile-name $ROLE_NAME \
    --role-name $ROLE_NAME 2>/dev/null || echo "Role already attached to instance profile"

echo -e "${GREEN}✅ IAM role configured${NC}"

# Clean up temporary files
rm -f trust-policy.json s3-policy.json

# Launch EC2 instance
echo -e "${YELLOW}🚀 Launching EC2 instance...${NC}"
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --subnet-id $SUBNET_ID \
    --iam-instance-profile Name=$ROLE_NAME \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":100,"VolumeType":"gp3","DeleteOnTermination":true}}]' \
    --user-data file://setup_aws_ollama.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ollama-product-matcher},{Key=Project,Value=price-scanner},{Key=Environment,Value=production}]' \
    --query 'Instances[0].InstanceId' \
    --output text)

echo -e "${GREEN}✅ Instance launched: $INSTANCE_ID${NC}"

# Wait for instance to be running
echo -e "${YELLOW}⏳ Waiting for instance to be running...${NC}"
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP address
echo -e "${YELLOW}🔍 Getting public IP address...${NC}"
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo -e "${GREEN}✅ Public IP: $PUBLIC_IP${NC}"

# Wait for setup to complete (give it some time)
echo -e "${YELLOW}⏳ Waiting for setup to complete (this may take 15-20 minutes)...${NC}"
echo "You can monitor the setup progress by connecting to the instance:"
echo -e "${BLUE}ssh -i ollama-product-matcher.pem ubuntu@$PUBLIC_IP${NC}"

# Create connection script
cat > connect_to_instance.sh << EOF
#!/bin/bash
echo "Connecting to Ollama Product Matcher instance..."
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo ""
echo "SSH Command:"
echo "ssh -i ollama-product-matcher.pem ubuntu@$PUBLIC_IP"
echo ""
echo "Once connected, you can:"
echo "1. Check setup status: /home/ubuntu/monitor_ollama.sh"
echo "2. Run health check: /home/ubuntu/health_check.sh"
echo "3. Start product matching: /home/ubuntu/start_product_matching.sh"
echo ""
echo "Monitoring commands:"
echo "- Check Ollama status: sudo systemctl status ollama"
echo "- View logs: sudo journalctl -u ollama -f"
echo "- Check system resources: htop"
EOF

chmod +x connect_to_instance.sh

# Create instance info file
cat > instance_info.txt << EOF
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
SSH Command: ssh -i your-key.pem ubuntu@$PUBLIC_IP

Setup Status:
============
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
EOF

echo ""
echo -e "${GREEN}🎉 EC2 Instance Setup Complete!${NC}"
echo "=================================================="
echo -e "${BLUE}Instance ID:${NC} $INSTANCE_ID"
echo -e "${BLUE}Public IP:${NC} $PUBLIC_IP"
echo -e "${BLUE}Instance Type:${NC} $INSTANCE_TYPE"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Wait 15-20 minutes for setup to complete"
echo "2. Connect to the instance: ./connect_to_instance.sh"
echo "3. Check setup status: /home/ubuntu/monitor_ollama.sh"
echo "4. Start product matching: /home/ubuntu/start_product_matching.sh"
echo ""
echo -e "${YELLOW}📁 Files Created:${NC}"
echo "- connect_to_instance.sh (connection helper)"
echo "- instance_info.txt (instance details)"
echo ""
echo -e "${YELLOW}💰 Cost Information:${NC}"
echo "- Instance: ~$180/month"
echo "- Storage: ~$10/month"
echo "- Total: ~$190/month"
echo ""
echo -e "${GREEN}✅ Setup script completed successfully!${NC}" 
# AWS Deployment Guide for Ollama + ChromaDB Product Matching

## 🏗️ **Option 1: EC2 Instance (Recommended)**

### **Recommended EC2 Instance Types**

| Use Case | Instance Type | vCPU | RAM | Storage | Cost/Hour | Cost/Month |
|----------|---------------|------|-----|---------|-----------|------------|
| **Development** | t3.xlarge | 4 | 16GB | 100GB | $0.166 | ~$120 |
| **Production** | r6i.xlarge | 4 | 32GB | 500GB | $0.252 | ~$180 |
| **High Performance** | g5.xlarge | 4 | 16GB | 500GB | $0.526 | ~$380 |
| **Large Scale** | r6i.2xlarge | 8 | 64GB | 1TB | $0.504 | ~$360 |

### **EC2 Setup Steps**

#### 1. Launch EC2 Instance
```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type r6i.xlarge \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":100,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ollama-product-matcher}]'
```

#### 2. Connect and Install Dependencies
```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (for Ollama)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Python and dependencies
sudo apt install python3 python3-pip git -y
pip3 install pandas boto3 chromadb requests numpy

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
```

#### 3. Configure Ollama
```bash
# Start Ollama service
ollama serve

# Pull required models
ollama pull nomic-embed-text
ollama pull llama3.1:8b

# Verify installation
ollama list
```

#### 4. Deploy Your Code
```bash
# Clone your repository
git clone https://github.com/your-repo/price-scan-explorer-main.git
cd price-scan-explorer-main

# Run the matching script
python3 src/components/product/marketplace/matchfuzzy_ollama.py
```

## 🐳 **Option 2: ECS with Docker (Scalable)**

### **Dockerfile**
```dockerfile
FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Install Python dependencies
COPY requirements_ollama.txt .
RUN pip3 install -r requirements_ollama.txt

# Copy application code
COPY . /app
WORKDIR /app

# Expose Ollama port
EXPOSE 11434

# Start Ollama and run application
CMD ["sh", "-c", "ollama serve & sleep 30 && python3 src/components/product/marketplace/matchfuzzy_ollama.py"]
```

### **ECS Task Definition**
```json
{
  "family": "ollama-product-matcher",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "4096",
  "memory": "16384",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ollama-task-role",
  "containerDefinitions": [
    {
      "name": "ollama-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/ollama-product-matcher:latest",
      "portMappings": [
        {
          "containerPort": 11434,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "AWS_DEFAULT_REGION",
          "value": "ap-southeast-1"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ollama-product-matcher",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## ☁️ **Option 3: SageMaker (Managed ML)**

### **SageMaker Notebook Setup**
```python
# Install Ollama in SageMaker notebook
!curl -fsSL https://ollama.ai/install.sh | sh
!ollama serve &
!sleep 30
!ollama pull nomic-embed-text
!ollama pull llama3.1:8b

# Install Python dependencies
!pip install pandas boto3 chromadb requests numpy

# Run your matching script
!python src/components/product/marketplace/matchfuzzy_ollama.py
```

## 💾 **Option 4: Hybrid Approach (EC2 + S3)**

### **Architecture**
```
EC2 Instance (Ollama + ChromaDB)
├── Input: S3 CSV files
├── Processing: Local Ollama models
├── Output: S3 results
└── Database: EFS for persistence
```

### **Setup Script**
```bash
#!/bin/bash
# setup_aws_ollama.sh

# Install dependencies
sudo apt update
sudo apt install -y python3 python3-pip git nfs-common

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Mount EFS for persistent storage
sudo mkdir -p /mnt/efs
sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 fs-xxxxxxxxx.efs.ap-southeast-1.amazonaws.com:/ /mnt/efs

# Install Python dependencies
pip3 install pandas boto3 chromadb requests numpy

# Pull Ollama models
ollama pull nomic-embed-text
ollama pull llama3.1:8b

# Start Ollama service
ollama serve
```

## 🔧 **AWS Infrastructure as Code (Terraform)**

### **main.tf**
```hcl
# EC2 Instance
resource "aws_instance" "ollama_server" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "r6i.xlarge"
  key_name      = aws_key_pair.deployer.key_name

  vpc_security_group_ids = [aws_security_group.ollama.id]
  subnet_id              = aws_subnet.main.id

  root_block_device {
    volume_size = 100
    volume_type = "gp3"
  }

  user_data = file("setup_script.sh")

  tags = {
    Name = "ollama-product-matcher"
  }
}

# Security Group
resource "aws_security_group" "ollama" {
  name_prefix = "ollama-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 11434
    to_port     = 11434
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# S3 Bucket for data
resource "aws_s3_bucket" "product_data" {
  bucket = "your-product-data-bucket"
}

# IAM Role for EC2
resource "aws_iam_role" "ec2_role" {
  name = "ollama_ec2_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "s3_access" {
  name = "s3_access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.product_data.arn,
          "${aws_s3_bucket.product_data.arn}/*"
        ]
      }
    ]
  })
}
```

## 📊 **Cost Comparison**

### **Monthly Costs (Singapore Region)**

| Option | Instance Type | Storage | Total/Month |
|--------|---------------|---------|-------------|
| **Development** | t3.xlarge | 100GB | $120 |
| **Production** | r6i.xlarge | 500GB | $180 |
| **High Performance** | g5.xlarge | 500GB | $380 |
| **SageMaker** | ml.t3.xlarge | 100GB | $200 |

### **Cost Optimization Tips**

1. **Use Spot Instances** for non-critical workloads (50-70% savings)
2. **Reserved Instances** for production (30-60% savings)
3. **Auto Scaling** to shut down when not in use
4. **S3 Intelligent Tiering** for data storage

## 🚀 **Quick Start Commands**

### **1. Launch EC2 Instance**
```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type r6i.xlarge \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --user-data file://setup_script.sh
```

### **2. Connect and Verify**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip

# Check Ollama
ollama list

# Test API
curl http://localhost:11434/api/tags
```

### **3. Run Your Application**
```bash
cd price-scan-explorer-main
python3 src/components/product/marketplace/matchfuzzy_ollama.py
```

## 🔒 **Security Considerations**

1. **VPC**: Use private subnets for production
2. **Security Groups**: Restrict access to necessary ports only
3. **IAM**: Use least privilege principle
4. **Encryption**: Enable encryption at rest and in transit
5. **Backup**: Regular snapshots of EBS volumes

## 📈 **Monitoring and Logging**

### **CloudWatch Setup**
```bash
# Install CloudWatch agent
sudo apt install amazon-cloudwatch-agent

# Configure monitoring
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### **Key Metrics to Monitor**
- CPU utilization
- Memory usage
- Disk I/O
- Network traffic
- Ollama API response times 
@echo off
echo Launching EC2 instance for Ollama Product Matching...

REM Launch the instance
aws ec2 run-instances ^
  --image-id ami-0c02fb55956c7d316 ^
  --instance-type r6i.xlarge ^
  --key-name ollama-product-matcher ^
  --subnet-id subnet-0dbb80597a816f9ae ^
  --block-device-mappings "[{\"DeviceName\":\"/dev/sda1\",\"Ebs\":{\"VolumeSize\":100,\"VolumeType\":\"gp3\",\"DeleteOnTermination\":true}}]" ^
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=ollama-product-matcher}]"

echo Instance launch command completed.
echo.
echo Please wait a few minutes for the instance to start, then run:
echo aws ec2 describe-instances --filters "Name=tag:Name,Values=ollama-product-matcher" --query "Reservations[0].Instances[0].PublicIpAddress" --output text
echo.
pause 
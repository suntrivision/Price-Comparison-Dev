# Check EC2 Instance Status for Ollama Product Matching
Write-Host "🔍 Checking EC2 Instance Status..." -ForegroundColor Blue

# Get all instances
$instances = aws ec2 describe-instances --output json | ConvertFrom-Json

Write-Host "`n📊 Current Instances:" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow

foreach ($reservation in $instances.Reservations) {
    foreach ($instance in $reservation.Instances) {
        $name = ($instance.Tags | Where-Object {$_.Key -eq "Name"}).Value
        if ([string]::IsNullOrEmpty($name)) { $name = "No Name" }
        
        Write-Host "Instance ID: $($instance.InstanceId)" -ForegroundColor Green
        Write-Host "  Name: $name" -ForegroundColor White
        Write-Host "  State: $($instance.State.Name)" -ForegroundColor Cyan
        Write-Host "  Type: $($instance.InstanceType)" -ForegroundColor White
        Write-Host "  Public IP: $($instance.PublicIpAddress)" -ForegroundColor Yellow
        Write-Host "  Key Name: $($instance.KeyName)" -ForegroundColor White
        Write-Host ""
    }
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Blue
Write-Host "==============" -ForegroundColor Blue

# Check for Ollama instances
$ollamaInstances = $instances.Reservations.Instances | Where-Object { 
    ($_.Tags | Where-Object {$_.Key -eq "Name"}).Value -eq "ollama-product-matcher" 
}

if ($ollamaInstances) {
    foreach ($instance in $ollamaInstances) {
        if ($instance.State.Name -eq "running") {
            Write-Host "✅ Ollama instance is RUNNING!" -ForegroundColor Green
            Write-Host "   Instance ID: $($instance.InstanceId)" -ForegroundColor White
            Write-Host "   Public IP: $($instance.PublicIpAddress)" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "🔗 Connect to your instance:" -ForegroundColor Blue
            Write-Host "   ssh -i ollama-product-matcher.pem ubuntu@$($instance.PublicIpAddress)" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 Once connected, run these commands:" -ForegroundColor Blue
            Write-Host "   1. Check setup status: /home/ubuntu/monitor_ollama.sh" -ForegroundColor White
            Write-Host "   2. Run health check: /home/ubuntu/health_check.sh" -ForegroundColor White
            Write-Host "   3. Start product matching: /home/ubuntu/start_product_matching.sh" -ForegroundColor White
        } elseif ($instance.State.Name -eq "pending") {
            Write-Host "⏳ Ollama instance is starting..." -ForegroundColor Yellow
            Write-Host "   Instance ID: $($instance.InstanceId)" -ForegroundColor White
            Write-Host "   Please wait 2-3 minutes for it to fully start." -ForegroundColor Yellow
        } else {
            Write-Host "❌ Ollama instance is $($instance.State.Name)" -ForegroundColor Red
            Write-Host "   Instance ID: $($instance.InstanceId)" -ForegroundColor White
        }
    }
} else {
    Write-Host "❌ No Ollama instances found with name 'ollama-product-matcher'" -ForegroundColor Red
    Write-Host "   You may need to create a new instance." -ForegroundColor Yellow
}

Write-Host "`n💰 Cost Information:" -ForegroundColor Blue
Write-Host "===================" -ForegroundColor Blue
Write-Host "• r6i.xlarge: ~$180/month" -ForegroundColor White
Write-Host "• Storage: ~$10/month" -ForegroundColor White
Write-Host "• Total: ~$190/month" -ForegroundColor White

Write-Host "`n🛠️ Management Commands:" -ForegroundColor Blue
Write-Host "=====================" -ForegroundColor Blue
Write-Host "• Stop instance: aws ec2 stop-instances --instance-ids INSTANCE_ID" -ForegroundColor White
Write-Host "• Start instance: aws ec2 start-instances --instance-ids INSTANCE_ID" -ForegroundColor White
Write-Host "• Terminate instance: aws ec2 terminate-instances --instance-ids INSTANCE_ID" -ForegroundColor White 
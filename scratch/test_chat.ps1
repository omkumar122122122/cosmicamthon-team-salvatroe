# Test script for chat endpoint
$body = @{
    email = 'parent@example.com'
    password = 'parent123'
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/auth/login' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 30
    Write-Host "Login Status: $($loginResponse.StatusCode)"
    $loginContent = $loginResponse.Content | ConvertFrom-Json
    $token = $loginContent.data.tokens.accessToken
    Write-Host "Got token: $($token.Substring(0, [Math]::Min(50, $token.Length)))..."
    
    # Now test chat
    $chatBody = @{
        message = 'Hello, what is my child status?'
        conversation = @()
        childId = $null
    } | ConvertTo-Json
    
    Write-Host "Sending chat request..."
    $chatResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/chat' -Method POST -Body $chatBody -ContentType 'application/json' -Headers @{Authorization = "Bearer $token"} -UseBasicParsing -TimeoutSec 60
    Write-Host "Chat Status: $($chatResponse.StatusCode)"
    Write-Host "Chat Response: $($chatResponse.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errorBody"
    }
}
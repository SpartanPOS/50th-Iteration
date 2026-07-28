
Invoke-WebRequest -Uri "http://localhost:3000/admin/user/add" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body '{"username": "testuser", "password": "testpassword", "auth_level": 3}';

$auth = Invoke-WebRequest -Uri "http://localhost:3000/users/auth/token" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body '{"username": "testuser", "password": "testpassword", "auth_level": 3}';
$parsed = $auth.Content | ConvertFrom-Json
Write-Host "Auth Response: $($parsed)"
$token = $parsed.token
Write-Host "Auth Token: $token"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$testcat1 = Invoke-WebRequest -Uri "http://localhost:3000/admin/category/add" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body '{"name": "Test Category"}';
$parsed = $testcat1.Content | ConvertFrom-Json 
$testcatid1 = $parsed.data.id
$testcat2 = Invoke-WebRequest -Uri "http://localhost:3000/admin/category/add" -Method POST -Headers $headers -Body '{"name": "Test Category 2"}';
$parsed = $testcat2.Content | ConvertFrom-Json 
$testcatid2 = $parsed.data.id

$newmenu = [PSCustomObject]@{
    name = "Test Menu"
    items = [array]@()
    categories = @($testcatid1, $testcatid2)
}

$item1 = [PSCustomObject]@{
    name = "Test Item 1"
    price = 9.99
    category = $testcatid1
}

$item2 = [PSCustomObject]@{
    name = "Test Item 2"
    price = 19.99
    category = $testcatid2
}

Invoke-WebRequest -Uri "http://localhost:3000/admin/menu/add" -Method POST -Headers $headers -Body ($newmenu | ConvertTo-Json -Depth 3);

Invoke-WebRequest -Uri "http://localhost:3000/admin/items/add" -Method POST -Headers $headers -Body ($item1 | ConvertTo-Json -Depth 3);
Invoke-WebRequest -Uri "http://localhost:3000/admin/items/add" -Method POST -Headers $headers -Body ($item2 | ConvertTo-Json -Depth 3);

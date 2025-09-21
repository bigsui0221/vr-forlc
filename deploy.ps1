# 利川水库VR监测系统 - Windows自动部署脚本
# 运行前请确保以管理员身份运行PowerShell

param(
    [string]$Port = "1999",
    [string]$IPAddress = "192.168.150.253",
    [string]$WebServer = "IIS",  # IIS 或 Nginx
    [switch]$SkipDependencies = $false,
    [switch]$Help = $false
)

# 显示帮助信息
if ($Help) {
    Write-Host @"
利川水库VR监测系统部署脚本

用法: .\deploy.ps1 [参数]

参数:
  -Port <端口>          指定Web服务器端口 (默认: 1999)
  -IPAddress <IP地址>   指定监听IP地址 (默认: 192.168.150.253)
  -WebServer <类型>     指定Web服务器类型: IIS 或 Nginx (默认: IIS)
  -SkipDependencies    跳过依赖检查和安装
  -Help                显示此帮助信息

示例:
  .\deploy.ps1 -Port 1999 -IPAddress 192.168.150.253 -WebServer IIS
  .\deploy.ps1 -Port 8080 -IPAddress 0.0.0.0 -WebServer Nginx -SkipDependencies
"@
    exit 0
}

# 设置错误处理
$ErrorActionPreference = "Stop"

# 日志函数
function Write-Log {
    param([string]$Message, [string]$Type = "Info")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Type) {
        "Error" { Write-Host "[$timestamp] [错误] $Message" -ForegroundColor Red }
        "Warning" { Write-Host "[$timestamp] [警告] $Message" -ForegroundColor Yellow }
        "Success" { Write-Host "[$timestamp] [成功] $Message" -ForegroundColor Green }
        default { Write-Host "[$timestamp] [信息] $Message" -ForegroundColor Cyan }
    }
}

# 检查管理员权限
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 检查软件是否安装
function Test-Software {
    param([string]$Name, [string]$Command)
    try {
        $null = & $Command --version 2>$null
        Write-Log "$Name 已安装" "Success"
        return $true
    }
    catch {
        Write-Log "$Name 未安装" "Warning"
        return $false
    }
}

# 安装Chocolatey
function Install-Chocolatey {
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Log "正在安装Chocolatey..."
        try {
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            Write-Log "Chocolatey安装完成" "Success"
        }
        catch {
            Write-Log "Chocolatey安装失败: $($_.Exception.Message)" "Error"
            throw
        }
    } else {
        Write-Log "Chocolatey已安装" "Success"
    }
}

# 安装Node.js
function Install-NodeJS {
    if (!(Test-Software "Node.js" "node")) {
        Write-Log "正在安装Node.js..."
        try {
            choco install nodejs -y
            # 刷新环境变量
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            Write-Log "Node.js安装完成" "Success"
        }
        catch {
            Write-Log "Node.js安装失败: $($_.Exception.Message)" "Error"
            throw
        }
    }
}

# 安装pnpm
function Install-Pnpm {
    if (!(Test-Software "pnpm" "pnpm")) {
        Write-Log "正在安装pnpm..."
        try {
            npm install -g pnpm
            Write-Log "pnpm安装完成" "Success"
        }
        catch {
            Write-Log "pnpm安装失败: $($_.Exception.Message)" "Error"
            throw
        }
    }
}

# 构建项目
function Build-Project {
    Write-Log "正在安装项目依赖..."
    try {
        pnpm install
        
        Write-Log "正在构建生产版本..."
        pnpm run build
        
        if (Test-Path "./dist") {
            Write-Log "项目构建完成" "Success"
            return $true
        } else {
            Write-Log "项目构建失败" "Error"
            return $false
        }
    }
    catch {
        Write-Log "项目构建失败: $($_.Exception.Message)" "Error"
        return $false
    }
}

# 配置防火墙
function Configure-Firewall {
    param([string]$Port)
    Write-Log "正在配置防火墙规则..."
    
    try {
        # 删除已存在的规则（如果有）
        Remove-NetFirewallRule -DisplayName "LC VR Monitor Port $Port" -ErrorAction SilentlyContinue
        
        # 添加新规则
        New-NetFirewallRule -DisplayName "LC VR Monitor Port $Port" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow
        Write-Log "防火墙规则配置完成" "Success"
    }
    catch {
        Write-Log "防火墙配置失败: $($_.Exception.Message)" "Error"
    }
}

# 配置IIS
function Configure-IIS {
    param([string]$Port, [string]$IPAddress)
    Write-Log "正在配置IIS..."
    
    try {
        # 启用IIS功能
        Write-Log "启用IIS功能..."
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All -NoRestart
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer -All -NoRestart
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures -All -NoRestart
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors -All -NoRestart
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect -All -NoRestart
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment -All -NoRestart
        
        # 导入WebAdministration模块
        Import-Module WebAdministration -ErrorAction SilentlyContinue
        
        # 删除已存在的站点（如果有）
        if (Get-Website -Name "LC-VR-Monitor" -ErrorAction SilentlyContinue) {
            Remove-Website -Name "LC-VR-Monitor"
        }
        
        # 创建新站点
        $sitePath = Join-Path $PSScriptRoot "dist"
        New-Website -Name "LC-VR-Monitor" -Port $Port -IPAddress $IPAddress -PhysicalPath $sitePath
        
        # 创建web.config文件
        $webConfigContent = @'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Handle History Mode and hash" stopProcessing="true">
          <match url="(.*)" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".hdr" mimeType="application/octet-stream" />
      <mimeMap fileExtension=".gltf" mimeType="model/gltf+json" />
      <mimeMap fileExtension=".glb" mimeType="model/gltf-binary" />
    </staticContent>
    <httpCompression>
      <scheme name="gzip" dll="%Windir%\system32\inetsrv\gzip.dll" />
      <dynamicTypes>
        <add mimeType="text/*" enabled="true" />
        <add mimeType="message/*" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
      </dynamicTypes>
      <staticTypes>
        <add mimeType="text/*" enabled="true" />
        <add mimeType="message/*" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
      </staticTypes>
    </httpCompression>
  </system.webServer>
</configuration>
'@
        
        $webConfigPath = Join-Path $sitePath "web.config"
        $webConfigContent | Out-File -FilePath $webConfigPath -Encoding utf8
        
        Write-Log "IIS配置完成" "Success"
    }
    catch {
        Write-Log "IIS配置失败: $($_.Exception.Message)" "Error"
        throw
    }
}

# 配置Nginx
function Configure-Nginx {
    param([string]$Port, [string]$IPAddress)
    Write-Log "正在配置Nginx..."
    
    try {
        # 安装Nginx
        if (!(Test-Path "C:\nginx")) {
            Write-Log "正在安装Nginx..."
            choco install nginx -y
        }
        
        # 创建Nginx配置
        $nginxConfig = @"
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    server {
        listen $IPAddress`:$Port;
        server_name $IPAddress;
        root $($PSScriptRoot.Replace('\', '/').Replace(':', ''))/dist;
        index index.html;

        location / {
            try_files `$uri `$uri/ /index.html;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|hdr)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location /vr-images/ {
            add_header Access-Control-Allow-Origin *;
        }
    }
}
"@
        
        $nginxConfigPath = "C:\nginx\conf\nginx.conf"
        $nginxConfig | Out-File -FilePath $nginxConfigPath -Encoding utf8
        
        # 测试配置
        & "C:\nginx\nginx.exe" -t
        
        # 启动Nginx
        Start-Process -FilePath "C:\nginx\nginx.exe" -WorkingDirectory "C:\nginx"
        
        Write-Log "Nginx配置完成" "Success"
    }
    catch {
        Write-Log "Nginx配置失败: $($_.Exception.Message)" "Error"
        throw
    }
}

# 主函数
function Main {
    Write-Log "开始部署利川水库VR监测系统..." "Success"
    Write-Log "部署参数: IP地址=$IPAddress, 端口=$Port, Web服务器=$WebServer"
    
    # 检查管理员权限
    if (!(Test-Administrator)) {
        Write-Log "请以管理员身份运行此脚本" "Error"
        exit 1
    }
    
    # 检查项目目录
    if (!(Test-Path "./package.json")) {
        Write-Log "请在项目根目录运行此脚本" "Error"
        exit 1
    }
    
    try {
        # 安装依赖
        if (!$SkipDependencies) {
            Install-Chocolatey
            Install-NodeJS
            Install-Pnpm
        }
        
        # 构建项目
        if (!(Build-Project)) {
            exit 1
        }
        
        # 配置防火墙
        Configure-Firewall -Port $Port
        
        # 配置Web服务器
        switch ($WebServer.ToUpper()) {
            "IIS" { Configure-IIS -Port $Port -IPAddress $IPAddress }
            "NGINX" { Configure-Nginx -Port $Port -IPAddress $IPAddress }
            default { 
                Write-Log "不支持的Web服务器类型: $WebServer" "Error"
                exit 1
            }
        }
        
        Write-Log "部署完成！" "Success"
        Write-Log "内网访问地址: http://$IPAddress`:$Port" "Success"
        Write-Log "本地访问地址: http://localhost:$Port" "Success"
        
        # 自动打开浏览器
        Start-Process "http://$IPAddress`:$Port"
        
    }
    catch {
        Write-Log "部署失败: $($_.Exception.Message)" "Error"
        exit 1
    }
}

# 运行主函数
Main 
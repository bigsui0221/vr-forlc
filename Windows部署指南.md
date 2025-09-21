# 🚀 利川水库VR监测系统 - Windows服务器部署指南

## 📋 部署概览

本指南将帮助您在Windows服务器上部署利川水库VR监测系统，使其可供外部用户访问。

## 🛠️ 环境要求

### 系统要求
- **操作系统**: Windows Server 2016+ 或 Windows 10+
- **内存**: 最少4GB RAM
- **存储**: 最少10GB可用空间
- **网络**: 可访问互联网（用于安装依赖）

### 必需软件
- **Node.js**: 版本 20.19.0+ 或 22.12.0+
- **pnpm**: 包管理器
- **Web服务器**: IIS 或 Nginx 或 Apache

## 📦 第一步：环境准备

### 1.1 安装Node.js

```powershell
# 方法一：从官网下载安装
# 访问 https://nodejs.org/ 下载LTS版本

# 方法二：使用Chocolatey（推荐）
# 首先安装Chocolatey（如果没有）
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装Node.js
choco install nodejs

# 验证安装
node --version
npm --version
```

### 1.2 安装pnpm

```powershell
# 安装pnpm
npm install -g pnpm

# 验证安装
pnpm --version
```

### 1.3 安装Git（如果需要从远程仓库拉取代码）

```powershell
# 使用Chocolatey安装Git
choco install git

# 验证安装
git --version
```

## 🔧 第二步：获取和构建项目

### 2.1 获取项目代码

```powershell
# 如果项目在远程仓库
git clone <你的仓库地址>
cd vr-forlc

# 如果项目在本地，直接导航到项目目录
cd D:\水库二期\vr-forlc
```

### 2.2 安装项目依赖

```powershell
# 使用pnpm安装依赖
pnpm install

# 如果遇到网络问题，可以使用淘宝镜像
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

### 2.3 构建生产版本

```powershell
# 构建项目
pnpm run build

# 构建完成后，dist目录包含所有静态文件
```

## 🌐 第三步：Web服务器配置

### 方案A：使用IIS（推荐用于Windows环境）

#### 3.1 启用IIS功能

```powershell
# 以管理员身份运行PowerShell
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45
```

#### 3.2 配置IIS站点

1. 打开IIS管理器
2. 右键点击"Sites" -> "Add Website"
3. 配置如下：
   - **Site name**: LC-VR-Monitor
   - **Physical path**: `D:\水库二期\vr-forlc\dist`
   - **Port**: 80 或 8080
   - **Host name**: （可选）你的域名

#### 3.3 配置URL重写（重要）

由于这是一个Vue单页应用，需要配置URL重写：

```xml
<!-- 在dist目录下创建 web.config 文件 -->
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
  </system.webServer>
</configuration>
```

### 方案B：使用Nginx

#### 3.1 安装Nginx

```powershell
# 下载Nginx for Windows
# 访问 http://nginx.org/en/download.html
# 解压到 C:\nginx

# 或使用Chocolatey
choco install nginx
```

#### 3.2 配置Nginx

编辑 `C:\nginx\conf\nginx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com; # 替换为你的域名或IP
    root D:/水库二期/vr-forlc/dist;
    index index.html;

    # 处理Vue Router的history模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|hdr)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # VR资源
    location /vr-images/ {
        add_header Access-Control-Allow-Origin *;
    }
}
```

#### 3.3 启动Nginx

```powershell
# 测试配置
C:\nginx\nginx.exe -t

# 启动Nginx
C:\nginx\nginx.exe

# 或作为Windows服务运行
# 下载 nginx-service.exe 并安装为服务
```

## 🔐 第四步：网络和安全配置

### 4.1 配置Windows防火墙

```powershell
# 允许HTTP流量（端口80）
New-NetFirewallRule -DisplayName "HTTP Traffic" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# 允许HTTPS流量（端口443，如果使用SSL）
New-NetFirewallRule -DisplayName "HTTPS Traffic" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# 允许自定义端口（如8080）
New-NetFirewallRule -DisplayName "Web App Port 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

### 4.2 配置路由器端口转发（如果需要）

如果服务器在内网，需要在路由器上配置端口转发：
- 外部端口：80 或 443
- 内部IP：服务器的内网IP
- 内部端口：80 或你配置的端口

## 🚀 第五步：启动和测试

### 5.1 启动服务

```powershell
# 如果使用IIS
# 在IIS管理器中启动站点

# 如果使用Nginx
cd C:\nginx
nginx.exe
```

### 5.2 测试访问

```powershell
# 本地测试
Start-Process "http://localhost"

# 或使用具体端口
Start-Process "http://localhost:8080"
```

### 5.3 外部访问测试

从其他设备访问：
- `http://服务器IP地址`
- `http://服务器域名`

## 🔧 第六步：后端API配置（可选）

如果你的VR系统需要后端API支持（根据vite.config.js中的代理配置），需要：

### 6.1 配置API服务器

你的项目配置了到`localhost:3000`的代理，这意味着可能需要一个后端服务：

```javascript
// vite.config.js中的代理配置显示需要后端
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false
  },
  '/tiles': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false
  }
}
```

### 6.2 部署后端服务（如果有）

如果你有独立的后端服务，可以：

```powershell
# 使用PM2管理Node.js后端（如果有）
npm install -g pm2
pm2 start your-backend-app.js --name "lc-vr-api"
pm2 startup
pm2 save
```

### 6.3 修改生产环境API地址

由于生产环境不能使用vite的代理，你可能需要：

1. 在Vue项目中配置环境变量：

```javascript
// .env.production
VITE_API_BASE_URL=http://your-server-ip:3000
```

2. 修改API调用代码使用环境变量：

```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
```

## 📱 第七步：移动端和VR访问优化

### 7.1 HTTPS配置（VR功能通常需要HTTPS）

```powershell
# 获取SSL证书（Let's Encrypt或商业证书）
# 在IIS或Nginx中配置SSL

# 对于测试，可以使用自签名证书
# 注意：浏览器会显示安全警告
```

### 7.2 响应式测试

测试不同设备的访问：
- 桌面浏览器
- 移动设备
- VR设备浏览器

## 🎯 性能优化建议

### 8.1 启用Gzip压缩

#### IIS中启用压缩
```xml
<!-- 在web.config中添加 -->
<system.webServer>
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
```

### 8.2 CDN配置（可选）

对于更好的全球访问性能，可以考虑使用CDN服务。

## 🔍 故障排除

### 常见问题

1. **页面无法加载**
   - 检查防火墙设置
   - 验证Web服务器状态
   - 查看服务器错误日志

2. **VR功能不工作**
   - 确保使用HTTPS
   - 检查浏览器VR支持
   - 验证VR资源文件是否可访问

3. **API调用失败**
   - 检查后端服务状态
   - 验证代理配置
   - 查看浏览器控制台错误

### 日志查看

```powershell
# IIS日志位置
C:\inetpub\logs\LogFiles\

# Nginx日志位置
C:\nginx\logs\

# 实时查看日志
Get-Content -Path "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Wait -Tail 10
```

## 📞 维护建议

1. **定期更新**: 保持Node.js和依赖包的更新
2. **备份**: 定期备份项目文件和配置
3. **监控**: 设置服务器性能监控
4. **安全**: 定期检查安全更新

---

🎉 **恭喜！** 你的利川水库VR监测系统现在已经可以通过网络访问了！

如果遇到任何问题，请检查防火墙设置、服务器配置和网络连接。 
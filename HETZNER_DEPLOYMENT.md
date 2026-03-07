# Hetzner Deployment Guide for s8vr

This guide will walk you through deploying the s8vr backend to a Hetzner VPS (Virtual Private Server).

---

## 📋 Prerequisites

1. **Hetzner Account**: Sign up at [hetzner.com](https://www.hetzner.com)
2. **Domain Name** (optional but recommended): For SSL certificates
3. **SSH Access**: Basic knowledge of Linux commands
4. **Environment Variables**: Have all your API keys ready

---

## 🚀 Step 1: Create a Hetzner VPS

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud)
2. Click **"Add Server"**
3. **Choose configuration:**
   - **Location**: Choose closest to your users (e.g., Nuremberg, Falkenstein)
   - **Image**: Ubuntu 22.04 or 24.04
   - **Type**: 
     - **CX11** (2 vCPU, 4GB RAM) - Good for testing/small apps (~€4/month)
     - **CX21** (3 vCPU, 8GB RAM) - Recommended for production (~€8/month)
     - **CX31** (4 vCPU, 16GB RAM) - For larger scale (~€16/month)
4. **SSH Keys**: Add your SSH public key (or create one)
5. **Networking**: Default is fine
6. Click **"Create & Buy Now"**

---

## 🔧 Step 2: Initial Server Setup

### Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### Update System

```bash
apt update && apt upgrade -y
```

### Create Non-Root User (Recommended)

```bash
adduser s8vr
usermod -aG sudo s8vr
su - s8vr
```

---

## 📦 Step 3: Install Dependencies

### Install Node.js (via NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
npm --version
```

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Install Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Install Git

```bash
sudo apt install -y git
```

### Install Build Tools (for native modules)

```bash
sudo apt install -y build-essential
```

---

## 🔐 Step 4: Setup SSL with Let's Encrypt

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get SSL Certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

**Note**: Replace `api.yourdomain.com` with your actual domain. If you don't have a domain, you can skip SSL for now (not recommended for production).

---

## 📥 Step 5: Clone and Setup Backend

### Clone Repository

```bash
cd /home/s8vr
git clone https://github.com/YOUR_USERNAME/s8vr-App.git
cd s8vr-App/backend
```

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

---

## ⚙️ Step 6: Configure Environment Variables

### Create .env File

```bash
nano /home/s8vr/s8vr-App/backend/.env
```

### Add All Required Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app

# Supabase Configuration
SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Authentication (optional)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration (Resend)
RESEND_API_KEY=re_your_resend_api_key_here
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

### Secure the .env File

```bash
chmod 600 /home/s8vr/s8vr-App/backend/.env
```

---

## 🔄 Step 7: Setup PM2 Process Manager

### Option A: Start with Ecosystem Config (Recommended)

```bash
cd /home/s8vr/s8vr-App/backend
pm2 start ecosystem.config.js
```

### Option B: Start Manually

```bash
cd /home/s8vr/s8vr-App/backend
pm2 start dist/server.js --name s8vr-backend
```

### Save PM2 Configuration

```bash
pm2 save
pm2 startup
```

Follow the instructions to enable PM2 on system startup.

### Useful PM2 Commands

```bash
pm2 list              # View all processes
pm2 logs s8vr-backend # View logs
pm2 restart s8vr-backend # Restart
pm2 stop s8vr-backend    # Stop
pm2 monit             # Monitor dashboard
```

---

## 🌐 Step 8: Configure Nginx Reverse Proxy

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/s8vr-backend
```

### Add Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain or IP

    # Redirect HTTP to HTTPS (if using SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# If using SSL, uncomment and configure:
# server {
#     listen 443 ssl http2;
#     server_name api.yourdomain.com;
# 
#     ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
# 
#     location / {
#         proxy_pass http://localhost:3001;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#     }
# }
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/s8vr-backend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## 🔥 Step 9: Configure Firewall

### Allow Required Ports

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

---

## ✅ Step 10: Verify Deployment

### Check Backend is Running

```bash
pm2 list
curl http://localhost:3001/health
```

### Test from Your Machine

```bash
curl http://YOUR_SERVER_IP/health
# Or with domain:
curl https://api.yourdomain.com/health
```

Should return:
```json
{"status":"ok","message":"s8vr backend is running",...}
```

---

## 🔄 Step 11: Setup Auto-Deployment (Optional)

### Option A: Use Provided Deployment Script

The repository includes a `deploy.sh` script in the `backend` folder:

```bash
cd /home/s8vr/s8vr-App/backend
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Pull latest changes
- Install dependencies
- Build the project
- Restart PM2 process
- Show status and logs

### Option B: GitHub Actions (Recommended)

Create `.github/workflows/deploy-hetzner.yml`:

```yaml
name: Deploy to Hetzner

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: ${{ secrets.HETZNER_USER }}
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd /home/s8vr/s8vr-App
            git pull origin main
            cd backend
            npm install
            npm run build
            pm2 restart s8vr-backend
```

Add secrets in GitHub:
- `HETZNER_HOST`: Your server IP
- `HETZNER_USER`: `s8vr` (or your user)
- `HETZNER_SSH_KEY`: Your private SSH key

---

## 🔗 Step 12: Configure Stripe Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://api.yourdomain.com/api/webhooks/stripe`
4. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
5. Copy the **Signing secret** and add it to your `.env` file
6. Restart PM2: `pm2 restart s8vr-backend`

---

## 🔄 Step 13: Update Frontend Configuration

1. Go to **Vercel** → Your project → **Settings** → **Environment Variables**
2. Update `VITE_API_URL` to your Hetzner URL:
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```
3. Redeploy your frontend

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs s8vr-backend

# Check if port is in use
sudo netstat -tulpn | grep 3001

# Check environment variables
pm2 env s8vr-backend
```

### Nginx Not Working

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Port Already in Use

```bash
# Find process using port 3001
sudo lsof -i :3001

# Kill process
sudo kill -9 PID
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
pm2 monit  # Real-time monitoring
pm2 logs   # View all logs
```

### System Resources

```bash
htop        # CPU/Memory usage
df -h       # Disk usage
free -h     # Memory usage
```

### Setup Log Rotation

PM2 handles log rotation automatically, but you can configure it:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔐 Security Best Practices

1. **Keep System Updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use SSH Keys Only** (disable password auth):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

3. **Setup Fail2Ban** (prevent brute force):
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   ```

4. **Regular Backups**: Setup automated backups of your `.env` file and database

5. **Firewall**: Only open necessary ports

---

## 💰 Cost Estimation

- **CX11** (2 vCPU, 4GB): ~€4/month - Good for testing
- **CX21** (3 vCPU, 8GB): ~€8/month - Recommended for production
- **Domain**: ~€10-15/year (optional)
- **SSL**: Free with Let's Encrypt

**Total**: ~€8-15/month for a production setup

---

## 📚 Additional Resources

- [Hetzner Cloud Documentation](https://docs.hetzner.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## ✅ Deployment Checklist

- [ ] Hetzner VPS created
- [ ] Server updated and secured
- [ ] Node.js and dependencies installed
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] Backend built and started with PM2
- [ ] Nginx configured and running
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured
- [ ] Health check endpoint working
- [ ] Stripe webhook configured
- [ ] Frontend `VITE_API_URL` updated
- [ ] Monitoring set up
- [ ] Auto-deployment configured (optional)

---

## 🎉 You're Done!

Your backend should now be live on Hetzner at:
- `http://YOUR_SERVER_IP` (or `https://api.yourdomain.com` if using domain)

Update your frontend's `VITE_API_URL` environment variable to point to this URL, and you're all set!

---

## 🔄 Updating the Application

### Manual Update

```bash
cd /home/s8vr/s8vr-App
git pull origin main
cd backend
npm install
npm run build
pm2 restart s8vr-backend
```

### With Deployment Script

```bash
./deploy.sh
```

---

## 📝 Notes

- **Database**: This guide assumes you're using Supabase (cloud database). If you want to host PostgreSQL on Hetzner, you'll need additional setup.
- **Frontend**: Deploy frontend to Vercel (recommended) or another service. Hetzner is mainly for the backend.
- **Scaling**: For higher traffic, consider using Hetzner Load Balancer or multiple VPS instances.

# Aksam Media Boost - Deployment Guide

## Prerequisites
- Ubuntu 20.04 or higher
- Node.js 16+ and npm 8+
- MongoDB 4.4+
- Nginx
- PM2
- SSL Certificate (Let's Encrypt recommended)

## Step 1: Server Setup

### Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install MongoDB
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install PM2
```bash
sudo npm install -g pm2
```

### Install Certbot for SSL
```bash
sudo apt install certbot python3-certbot-nginx -y
```

## Step 2: Application Setup

### Clone Repository
```bash
cd /var/www
sudo git clone <your-repo-url> aksam-media-boost
sudo chown -R $USER:$USER aksam-media-boost
cd aksam-media-boost
```

### Backend Setup
```bash
cd backend
npm install --production

# Create environment file
cp .env.example .env
nano .env
```

**Important .env variables to update:**
- `MONGO_URI=mongodb://localhost:27017/aksam_media_boost`
- `JWT_SECRET=your_long_random_secret_key`
- `SMM_API_KEY=your_smm_provider_api_key`
- `SMM_API_URL=https://api.smmprovider.com/v1`
- `NODE_ENV=production`
- `FRONTEND_URL=https://yourdomain.com`

### Frontend Setup
```bash
cd ../frontend
npm install
npm run build
```

## Step 3: Database Setup

### Create MongoDB Database and User
```bash
mongosh
```
```javascript
use aksam_media_boost
db.createUser({
  user: "aksam_user",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "aksam_media_boost" }]
})
exit
```

### Update MongoDB Configuration
```bash
sudo nano /etc/mongod.conf
```

Add/update these settings:
```yaml
# Network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1

# Security
security:
  authorization: enabled
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

Update your .env with authentication:
```
MONGO_URI=mongodb://aksam_user:your_secure_password@localhost:27017/aksam_media_boost
```

## Step 4: PM2 Configuration

### Create PM2 Ecosystem File
```bash
cd /var/www/aksam-media-boost
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'aksam-api',
      script: './backend/server.js',
      cwd: '/var/www/aksam-media-boost',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
```

### Create Logs Directory
```bash
mkdir -p logs
```

### Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 5: Nginx Configuration

### Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/aksam-media-boost
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API Backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Frontend Static Files
    location / {
        root /var/www/aksam-media-boost/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/aksam-media-boost /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: SSL Certificate Setup

### Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to obtain and install the SSL certificate.

### Auto-renewal
```bash
sudo crontab -e
```

Add this line:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 7: Firewall Setup

### Configure UFW
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 8: Monitoring and Maintenance

### PM2 Monitoring
```bash
# View running processes
pm2 status

# View logs
pm2 logs

# Restart application
pm2 restart all

# Monitor CPU/Memory
pm2 monit
```

### Set up Log Rotation
```bash
sudo nano /etc/logrotate.d/aksam-media-boost
```

```
/var/www/aksam-media-boost/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Database Backups
```bash
# Create backup script
sudo nano /usr/local/bin/backup-mongodb.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
DB_NAME="aksam_media_boost"

mkdir -p $BACKUP_DIR

mongodump --db $DB_NAME --out $BACKUP_DIR/backup_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -type d -name "backup_*" -mtime +7 -exec rm -rf {} \;
```

```bash
sudo chmod +x /usr/local/bin/backup-mongodb.sh
```

Add to crontab for daily backups at 2 AM:
```bash
sudo crontab -e
```

```
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

## Step 9: Performance Optimization

### Enable MongoDB Indexing
The application will automatically create indexes, but you can verify:
```bash
mongosh aksam_media_boost
db.users.getIndexes()
db.orders.getIndexes()
db.services.getIndexes()
db.transactions.getIndexes()
```

### Nginx Optimization
Add to your nginx config:
```nginx
# Worker processes
worker_processes auto;

# Connections
events {
    worker_connections 1024;
}

# Add to http block
http {
    client_max_body_size 20M;
    client_body_timeout 60s;
    client_header_timeout 60s;
}
```

## Step 10: Security Hardening

### MongoDB Security
- Ensure authentication is enabled
- Change default MongoDB port if possible
- Use firewall to restrict access

### Application Security
- Regularly update dependencies
- Use environment variables for secrets
- Implement rate limiting
- Monitor logs for suspicious activity

### Server Security
```bash
# Disable root SSH login
sudo nano /etc/ssh/sshd_config
```
```
PermitRootLogin no
PasswordAuthentication no
```

```bash
sudo systemctl restart ssh
```

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Check logs: `pm2 logs`
   - Verify .env configuration
   - Ensure MongoDB is running

2. **Database connection errors**
   - Verify MongoDB URI
   - Check MongoDB service: `sudo systemctl status mongod`
   - Check authentication credentials

3. **Nginx 502 errors**
   - Check if backend is running: `pm2 status`
   - Verify port 5000 is accessible
   - Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

4. **SSL certificate issues**
   - Verify domain DNS records
   - Check certificate expiration: `sudo certbot certificates`
   - Renew manually if needed: `sudo certbot renew`

### Useful Commands
```bash
# Check application status
pm2 status

# View real-time logs
pm2 logs --lines 100

# Restart application
pm2 restart aksam-api

# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## Maintenance Tasks

### Weekly
- Check application logs for errors
- Monitor disk space usage
- Review security logs

### Monthly
- Update system packages
- Update Node.js dependencies
- Check SSL certificate expiration
- Review and rotate database backups

### Quarterly
- Performance optimization review
- Security audit
- Dependency vulnerability scan
- Update documentation

This deployment guide provides a production-ready setup for the Aksam Media Boost SMM Panel with proper security, monitoring, and maintenance procedures.

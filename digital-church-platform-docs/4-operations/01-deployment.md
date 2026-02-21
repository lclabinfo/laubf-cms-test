# 20. Deployment & Infrastructure

## Enterprise-Grade Multi-Tenant SaaS Deployment

**Version**: 3.1 Enterprise Edition
**Last Updated**: December 2024
**Category**: Technical Infrastructure

---

## Deployment Options Comparison

| Feature | Vercel | AWS ECS | Docker/K8s | On-Premise |
|---------|--------|---------|------------|------------|
| Setup Complexity | Low | Medium | High | High |
| Scaling | Auto | Auto | Manual/Auto | Manual |
| Cost (Small) | $20/mo | $100/mo | $50/mo | $200/mo |
| Cost (Large) | $150/mo | $500/mo | $300/mo | $500/mo |
| Multi-Tenant | Excellent | Excellent | Good | Good |
| Custom Domains | Easy | Medium | Medium | Hard |
| SSL Management | Automatic | ACM | Manual/Auto | Manual |
| Best For | Startups | Enterprise | Hybrid | Compliance |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Digital Church Platform Infrastructure                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        DNS & CDN Layer                                       │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │ │
│  │  │  Cloudflare   │  │   Route 53    │  │  CloudFront   │                   │ │
│  │  │  (DNS/CDN)    │  │  (DNS/Health) │  │  (CDN/WAF)    │                   │ │
│  │  └───────────────┘  └───────────────┘  └───────────────┘                   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                       Load Balancing Layer                                   │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │ │
│  │  │ Vercel Edge   │  │   AWS ALB     │  │    Nginx      │                   │ │
│  │  │  Functions    │  │  (Regional)   │  │  (Ingress)    │                   │ │
│  │  └───────────────┘  └───────────────┘  └───────────────┘                   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                       Application Layer                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │  Next.js     │  │  Next.js     │  │  Next.js     │  │  Background  │   │ │
│  │  │  Instance 1  │  │  Instance 2  │  │  Instance N  │  │  Workers     │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        Data Layer                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │ PostgreSQL   │  │    Redis     │  │  S3/R2       │  │    Mux       │   │ │
│  │  │  (Primary)   │  │   (Cache)    │  │  (Storage)   │  │  (Streaming) │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Vercel Deployment (Recommended)

### 1.1 Project Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 1.2 vercel.json Configuration

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && npm run build",
  "installCommand": "npm ci",
  "regions": ["iad1", "sfo1", "cdg1", "icn1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    },
    "app/api/webhooks/**/*.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/process-emails",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/process-donations",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/generate-reports",
      "schedule": "0 6 * * 1"
    }
  ],
  "rewrites": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "(?<subdomain>[^.]+)\\.digitalchurch\\.com"
        }
      ],
      "destination": "/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### 1.3 Environment Variables

```bash
# Set production environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add REDIS_URL production
vercel env add MUX_TOKEN_ID production
vercel env add MUX_TOKEN_SECRET production
vercel env add SENDGRID_API_KEY production

# Verify environment variables
vercel env ls

# Pull environment to local
vercel env pull .env.local
```

### 1.4 Multi-Tenant Domain Setup

```bash
# Vercel Dashboard → Settings → Domains

# Add wildcard domain
*.digitalchurch.com

# DNS Configuration (Cloudflare/Route53)
# Type: CNAME
# Name: *
# Target: cname.vercel-dns.com

# Custom domain verification
# Add TXT record for domain verification
```

### 1.5 Edge Middleware for Tenant Resolution

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Platform admin
  if (hostname === 'admin.digitalchurch.com') {
    url.pathname = `/platform-admin${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Extract tenant from subdomain or custom domain
  let tenantSlug: string | null = null;

  if (hostname.endsWith('.digitalchurch.com')) {
    // Subdomain tenant
    tenantSlug = hostname.replace('.digitalchurch.com', '');
  } else {
    // Custom domain - look up in Edge Config or KV
    const customDomain = await getCustomDomain(hostname);
    if (customDomain) {
      tenantSlug = customDomain.tenantSlug;
    }
  }

  if (!tenantSlug) {
    return NextResponse.redirect('https://digitalchurch.com');
  }

  // Add tenant context to headers
  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', tenantSlug);
  response.headers.set('x-original-host', hostname);

  return response;
}

async function getCustomDomain(hostname: string) {
  // Use Vercel Edge Config for fast lookups
  try {
    const { get } = await import('@vercel/edge-config');
    return await get(`domain:${hostname}`);
  } catch {
    return null;
  }
}
```

---

## 2. Docker Deployment

### 2.1 Production Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

### 2.2 Docker Compose Production

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: church_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d church_platform"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/cache:/var/cache/nginx
    depends_on:
      - app
    restart: unless-stopped

  # Background worker for queue processing
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    deploy:
      replicas: 2

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    driver: bridge
```

### 2.3 Nginx Configuration

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/rss+xml application/atom+xml image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    # Upstream
    upstream app {
        least_conn;
        server app:3000 weight=1 max_fails=3 fail_timeout=30s;
        keepalive 64;
    }

    # Cache
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static:10m inactive=7d use_temp_path=off;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Default server (redirect to HTTPS)
    server {
        listen 80 default_server;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # Wildcard subdomain server
    server {
        listen 443 ssl http2;
        server_name *.digitalchurch.com digitalchurch.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Security headers
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Static assets
        location /_next/static {
            proxy_cache static;
            proxy_pass http://app;
            proxy_cache_valid 200 7d;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }

        location /static {
            proxy_cache static;
            proxy_pass http://app;
            proxy_cache_valid 200 1d;
            add_header Cache-Control "public, max-age=86400";
        }

        # API rate limiting
        location /api/auth {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://app;
            include /etc/nginx/conf.d/proxy.conf;
        }

        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            include /etc/nginx/conf.d/proxy.conf;
        }

        # WebSocket support
        location /socket.io {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400;
        }

        # Default
        location / {
            proxy_pass http://app;
            include /etc/nginx/conf.d/proxy.conf;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    include /etc/nginx/conf.d/*.conf;
}
```

```nginx
# nginx/conf.d/proxy.conf
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_cache_bypass $http_upgrade;
proxy_read_timeout 60s;
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
```

---

## 3. AWS ECS/Fargate Deployment

### 3.1 Terraform Infrastructure

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "digitalchurch-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "DigitalChurch"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

variable "app_name" {
  default = "digitalchurch"
}

# VPC Module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.app_name}-vpc"
  cidr = "10.0.0.0/16"

  azs              = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets   = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  database_subnets = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  create_database_subnet_group = true
}

# RDS PostgreSQL
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.app_name}-db"

  engine               = "postgres"
  engine_version       = "16"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_encrypted     = true

  db_name  = "church_platform"
  username = "dbadmin"
  port     = 5432

  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]

  maintenance_window          = "Mon:00:00-Mon:03:00"
  backup_window               = "03:00-06:00"
  backup_retention_period     = 30
  deletion_protection         = true
  skip_final_snapshot         = false
  final_snapshot_identifier_prefix = "${var.app_name}-final"

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  parameters = [
    {
      name  = "max_connections"
      value = "500"
    },
    {
      name  = "shared_buffers"
      value = "{DBInstanceClassMemory/4}"
    }
  ]
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.app_name}-redis"
  description                = "Redis cluster for Digital Church"
  node_type                  = "cache.r6g.large"
  num_cache_clusters         = 2
  port                       = 6379
  parameter_group_name       = "default.redis7"
  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]

  snapshot_retention_limit = 7
  snapshot_window          = "05:00-09:00"
  maintenance_window       = "mon:10:00-mon:14:00"
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"

      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.app_name}-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024
  memory                   = 2048
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" }
      ]

      secrets = [
        { name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.db_url.arn}" },
        { name = "NEXTAUTH_SECRET", valueFrom = "${aws_secretsmanager_secret.nextauth.arn}" },
        { name = "REDIS_URL", valueFrom = "${aws_secretsmanager_secret.redis_url.arn}" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "app"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  lifecycle {
    ignore_changes = [desired_count]
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 3
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.app_name}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = true

  access_logs {
    bucket  = aws_s3_bucket.logs.id
    prefix  = "alb"
    enabled = true
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = ""
  price_class         = "PriceClass_All"
  aliases             = ["*.digitalchurch.com", "digitalchurch.com"]

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "alb"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Origin", "Authorization"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  # Static assets caching
  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 31536000
    default_ttl            = 31536000
    max_ttl                = 31536000
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cloudfront.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  web_acl_id = aws_wafv2_web_acl.main.arn
}

# S3 for Static Assets
resource "aws_s3_bucket" "assets" {
  bucket = "${var.app_name}-assets-${var.environment}"
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Outputs
output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "rds_endpoint" {
  value     = module.rds.db_instance_endpoint
  sensitive = true
}
```

---

## 4. CI/CD Pipeline

### 4.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          NEXTAUTH_SECRET: test-secret
          NEXTAUTH_URL: http://localhost:3000

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-vercel:
    needs: [test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./

  deploy-aws:
    needs: [build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Push to ECR
        run: |
          docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          docker tag ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            ${{ steps.login-ecr.outputs.registry }}/digitalchurch:${{ github.sha }}
          docker push ${{ steps.login-ecr.outputs.registry }}/digitalchurch:${{ github.sha }}

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster digitalchurch-cluster \
            --service digitalchurch-service \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster digitalchurch-cluster \
            --services digitalchurch-service

  migrate:
    needs: [deploy-vercel, deploy-aws]
    runs-on: ubuntu-latest
    if: always() && (needs.deploy-vercel.result == 'success' || needs.deploy-aws.result == 'success')

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Notify success
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployment successful! :rocket:",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Complete*\n${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 5. Environment Configuration

### 5.1 Production Environment Variables

```bash
# .env.production

# =============================================================================
# Application
# =============================================================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://digitalchurch.com
NEXT_PUBLIC_PLATFORM_NAME="Digital Church Platform"

# =============================================================================
# Database (PostgreSQL)
# =============================================================================
DATABASE_URL="postgresql://user:password@host:5432/church_platform?schema=public&connection_limit=100&pool_timeout=20"

# =============================================================================
# Authentication
# =============================================================================
NEXTAUTH_URL=https://digitalchurch.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-64>

# =============================================================================
# Multi-Tenant Configuration
# =============================================================================
TENANT_SUBDOMAIN_SUFFIX=.digitalchurch.com
ENABLE_CUSTOM_DOMAINS=true
DEFAULT_TEMPLATE_ID=modern

# =============================================================================
# Redis
# =============================================================================
REDIS_URL=redis://username:password@host:6379
REDIS_TLS=true

# =============================================================================
# Email (SendGrid)
# =============================================================================
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@digitalchurch.com
EMAIL_REPLY_TO=support@digitalchurch.com

# =============================================================================
# Payments (Stripe)
# =============================================================================
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PLATFORM_FEE_PERCENT=2.0

# =============================================================================
# File Storage (S3/R2)
# =============================================================================
S3_BUCKET=digitalchurch-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=xxxxx
S3_SECRET_ACCESS_KEY=xxxxx
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
CDN_URL=https://cdn.digitalchurch.com

# =============================================================================
# Video Streaming (Mux)
# =============================================================================
MUX_TOKEN_ID=xxxxx
MUX_TOKEN_SECRET=xxxxx
MUX_WEBHOOK_SECRET=xxxxx

# =============================================================================
# Real-Time (Socket.io)
# =============================================================================
SOCKET_URL=wss://socket.digitalchurch.com

# =============================================================================
# Monitoring
# =============================================================================
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
LOG_LEVEL=warn

# =============================================================================
# Security
# =============================================================================
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
CORS_ORIGINS=https://digitalchurch.com,https://*.digitalchurch.com
```

---

## 6. Monitoring & Observability

### 6.1 Health Check Endpoints

Digital Church Platform implements a comprehensive health check strategy with separate endpoints for different monitoring needs.

#### Health Check Response Interface

```typescript
// types/health.ts
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    redis: HealthCheckResult;
    stripe?: HealthCheckResult;
    storage?: HealthCheckResult;
  };
  metrics?: {
    memory: MemoryMetrics;
    cpu?: CpuMetrics;
    requests?: RequestMetrics;
  };
}

export interface HealthCheckResult {
  status: 'ok' | 'error' | 'warning';
  latency?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  usagePercent: number;
}
```

#### Liveness Probe (`/health`)

Basic health check for container orchestration liveness probes.

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const startTime = Date.now();

export async function GET() {
  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {} as any,
    metrics: {
      memory: getMemoryMetrics(),
    },
  };

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'ok',
      latency: Date.now() - dbStart,
    };
  } catch (error: any) {
    health.checks.database = {
      status: 'error',
      error: error.message,
    };
    health.status = 'degraded';
  }

  // Redis check
  const redisStart = Date.now();
  try {
    await redis.ping();
    health.checks.redis = {
      status: 'ok',
      latency: Date.now() - redisStart,
    };
  } catch (error: any) {
    health.checks.redis = {
      status: 'error',
      error: error.message,
    };
    health.status = 'degraded';
  }

  // Stripe check
  const stripeStart = Date.now();
  try {
    const stripe = (await import('@/lib/stripe')).stripe;
    await stripe.balance.retrieve();
    health.checks.stripe = {
      status: 'ok',
      latency: Date.now() - stripeStart,
    };
  } catch (error: any) {
    health.checks.stripe = {
      status: 'error',
      error: error.message,
    };
    // Stripe failure doesn't degrade overall health - billing still processes
  }

  // Memory check
  if (health.metrics!.memory.usagePercent > 90) {
    health.status = health.status === 'healthy' ? 'degraded' : health.status;
  }

  // Determine overall status
  if (health.checks.database.status === 'error' && health.checks.redis.status === 'error') {
    health.status = 'unhealthy';
  }

  const statusCode =
    health.status === 'healthy' ? 200 :
    health.status === 'degraded' ? 200 :  // Degraded is still operational
    503;  // Unhealthy

  return NextResponse.json(health, { status: statusCode });
}

function getMemoryMetrics(): MemoryMetrics {
  const memUsage = process.memoryUsage();
  return {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    rss: Math.round(memUsage.rss / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
    usagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
  };
}
```

#### Readiness Probe (`/ready`)

Comprehensive readiness check for load balancer routing decisions.

```typescript
// app/api/ready/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

interface ReadinessCheck {
  ready: boolean;
  timestamp: string;
  dependencies: {
    database: DependencyStatus;
    redis: DependencyStatus;
    stripe: DependencyStatus;
    storage: DependencyStatus;
    migrations: DependencyStatus;
  };
  capacity: {
    canAcceptTraffic: boolean;
    currentLoad: number;
    maxLoad: number;
  };
}

interface DependencyStatus {
  available: boolean;
  latency?: number;
  version?: string;
  error?: string;
}

export async function GET() {
  const readiness: ReadinessCheck = {
    ready: true,
    timestamp: new Date().toISOString(),
    dependencies: {} as any,
    capacity: {
      canAcceptTraffic: true,
      currentLoad: await getCurrentLoad(),
      maxLoad: 100,
    },
  };

  // Check all dependencies in parallel
  const [dbStatus, redisStatus, stripeStatus, storageStatus, migrationStatus] =
    await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkStripe(),
      checkStorage(),
      checkMigrations(),
    ]);

  readiness.dependencies = {
    database: dbStatus,
    redis: redisStatus,
    stripe: stripeStatus,
    storage: storageStatus,
    migrations: migrationStatus,
  };

  // Determine readiness
  // Critical dependencies: database is required, redis is required for sessions
  if (!dbStatus.available || !redisStatus.available) {
    readiness.ready = false;
  }

  // Check if migrations are pending
  if (!migrationStatus.available) {
    readiness.ready = false;
  }

  // Check capacity
  if (readiness.capacity.currentLoad >= readiness.capacity.maxLoad) {
    readiness.capacity.canAcceptTraffic = false;
    readiness.ready = false;
  }

  return NextResponse.json(readiness, {
    status: readiness.ready ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

async function checkDatabase(): Promise<DependencyStatus> {
  const start = Date.now();
  try {
    const result = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`;
    return {
      available: true,
      latency: Date.now() - start,
      version: result[0]?.version?.split(' ')[1] || 'unknown',
    };
  } catch (error: any) {
    return { available: false, error: error.message };
  }
}

async function checkRedis(): Promise<DependencyStatus> {
  const start = Date.now();
  try {
    const info = await redis.info('server');
    const versionMatch = info.match(/redis_version:(\S+)/);
    return {
      available: true,
      latency: Date.now() - start,
      version: versionMatch?.[1] || 'unknown',
    };
  } catch (error: any) {
    return { available: false, error: error.message };
  }
}

async function checkStripe(): Promise<DependencyStatus> {
  const start = Date.now();
  try {
    await stripe.balance.retrieve();
    return {
      available: true,
      latency: Date.now() - start,
    };
  } catch (error: any) {
    // Stripe being down is not critical for readiness
    return {
      available: true, // Still consider ready, but note the issue
      latency: Date.now() - start,
      error: `Stripe connection warning: ${error.message}`,
    };
  }
}

async function checkStorage(): Promise<DependencyStatus> {
  const start = Date.now();
  try {
    // Check S3/R2 connectivity
    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      endpoint: process.env.S3_ENDPOINT,
    });
    await s3.send(new HeadBucketCommand({
      Bucket: process.env.S3_BUCKET_NAME!
    }));
    return { available: true, latency: Date.now() - start };
  } catch (error: any) {
    return { available: true, error: error.message }; // Non-critical
  }
}

async function checkMigrations(): Promise<DependencyStatus> {
  try {
    // Check if there are pending migrations
    const pendingMigrations = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM _prisma_migrations
      WHERE finished_at IS NULL AND rolled_back_at IS NULL
    `;
    const pending = Number(pendingMigrations[0]?.count || 0);
    return {
      available: pending === 0,
      error: pending > 0 ? `${pending} pending migrations` : undefined,
    };
  } catch {
    return { available: true }; // Assume OK if can't check
  }
}

async function getCurrentLoad(): Promise<number> {
  try {
    // Get current request count from Redis
    const count = await redis.get('metrics:current_requests') || '0';
    return parseInt(count, 10);
  } catch {
    return 0;
  }
}
```

### 6.2 OpenTelemetry Integration

Comprehensive observability with distributed tracing, metrics, and logs.

```typescript
// lib/telemetry/setup.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader, MeterProvider } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrismaInstrumentation } from '@prisma/instrumentation';

const isProduction = process.env.NODE_ENV === 'production';

// Initialize OpenTelemetry SDK
export function initTelemetry() {
  if (!isProduction) return;

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'digital-church-platform',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  });

  // Trace exporter
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
    headers: {
      'api-key': process.env.OTEL_API_KEY,
    },
  });

  // Metric exporter
  const metricExporter = new OTLPMetricExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/metrics',
    headers: {
      'api-key': process.env.OTEL_API_KEY,
    },
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 60000, // Export every minute
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
      new PrismaInstrumentation(),
    ],
  });

  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Telemetry SDK shut down'))
      .catch((error) => console.error('Error shutting down SDK', error))
      .finally(() => process.exit(0));
  });
}

// lib/telemetry/metrics.ts
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('digital-church-platform');

// Request metrics
export const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

export const requestDuration = meter.createHistogram('http_request_duration_ms', {
  description: 'HTTP request duration in milliseconds',
  unit: 'ms',
});

export const activeRequestsGauge = meter.createUpDownCounter('http_active_requests', {
  description: 'Number of active HTTP requests',
});

// Business metrics
export const donationCounter = meter.createCounter('donations_total', {
  description: 'Total number of donations processed',
});

export const donationAmount = meter.createHistogram('donation_amount_usd', {
  description: 'Donation amounts in USD',
  unit: 'usd',
});

export const activeTenantsGauge = meter.createObservableGauge('active_tenants', {
  description: 'Number of active tenant organizations',
});

export const memberRegistrations = meter.createCounter('member_registrations_total', {
  description: 'Total member registrations',
});

export const eventRegistrations = meter.createCounter('event_registrations_total', {
  description: 'Total event registrations',
});

// System metrics
export const dbQueryDuration = meter.createHistogram('db_query_duration_ms', {
  description: 'Database query duration',
  unit: 'ms',
});

export const cacheHitRatio = meter.createObservableGauge('cache_hit_ratio', {
  description: 'Redis cache hit ratio',
});

export const queueLength = meter.createObservableGauge('job_queue_length', {
  description: 'Number of jobs in queue',
});
```

### 6.3 Business Metrics Dashboard

Key performance indicators for platform health and business insights.

```typescript
// lib/metrics/business.ts
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import {
  activeTenantsGauge,
  donationCounter,
  donationAmount,
  cacheHitRatio,
  queueLength
} from '@/lib/telemetry/metrics';

export interface PlatformMetrics {
  tenants: {
    total: number;
    active: number;      // Active in last 30 days
    trial: number;       // Currently in trial
    churned: number;     // Churned this month
  };
  revenue: {
    mrr: number;         // Monthly Recurring Revenue
    arr: number;         // Annual Recurring Revenue
    averageRevenuePerTenant: number;
  };
  engagement: {
    monthlyActiveUsers: number;
    dailyActiveUsers: number;
    averageSessionDuration: number;
  };
  donations: {
    totalThisMonth: number;
    countThisMonth: number;
    averageDonation: number;
    recurringDonations: number;
  };
  system: {
    uptimePercent: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRatio: number;
  };
}

export async function collectPlatformMetrics(): Promise<PlatformMetrics> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    tenantStats,
    revenueStats,
    engagementStats,
    donationStats,
    systemStats,
  ] = await Promise.all([
    collectTenantMetrics(thirtyDaysAgo),
    collectRevenueMetrics(),
    collectEngagementMetrics(thirtyDaysAgo),
    collectDonationMetrics(startOfMonth),
    collectSystemMetrics(),
  ]);

  return {
    tenants: tenantStats,
    revenue: revenueStats,
    engagement: engagementStats,
    donations: donationStats,
    system: systemStats,
  };
}

async function collectTenantMetrics(thirtyDaysAgo: Date) {
  const [total, active, trial, churned] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({
      where: {
        OR: [
          { auditLogs: { some: { createdAt: { gte: thirtyDaysAgo } } } },
          { updatedAt: { gte: thirtyDaysAgo } },
        ],
      },
    }),
    prisma.tenant.count({
      where: { subscription: { status: 'trialing' } },
    }),
    prisma.tenant.count({
      where: {
        subscription: {
          status: 'canceled',
          canceledAt: { gte: thirtyDaysAgo },
        },
      },
    }),
  ]);

  // Update OpenTelemetry gauge
  activeTenantsGauge.addCallback((result) => {
    result.observe(active, { status: 'active' });
  });

  return { total, active, trial, churned };
}

async function collectRevenueMetrics() {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: { in: ['active', 'trialing'] } },
    include: { plan: true },
  });

  const mrr = subscriptions.reduce((sum, sub) => {
    const monthlyPrice = sub.billingCycle === 'yearly'
      ? sub.plan.priceYearly / 12
      : sub.plan.priceMonthly;
    return sum + monthlyPrice;
  }, 0);

  return {
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    averageRevenuePerTenant: subscriptions.length > 0
      ? Math.round((mrr / subscriptions.length) * 100) / 100
      : 0,
  };
}

async function collectEngagementMetrics(thirtyDaysAgo: Date) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [mau, dau] = await Promise.all([
    prisma.user.count({
      where: { lastLoginAt: { gte: thirtyDaysAgo } },
    }),
    prisma.user.count({
      where: { lastLoginAt: { gte: oneDayAgo } },
    }),
  ]);

  // Get average session duration from analytics
  const avgDuration = await redis.get('metrics:avg_session_duration');

  return {
    monthlyActiveUsers: mau,
    dailyActiveUsers: dau,
    averageSessionDuration: parseInt(avgDuration || '0', 10),
  };
}

async function collectDonationMetrics(startOfMonth: Date) {
  const donations = await prisma.donation.aggregate({
    where: {
      createdAt: { gte: startOfMonth },
      status: 'completed',
    },
    _sum: { amount: true },
    _count: true,
    _avg: { amount: true },
  });

  const recurring = await prisma.donation.count({
    where: {
      createdAt: { gte: startOfMonth },
      recurringId: { not: null },
    },
  });

  return {
    totalThisMonth: donations._sum.amount?.toNumber() || 0,
    countThisMonth: donations._count,
    averageDonation: donations._avg.amount?.toNumber() || 0,
    recurringDonations: recurring,
  };
}

async function collectSystemMetrics() {
  // Get from Redis metrics store
  const [hits, misses, uptime, avgResponse, errors, total] = await Promise.all([
    redis.get('metrics:cache_hits'),
    redis.get('metrics:cache_misses'),
    redis.get('metrics:uptime_seconds'),
    redis.get('metrics:avg_response_time'),
    redis.get('metrics:error_count'),
    redis.get('metrics:request_count'),
  ]);

  const cacheHits = parseInt(hits || '0', 10);
  const cacheMisses = parseInt(misses || '0', 10);
  const totalRequests = parseInt(total || '1', 10);
  const errorCount = parseInt(errors || '0', 10);

  const hitRatio = cacheHits + cacheMisses > 0
    ? cacheHits / (cacheHits + cacheMisses)
    : 0;

  // Update OpenTelemetry gauge
  cacheHitRatio.addCallback((result) => {
    result.observe(hitRatio);
  });

  return {
    uptimePercent: parseFloat(uptime || '99.9'),
    averageResponseTime: parseFloat(avgResponse || '0'),
    errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
    cacheHitRatio: Math.round(hitRatio * 100) / 100,
  };
}

// Metrics API endpoint
// app/api/platform/metrics/route.ts
export async function GET(request: Request) {
  // Platform admin only
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const metrics = await collectPlatformMetrics();
  return NextResponse.json(metrics);
}
```

### 6.4 Alerting Configuration

```yaml
# alertmanager/config.yml
global:
  resolve_timeout: 5m
  slack_api_url: '${SLACK_WEBHOOK_URL}'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#platform-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .Annotations.description }}'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        severity: '{{ .Labels.severity }}'

  - name: 'slack'
    slack_configs:
      - channel: '#platform-alerts'
        send_resolved: true
        title: '{{ if eq .Status "firing" }}🚨{{ else }}✅{{ end }} {{ .GroupLabels.alertname }}'
        text: '{{ .Annotations.description }}'

# Alert rules
# prometheus/rules/platform.yml
groups:
  - name: platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          description: 'Error rate is above 5% for 5 minutes'

      - alert: DatabaseConnectionFailed
        expr: up{job="postgresql"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          description: 'Database connection is down'

      - alert: RedisConnectionFailed
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          description: 'Redis connection is down'

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 500
        for: 10m
        labels:
          severity: warning
        annotations:
          description: 'Memory usage is above 500MB for 10 minutes'

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          description: 'P95 response time is above 1 second'

      - alert: LowDonationSuccessRate
        expr: rate(donations_total{status="failed"}[1h]) / rate(donations_total[1h]) > 0.1
        for: 15m
        labels:
          severity: warning
        annotations:
          description: 'Donation failure rate is above 10%'

      - alert: QueueBacklog
        expr: job_queue_length > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          description: 'Job queue has more than 1000 pending jobs'
```

### 6.2 Logging Configuration

```typescript
// lib/logger.ts
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  formatters: {
    level: (label) => ({ level: label }),
  },

  ...(isProduction
    ? {
        // Production: JSON format for log aggregation
        timestamp: pino.stdTimeFunctions.isoTime,
      }
    : {
        // Development: Pretty print
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
          },
        },
      }),
});

// Request logger middleware
export function requestLogger(request: Request, context: { tenantId?: string }) {
  const start = Date.now();

  return {
    log: (status: number) => {
      logger.info({
        method: request.method,
        url: new URL(request.url).pathname,
        status,
        duration: Date.now() - start,
        tenantId: context.tenantId,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for'),
      });
    },
  };
}

// Error logger
export function logError(error: Error, context?: Record<string, any>) {
  logger.error({
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
    },
    ...context,
  });
}
```

### 6.3 Sentry Integration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null;
    }
    return event;
  },
});
```

---

## 7. Backup & Disaster Recovery

### 7.1 Database Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-church_platform}"
DB_USER="${DB_USER:-dbadmin}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
S3_BUCKET="${S3_BUCKET:-digitalchurch-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Starting backup of $DB_NAME..."

# Create backup with pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --format=plain \
  | gzip > "$BACKUP_FILE"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/database/${TIMESTAMP}/" \
  --storage-class STANDARD_IA

# Clean up old local backups
echo "Cleaning up old local backups..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete

# Clean up old S3 backups
echo "Cleaning up old S3 backups..."
aws s3 ls "s3://${S3_BUCKET}/database/" | while read -r line; do
  BACKUP_DATE=$(echo "$line" | awk '{print $1}')
  BACKUP_AGE=$(($(date +%s) - $(date -d "$BACKUP_DATE" +%s)))
  BACKUP_AGE_DAYS=$((BACKUP_AGE / 86400))

  if [ "$BACKUP_AGE_DAYS" -gt "$RETENTION_DAYS" ]; then
    BACKUP_PREFIX=$(echo "$line" | awk '{print $4}')
    aws s3 rm "s3://${S3_BUCKET}/database/${BACKUP_PREFIX}" --recursive
    echo "Deleted old backup: $BACKUP_PREFIX"
  fi
done

echo "Backup completed successfully!"
```

### 7.2 Restore Procedure

```bash
#!/bin/bash
# scripts/restore-database.sh

set -euo pipefail

BACKUP_FILE="${1:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-church_platform}"
DB_USER="${DB_USER:-dbadmin}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file-or-s3-path>"
  exit 1
fi

# Download from S3 if needed
if [[ "$BACKUP_FILE" == s3://* ]]; then
  LOCAL_FILE="/tmp/restore_$(date +%s).sql.gz"
  echo "Downloading backup from S3..."
  aws s3 cp "$BACKUP_FILE" "$LOCAL_FILE"
  BACKUP_FILE="$LOCAL_FILE"
fi

echo "Restoring database from: $BACKUP_FILE"

# Create new database
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres << EOF
  DROP DATABASE IF EXISTS ${DB_NAME}_restore;
  CREATE DATABASE ${DB_NAME}_restore;
EOF

# Restore backup
gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "${DB_NAME}_restore"

echo "Restore completed to ${DB_NAME}_restore"
echo "To switch to restored database, run:"
echo "  ALTER DATABASE $DB_NAME RENAME TO ${DB_NAME}_old;"
echo "  ALTER DATABASE ${DB_NAME}_restore RENAME TO $DB_NAME;"
```

---

## 8. Security Checklist

### 8.1 Pre-Deployment Security

```yaml
Infrastructure Security:
  - ✅ All traffic encrypted (TLS 1.2+)
  - ✅ Database connections encrypted
  - ✅ Redis connections encrypted
  - ✅ S3 bucket private by default
  - ✅ WAF enabled on CloudFront/ALB
  - ✅ DDoS protection enabled
  - ✅ VPC with private subnets for databases
  - ✅ Security groups properly configured

Application Security:
  - ✅ Environment variables in secrets manager
  - ✅ No secrets in code or logs
  - ✅ CORS properly configured
  - ✅ CSP headers implemented
  - ✅ Rate limiting enabled
  - ✅ Input validation on all endpoints
  - ✅ SQL injection prevention (Prisma)
  - ✅ XSS prevention (React)

Authentication Security:
  - ✅ Strong password policy
  - ✅ Session timeout configured
  - ✅ JWT tokens properly signed
  - ✅ Refresh token rotation
  - ✅ MFA available for admins
  - ✅ Account lockout after failed attempts

Data Security:
  - ✅ PII encrypted at rest
  - ✅ Automated backups enabled
  - ✅ Backup encryption enabled
  - ✅ Data retention policies
  - ✅ GDPR compliance measures
  - ✅ Audit logging enabled
```

---

## 9. Performance Optimization

### 9.1 Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.digitalchurch.com' },
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'image.mux.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
    {
      source: '/fonts/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false };
    }
    return config;
  },
};

module.exports = nextConfig;
```

### 9.2 Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 3600 } = options;
    await redis.setex(key, ttl, JSON.stringify(value));

    // Track tags for invalidation
    if (options.tags) {
      for (const tag of options.tags) {
        await redis.sadd(`tag:${tag}`, key);
      }
    }
  },

  async invalidate(key: string): Promise<void> {
    await redis.del(key);
  },

  async invalidateByTag(tag: string): Promise<void> {
    const keys = await redis.smembers(`tag:${tag}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      await redis.del(`tag:${tag}`);
    }
  },

  // Tenant-specific cache keys
  tenantKey(tenantId: string, key: string): string {
    return `tenant:${tenantId}:${key}`;
  },

  // Template cache
  async getTemplate(tenantId: string) {
    return this.get(`tenant:${tenantId}:template`);
  },

  async setTemplate(tenantId: string, template: any) {
    await this.set(`tenant:${tenantId}:template`, template, {
      ttl: 3600,
      tags: [`tenant:${tenantId}`],
    });
  },
};
```

---

## Summary

This Deployment & Infrastructure document provides:

1. **Multiple Deployment Options**: Vercel, AWS ECS, Docker, and on-premise
2. **Complete CI/CD Pipeline**: GitHub Actions with testing, building, and deployment
3. **Multi-Tenant Domain Configuration**: Wildcard subdomains and custom domains
4. **Infrastructure as Code**: Terraform for AWS resources
5. **Security Best Practices**: TLS, WAF, secrets management, security headers
6. **Monitoring & Observability**: Health checks, logging, Sentry integration
7. **Backup & DR**: Automated backups, retention policies, restore procedures
8. **Performance Optimization**: Caching, CDN, Next.js configuration

The infrastructure is designed to scale from startup to enterprise with minimal changes.

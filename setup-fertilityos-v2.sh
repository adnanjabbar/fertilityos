#!/bin/bash

echo "🚀 Starting FertilityOS v2 Enterprise Setup..."

cd /var/www/ivf-platform

echo "📦 Backing up old system..."
mkdir -p backup_old_system
cp -r * backup_old_system 2>/dev/null

echo "📦 Installing Node if missing..."
if ! command -v node &> /dev/null
then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "📦 Installing global Nest CLI..."
npm install -g @nestjs/cli

echo "📁 Creating new NestJS project..."
nest new fertilityos-v2 --package-manager npm

cd fertilityos-v2

echo "📦 Installing dependencies..."
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt prisma @prisma/client reflect-metadata rxjs
npm install -D ts-node-dev

echo "📦 Initializing Prisma..."
npx prisma init

echo "🧠 Writing Prisma schema..."
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Clinic {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())

  users     User[]
  subscriptions Subscription[]
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role
  clinicId  String
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  createdAt DateTime @default(now())
}

model Subscription {
  id        String   @id @default(uuid())
  plan      String
  active    Boolean  @default(true)
  clinicId  String
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
}

enum Role {
  SUPER_ADMIN
  CLINIC_OWNER
  CLINIC_ADMIN
  DOCTOR
  NURSE
  LAB_TECH
  FINANCE
  RECEPTION
}
EOF

echo "🔐 Creating environment file..."
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fertilityos"
JWT_SECRET="supersecretjwtkey"
EOF

echo "📦 Generating Prisma client..."
npx prisma generate

echo "📦 Running initial migration..."
npx prisma migrate dev --name init --skip-seed

echo "🏗 Creating project modules..."

nest g module prisma
nest g module auth
nest g module clinics
nest g module users
nest g module common

nest g service prisma
nest g service auth
nest g service clinics
nest g service users

nest g controller auth
nest g controller clinics

echo "🧠 Writing Prisma service..."
cat > src/prisma/prisma.service.ts << 'EOF'
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
EOF

echo "🔐 Writing Auth Service..."
cat > src/auth/auth.service.ts << 'EOF'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException();
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, role: user.role, clinicId: user.clinicId };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(email: string, password: string, clinicId: string, role: any) {
    const hashed = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { email, password: hashed, clinicId, role },
    });
  }
}
EOF

echo "🏥 Writing Clinics Service..."
cat > src/clinics/clinics.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClinicsService {
  constructor(private prisma: PrismaService) {}

  create(name: string) {
    return this.prisma.clinic.create({ data: { name } });
  }

  findAll() {
    return this.prisma.clinic.findMany();
  }
}
EOF

echo "⚙️ Building project..."
npm run build

echo "🎉 FertilityOS v2 Setup Completed!"
echo "To run:"
echo "cd /var/www/ivf-platform/fertilityos-v2"
echo "npm run start"
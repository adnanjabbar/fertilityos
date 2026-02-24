#!/bin/bash

echo "🚀 Starting FertilityOS Frontend V2 Setup..."

cd /var/www/ivf-platform

# Fix line endings safety
apt update -y
apt install -y curl dos2unix nginx

# Install Node 20 properly
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node -v
npm -v

# Remove old frontend if exists
rm -rf fertilityos-frontend

# Create Next.js app non-interactive
npx create-next-app@latest fertilityos-frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --use-npm \
  --no-import-alias \
  --no-react-compiler \
  --yes

cd fertilityos-frontend

# Install dependencies
npm install axios jwt-decode

# Create API helper
mkdir -p src/lib
cat > src/lib/api.ts <<EOF
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = "Bearer " + token;
    }
  }
  return config;
});

export default api;
EOF

# Replace Home page with Login
cat > src/app/page.tsx <<EOF
"use client";

import { useState } from "react";
import api from "../lib/api";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const login = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      router.push("/dashboard");
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 shadow rounded w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">FertilityOS</h1>
        <input
          className="w-full border p-2 mb-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full border p-2 mb-4"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={login}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Login
        </button>
      </div>
    </div>
  );
}
EOF

# Create dashboard
mkdir -p src/app/dashboard

cat > src/app/dashboard/page.tsx <<EOF
"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-xl mb-6">FertilityOS</h2>
        <Link href="/dashboard/patients" className="block mb-3">
          Patients
        </Link>
      </div>
      <div className="flex-1 p-8 bg-gray-100">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Welcome to FertilityOS V1</p>
      </div>
    </div>
  );
}
EOF

# Create Patients page
mkdir -p src/app/dashboard/patients

cat > src/app/dashboard/patients/page.tsx <<EOF
"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const fetchPatients = async () => {
    const res = await api.get("/patients");
    setPatients(res.data);
  };

  const addPatient = async () => {
    await api.post("/patients", {
      firstName,
      lastName,
      dateOfBirth: new Date(),
    });
    fetchPatients();
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-xl mb-6">FertilityOS</h2>
      </div>
      <div className="flex-1 p-8 bg-gray-100">
        <h1 className="text-xl font-bold mb-4">Patients</h1>

        <div className="mb-6">
          <input
            className="border p-2 mr-2"
            placeholder="First Name"
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className="border p-2 mr-2"
            placeholder="Last Name"
            onChange={(e) => setLastName(e.target.value)}
          />
          <button
            onClick={addPatient}
            className="bg-blue-600 text-white p-2 rounded"
          >
            Add
          </button>
        </div>

        <ul>
          {patients.map((p: any) => (
            <li key={p.id} className="bg-white p-2 mb-2 shadow">
              {p.firstName} {p.lastName}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
EOF

# Build production
npm run build

# Start on port 3001
pm2 delete fertilityos-frontend || true
PORT=3001 pm2 start npm --name fertilityos-frontend -- start
pm2 save

# Configure NGINX
cat > /etc/nginx/sites-available/ivf-platform <<EOF
server {
    listen 80;
    server_name 137.184.148.3;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/;
    }

    location / {
        proxy_pass http://127.0.0.1:3001;
    }
}
EOF

nginx -t
systemctl restart nginx

echo "✅ FertilityOS Frontend V2 Installed Successfully!"
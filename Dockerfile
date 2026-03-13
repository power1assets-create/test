# ── Stage 1: deps ──────────────────────────────────────────
# ใช้ Node 20 Alpine (เบาที่สุด ~50MB)
FROM node:20-alpine AS deps

WORKDIR /app

# copy เฉพาะ package files ก่อน เพื่อ cache layer นี้ไว้
# (ถ้า code เปลี่ยนแต่ dependencies ไม่เปลี่ยน จะไม่ npm install ใหม่)
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: runtime ───────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# copy node_modules จาก stage deps
COPY --from=deps /app/node_modules ./node_modules

# copy source code ที่เหลือ
COPY . .

# Railway inject PORT ให้เอง ผ่าน environment variable
# ไม่ต้อง EXPOSE ตายตัว แต่ใส่ไว้เพื่อ document
EXPOSE 3000

# รัน server
CMD ["node", "server.js"]

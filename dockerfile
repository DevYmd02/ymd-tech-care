# Step 1: Build stage (ใช้ Node เพื่อแปลงโค้ดเป็นไฟล์ Static)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Production stage (ใช้ Nginx เพื่อเปิดเว็บ)
FROM nginx:stable-alpine
# ก๊อปปี้ไฟล์ที่ build เสร็จแล้วจาก Vite (ปกติอยู่ใน dist) ไปที่ Nginx
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
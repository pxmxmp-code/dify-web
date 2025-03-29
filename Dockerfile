# 构建阶段
FROM node:18-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有源代码
COPY . .

# 复制环境变量文件
COPY .env .env

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:stable-alpine AS production

# 复制构建文件到Nginx目录
COPY --from=build /app/dist /usr/share/nginx/html

# 创建自定义Nginx配置
RUN echo 'server { \
    listen 8888; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ { \
        expires 1d; \
    } \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# 暴露8888端口
EXPOSE 8888

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"] 
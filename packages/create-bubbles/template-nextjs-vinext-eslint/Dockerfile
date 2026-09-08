# 使用 Node.js Alpine 镜像
FROM node:alpine

# 安装 pnpm
RUN npm install --global pnpm

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 并安装依赖
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

ENV PORT=9980
EXPOSE 9980

CMD ["pnpm", "start"]

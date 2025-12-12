# --------------------
# Base image
# --------------------
FROM node:20-slim AS base

WORKDIR /app

# Install OpenSSL required by Prisma's Query Engine on Debian-based images
# This must be done before generating the Prisma Client.
RUN apt-get update && apt-get install -y openssl

# Copy package files first (for caching dependencies)
COPY package*.json ./

# Copy the rest of the code (needed for npm ci, which reads the file system)
COPY . .

# --------------------
# Production stage (The final image)
# --------------------
FROM base AS production
ENV NODE_ENV=production

# Install all dependencies (Prisma needs dev deps like 'prisma' package to run 'generate')
# We temporarily install ALL dependencies, then generate, then clean up.
RUN npm install

# Generate the Prisma client based on the schema
# This step MUST run after all dependencies are installed.
RUN DATABASE_URL="postgresql://dummy_user:dummy_pass@dummy_host:5432/dummy_db" npx prisma generate

# Install ONLY production dependencies to shrink the final image size
# This command removes devDependencies, including the heavy 'prisma' package itself.
# NOTE: The generated client code remains.
RUN npm prune --production

EXPOSE 8080

CMD ["npm", "start"]
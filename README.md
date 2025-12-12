# 🍽️ Insta Mess Backend

A **Node.js + Express + Prisma** backend for managing mess operations and subscriptions.  
Built with best practices for scalability, security, and maintainability.

---

## 🚀 Features
- Express.js API server with modular structure
- Prisma ORM with PostgreSQL
- Secure middleware (Helmet, CORS, Morgan logging)
- Centralized error handling
- Graceful shutdown handling for production
- Database health checks
- Ready-to-use Prisma scripts

---

## ⚙️ Setup

### Steps
```bash
# 1. Clone & Install
git clone https://github.com/ioticsme/insta-mess-backend.git
cd insta-mess-backend
npm install

# 2. Setup Environment
cp .env.sample .env   # Update values inside .env

# 3. Database Setup
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to DB
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed data

# 4. Start Server
npm run dev           # Development (nodemon)
npm start             # Production

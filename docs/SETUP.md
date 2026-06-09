# 🚀 Complete Setup Guide

This guide provides detailed instructions for installing and configuring the Vitesse CRM application.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Database Setup](#database-setup)
- [Starting the Application](#starting-the-application)
- [Verification](#verification)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js (v18 or higher)**
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`
   - npm comes bundled with Node.js
   - Verify npm: `npm --version`

2. **MongoDB**

   Choose one of the following options:

   **Option A: MongoDB Atlas (Cloud - Recommended for beginners)**
   - Free tier available
   - No local installation needed
   - Sign up at: https://www.mongodb.com/cloud/atlas
   - Follow their quick start guide to create a free cluster

   **Option B: Local MongoDB Installation**
   - Download MongoDB Community Server: https://www.mongodb.com/try/download/community
   - Follow installation instructions for your operating system
   - Ensure MongoDB service is running

3. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

---

## Installation Steps

### 1. Clone the Repository

Open your terminal/command prompt and run:

```bash
git clone https://github.com/MikeMikeRx/vitesse-crm.git
cd vitesse-crm
```

You should now be in the `vitesse-crm` directory.

---

## Backend Configuration

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`. The installation may take a few minutes.

### 3. Create Environment Variables File

Create a new file named `.env` in the `backend/` directory.

**For MongoDB Atlas (Cloud):**

```env
PORT=8888
DATABASE=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

**For Local MongoDB:**

```env
PORT=8888
DATABASE=mongodb://localhost:27017/crm
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 4. Configure Environment Variables

#### PORT
- Default: `8888`
- The port number where the backend API server will run
- Change only if port 8888 is already in use

#### DATABASE
- Your MongoDB connection string

**MongoDB Atlas format:**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/crm?retryWrites=true&w=majority
```

Replace:
- `<username>`: Your MongoDB Atlas username
- `<password>`: Your MongoDB Atlas password
- `cluster0.xxxxx.mongodb.net`: Your cluster URL (found in Atlas dashboard)
- `crm`: Your database name (can be any name you choose)

**Local MongoDB format:**
```
mongodb://localhost:27017/crm
```

Where:
- `localhost:27017`: Default MongoDB local address
- `crm`: Your database name

#### JWT_SECRET
- A secret key used to sign authentication tokens
- **Important**: Use a strong, random string
- **Never** commit this to version control
- Generate a secure secret:
  - Or run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 5. Example .env File

```env
PORT=8888
DATABASE=mongodb+srv://myuser:mypassword123@cluster0.abc12.mongodb.net/vitesse-crm?retryWrites=true&w=majority
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## Frontend Configuration

### 1. Navigate to Frontend Directory

Open a **new terminal window/tab** and navigate to the frontend directory:

```bash
cd frontend
```

(If you're in the backend directory, use `cd ../frontend`)

### 2. Install Dependencies

```bash
npm install
```

This will install React, Vite, Ant Design, and all other frontend dependencies.

### 3. Create Environment Variables File

Create a new file named `.env` in the `frontend/` directory.

```env
VITE_API_URL=http://localhost:8888/api
VITE_DEMO_MODE=false
```

### 4. Configure Environment Variables

#### VITE_API_URL
- The URL where your backend API is running
- Default: `http://localhost:8888/api`
- Must match the PORT in your backend `.env` file

#### VITE_DEMO_MODE
- Set to `true` to enable auto-login with a demo account when no session is found
- Default: `false` — use your own credentials

---

## Database Setup

### MongoDB Atlas Setup

If you're using MongoDB Atlas:

1. **Create a Cluster**
   - Log in to MongoDB Atlas
   - Click "Build a Cluster" (free tier is sufficient)
   - Choose a cloud provider and region
   - Click "Create Cluster" (takes 3-5 minutes)

2. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose username and password
   - Save these credentials for your `.env` file

3. **Whitelist IP Address**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address

4. **Get Connection String**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Add this to your backend `.env` file

### Local MongoDB Setup

If you're using local MongoDB:

1. **Start MongoDB Service**

   **Windows:**
   ```bash
   net start MongoDB
   ```

   **macOS (Homebrew):**
   ```bash
   brew services start mongodb-community
   ```

   **Linux:**
   ```bash
   sudo systemctl start mongod
   ```

2. **Verify MongoDB is Running**
   - Open MongoDB Compass (GUI tool) or
   - Use terminal: `mongosh` to open MongoDB shell
   - If connection successful, MongoDB is running

---

## Starting the Application

### 1. Start the Backend Server

In the backend directory terminal:

```bash
npm run dev
```

**Expected output:**
```
[nodemon] starting `node src/server.js`
Server running on port 8888
MongoDB connected successfully
```

If you see these messages, your backend is running correctly!

### 2. Start the Frontend Development Server

In the frontend directory terminal:

```bash
npm run dev
```

**Expected output:**
```
VITE v7.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Open `http://localhost:5173` in your browser.

---

## Verification

### Check if Everything is Working

1. **Backend API**
   - Open browser and go to: `http://localhost:8888/health`
   - You should see a health check response

2. **Frontend Application**
   - Go to: `http://localhost:5173`
   - You should see the login page

3. **Database Connection**
   - Check the backend terminal
   - Look for "MongoDB connected successfully"

### Test the Application

1. **Create First User Account**
   - Click "Sign Up" on the login page
   - Fill in the registration form

2. **Log In**
   - Use your newly created credentials to log in
   - You should be redirected to the dashboard

3. **Explore Features**
   - Navigate through Customers, Quotes, Invoices, and Payments
   - Check the dashboard for analytics

---

## Next Steps

### Development Workflow

**Running the application:**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Access at: `http://localhost:5173`

**Stopping the application:**
- Press `Ctrl + C` in each terminal window

### Building for Production

**Frontend build:**
```bash
cd frontend
npm run build
```
- Production files will be in `frontend/dist/`

**Backend production:**
```bash
cd backend
npm start
```
- Uses Node.js directly (without nodemon)

### Project Structure

```
vitesse-crm/
├── backend/
│   ├── src/
│   │   ├── server.js          # Entry point
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth, validation, RBAC
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # Express route definitions
│   │   ├── services/          # Business logic and aggregation
│   │   └── utils/             # Status helpers, async handler
│   ├── tests/                 # Jest + Supertest integration tests
│   ├── .env                   # Environment variables (create this)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client + one module per resource
│   │   ├── features/          # Domain code (customers, invoices, quotes, payments, dashboard, auth)
│   │   ├── shared/            # Cross-cutting code (components, hooks, types, utils)
│   │   └── routes/            # React Router config
│   ├── .env                   # Environment variables (create this)
│   └── package.json
│
├── docs/                      # Architecture, setup, and author notes
└── README.md
```

### Common Development Tasks

**Install new package (backend):**
```bash
cd backend
npm install package-name
```

**Install new package (frontend):**
```bash
cd frontend
npm install package-name
```

**Run backend tests:**
```bash
cd backend && npm test
```

**Run frontend tests:**
```bash
cd frontend && npm test
```

**Clear frontend cache:**
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

---

## Additional Resources

- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **Express.js Guide**: https://expressjs.com/
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/
- **Ant Design Components**: https://ant.design/components/overview/

---

## Need Help?

If you encounter any issues during setup:

1. Verify all prerequisites are installed correctly
2. Ensure environment variables are configured properly
3. Check that MongoDB is running and accessible
4. Review terminal output for specific error messages

---

**Congratulations! 🎉**

You've successfully set up the Vitesse CRM application. Start managing your customers, quotes, invoices, and payments!

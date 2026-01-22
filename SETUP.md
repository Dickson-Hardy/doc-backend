# Backend Setup Guide

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Neon PostgreSQL account (https://neon.tech)
- MongoDB Atlas account or MongoDB URI
- Paystack account (https://paystack.com)

## Installation Steps

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

This will install:
- NestJS framework
- TypeORM (for PostgreSQL)
- Mongoose (for MongoDB)
- Paystack integration
- AWS Lambda support
- All other dependencies

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Node Environment
NODE_ENV=development

# Neon PostgreSQL (for registrations)
DATABASE_HOST=your-project.neon.tech
DATABASE_PORT=5432
DATABASE_USER=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=cmda_conference

# MongoDB (for existing members)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=cmda_members

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Frontend URL
FRONTEND_URL=http://localhost:5173

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Set Up Neon PostgreSQL

1. Go to https://neon.tech and create an account
2. Create a new project
3. Copy the connection string
4. Extract the following from the connection string:
   - `DATABASE_HOST`: The host part (e.g., `ep-xxx.neon.tech`)
   - `DATABASE_USER`: The username
   - `DATABASE_PASSWORD`: The password
   - `DATABASE_NAME`: The database name

5. The `registrations` table will be auto-created by TypeORM on first run

### 4. Configure MongoDB Connection

1. Get your MongoDB connection URI from:
   - MongoDB Atlas dashboard, OR
   - Your existing MongoDB server

2. The URI format should be:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/
   ```

3. Ensure your MongoDB has a `members` collection with the following structure:
   ```javascript
   {
     _id: ObjectId,
     email: String,
     surname: String,
     firstName: String,
     otherNames: String,
     age: Number,
     sex: String,
     phone: String,
     chapter: String,
     isCmdaMember: Boolean,
     currentLeadershipPost: String,
     previousLeadershipPost: String,
     category: String,
     chapterOfGraduation: String,
     yearsInPractice: String
   }
   ```

### 5. Get Paystack API Keys

1. Go to https://paystack.com and create an account
2. Navigate to Settings > API Keys & Webhooks
3. Copy your:
   - Public Key (starts with `pk_test_` for test mode)
   - Secret Key (starts with `sk_test_` for test mode)

### 6. Start Development Server

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000/api`

### 7. Test the API

#### Test Member Lookup
```bash
curl http://localhost:3000/api/members/lookup?email=test@example.com
```

#### Test Health Check
```bash
curl http://localhost:3000/api/health
```

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongooseError: The `uri` parameter to `openUri()` must be a string"**

Solution: Ensure `MONGODB_URI` is set in your `.env` file

**Error: "Authentication failed"**

Solution: Check your MongoDB username and password in the URI

### PostgreSQL Connection Issues

**Error: "Connection refused"**

Solution: 
- Verify your Neon credentials
- Ensure your IP is whitelisted in Neon dashboard
- Check if `DATABASE_HOST` includes the correct endpoint

**Error: "SSL connection required"**

Solution: This is handled automatically in production mode

### Paystack Issues

**Error: "Invalid API key"**

Solution: 
- Verify you're using the correct key (test vs live)
- Ensure no extra spaces in the `.env` file

## Database Schema Verification

### Check PostgreSQL Tables

The `registrations` table should be auto-created with these columns:
- id, member_mongo_id, email, surname, firstName, otherNames
- age, sex, phone, chapter, isCmdaMember
- currentLeadershipPost, previousLeadershipPost
- category, chapterOfGraduation, yearsInPractice
- spouseSurname, spouseFirstName, spouseOtherNames, spouseEmail
- dateOfArrival, accommodationOption
- hasAbstract, presentationTitle, abstractFileUrl
- baseFee, lateFee, totalAmount
- paymentStatus, paymentReference, paidAt
- createdAt, updatedAt

### Check MongoDB Collection

Verify your `members` collection exists and has data:
```javascript
db.members.findOne()
```

## Development Workflow

1. Make code changes
2. NestJS will auto-reload (watch mode)
3. Test endpoints with curl or Postman
4. Check logs in terminal

## Production Deployment

See `DEPLOYMENT.md` for production deployment instructions.

## Common Commands

```bash
# Start development server
pnpm run start:dev

# Build for production
pnpm run build

# Run tests
pnpm run test

# Lint code
pnpm run lint

# Deploy to AWS Lambda
serverless deploy --stage prod
```

## Support

- NestJS Docs: https://docs.nestjs.com
- TypeORM Docs: https://typeorm.io
- Mongoose Docs: https://mongoosejs.com
- Neon Docs: https://neon.tech/docs
- Paystack Docs: https://paystack.com/docs

## Next Steps

After setup is complete:
1. Test member lookup with real data
2. Test registration creation
3. Test payment flow with Paystack test cards
4. Configure frontend to connect to backend
5. Deploy to production

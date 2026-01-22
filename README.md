# CMDA Conference Registration Backend

Serverless NestJS backend for the CMDA Nigeria Doctors National Conference 2026 registration system.

## Features

- **Dual Database Architecture**:
  - **MongoDB**: Existing member database (read-only)
  - **PostgreSQL (Neon)**: Conference registrations and payments
- **Member Lookup**: Email-based member data retrieval from MongoDB
- **Registration Management**: Complete registration workflow stored in PostgreSQL
- **Paystack Integration**: Secure payment processing
- **Serverless Architecture**: AWS Lambda deployment ready

## Tech Stack

- NestJS 10
- TypeORM (PostgreSQL)
- Mongoose (MongoDB)
- PostgreSQL (Neon)
- MongoDB (Existing member database)
- AWS Lambda (Serverless Framework)
- Paystack Payment Gateway

## Project Structure

```
backend/
├── src/
│   ├── members/              # Member management module
│   │   ├── entities/
│   │   ├── members.controller.ts
│   │   ├── members.service.ts
│   │   └── members.module.ts
│   ├── registrations/        # Registration module
│   │   ├── entities/
│   │   ├── dto/
│   │   ├── registrations.controller.ts
│   │   ├── registrations.service.ts
│   │   └── registrations.module.ts
│   ├── payment/              # Payment processing module
│   │   ├── payment.service.ts
│   │   └── payment.module.ts
│   ├── app.module.ts
│   ├── main.ts              # Local development entry
│   └── lambda.ts            # AWS Lambda handler
├── serverless.yml           # Serverless configuration
├── package.json
└── tsconfig.json
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Paystack account

### Installation

1. Install dependencies:
```bash
cd backend
pnpm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration:
# - Neon PostgreSQL credentials for registrations
# - MongoDB URI for existing member database
# - Paystack API keys
```

3. Database setup:
```bash
# PostgreSQL (Neon) will auto-sync tables in development
# MongoDB connection is read-only for member lookup
```

### Development

Run locally:
```bash
npm run start:dev
```

API will be available at `http://localhost:3000/api`

### Testing with Serverless Offline

```bash
npm install -g serverless
serverless offline
```

## API Endpoints

### Members

#### Lookup Member by Email
```
GET /api/members/lookup?email=user@example.com
```

Response:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "surname": "Doe",
  "firstName": "John",
  "category": "doctor",
  "yearsInPractice": "5-and-above",
  ...
}
```

### Registrations

#### Create Registration
```
POST /api/registrations
Content-Type: application/json

{
  "email": "user@example.com",
  "surname": "Doe",
  "firstName": "John",
  "category": "doctor",
  "yearsInPractice": "5-and-above",
  "dateOfArrival": "2026-07-30",
  "accommodationOption": "on-campus",
  ...
}
```

Response:
```json
{
  "registrationId": "uuid",
  "reference": "CMDA-1234567890-abc123",
  "amount": 50000
}
```

#### Verify Payment
```
GET /api/registrations/verify-payment/:reference
```

Response:
```json
{
  "status": "success",
  "message": "Payment verified successfully",
  "data": {
    "reference": "CMDA-1234567890-abc123",
    "amount": 50000,
    "paidAt": "2026-01-21T10:30:00Z"
  }
}
```

## Database Schema

### MongoDB - Members Collection (Read-Only)
Existing member database accessed via MongoDB URI:
- _id (ObjectId)
- email (unique)
- surname, firstName, otherNames
- age, sex, phone
- chapter
- isCmdaMember, currentLeadershipPost, previousLeadershipPost
- category, chapterOfGraduation, yearsInPractice
- timestamps

### PostgreSQL (Neon) - Registrations Table
New registrations stored in Neon PostgreSQL:
- id (UUID, PK)
- memberMongoId (MongoDB ObjectId as string)
- All member fields (snapshot from MongoDB)
- spouseSurname, spouseFirstName, spouseOtherNames, spouseEmail
- dateOfArrival, accommodationOption
- hasAbstract, presentationTitle, abstractFileUrl
- baseFee, lateFee, totalAmount
- paymentStatus, paymentReference, paidAt
- createdAt, updatedAt

## Deployment

### AWS Lambda Deployment

1. Configure AWS credentials:
```bash
aws configure
```

2. Deploy to AWS:
```bash
serverless deploy --stage prod
```

3. Set environment variables in AWS Lambda console or via serverless.yml

### Environment Variables

Required for production:
- `NODE_ENV`: Environment (development/production)
- `DATABASE_HOST`: Neon PostgreSQL host
- `DATABASE_PORT`: PostgreSQL port (default: 5432)
- `DATABASE_USER`: Neon database username
- `DATABASE_PASSWORD`: Neon database password
- `DATABASE_NAME`: Neon database name
- `MONGODB_URI`: MongoDB connection string for member database
- `MONGODB_DATABASE`: MongoDB database name (default: cmda_members)
- `PAYSTACK_SECRET_KEY`: Paystack secret key
- `PAYSTACK_PUBLIC_KEY`: Paystack public key
- `FRONTEND_URL`: Frontend application URL
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)

## Paystack Integration

The backend integrates with Paystack for payment processing:

1. **Payment Initialization**: Frontend uses Paystack Popup
2. **Payment Verification**: Backend verifies payment via Paystack API
3. **Status Update**: Registration status updated upon successful payment

### Paystack Webhook (Optional)

For production, set up a webhook endpoint to receive payment notifications:

```typescript
@Post('webhook/paystack')
async handlePaystackWebhook(@Body() payload: any, @Headers('x-paystack-signature') signature: string) {
  // Verify webhook signature
  // Update payment status
}
```

## Security Considerations

- All API endpoints use CORS
- Input validation with class-validator
- SQL injection protection via TypeORM
- Environment variables for sensitive data
- HTTPS required in production

## License

Proprietary - CMDA Nigeria

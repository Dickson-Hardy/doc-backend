# MongoDB Inspection & Testing Scripts

This directory contains scripts for inspecting and testing the MongoDB database connection.

## ✅ Integration Status: COMPLETE

The MongoDB database has been successfully inspected and integrated:
- **Database**: `live`
- **Member Collection**: `users` (7,343+ documents)
- **Schema**: Updated to use `users` collection
- **Field Mappings**: Configured and tested
- **Status**: Ready for use

## Scripts

### 1. inspect-mongodb.js
Comprehensive database inspector that shows all collections, documents, and field structures.

**Usage:**
```bash
cd backend/scripts
pnpm install
node inspect-mongodb.js
```

**Output:**
- List of all 37 collections
- Document counts
- Sample documents with field structures
- Collections with email fields

### 2. test-member-lookup.js ⭐ NEW
Quick test script to verify member lookup functionality. Tests the exact transformation logic used by the backend API.

**Usage:**
```bash
cd backend/scripts
node test-member-lookup.js <email>
```

**Examples:**
```bash
# Test with a doctor
node test-member-lookup.js daniel.ezimadu@gmail.com

# Test with a student
node test-member-lookup.js dixis48594@dovinou.com

# Test with global network member
node test-member-lookup.js enitanpeters28@gmail.com
```

**Output:**
```
✅ Member found!

📄 Raw MongoDB Document:
{
  "firstName": "Michael",
  "lastName": "Peter",
  "email": "enitanpeters28@gmail.com",
  "role": "GlobalNetwork",
  "region": "The Americas Region",
  ...
}

📤 Transformed for Frontend:
{
  "surname": "Peter",
  "firstName": "Michael",
  "category": "doctor",
  "chapter": "The Americas Region",
  ...
}
```

## Database Structure

### Key Finding
⚠️ **Important**: Member data is in the `users` collection, NOT `members`
- The `members` collection exists but is **EMPTY**
- All 7,343+ member records are in the `users` collection

### MongoDB Document Structure
```javascript
{
  "_id": ObjectId,
  "firstName": String,
  "middleName": String,
  "lastName": String,
  "email": String,
  "phone": String,
  "gender": "Male" | "Female",
  "role": "Student" | "Doctor" | "GlobalNetwork",
  "region": String,
  "membershipId": String,
  "dateOfBirth": Date,
  "emailVerified": Boolean,
  "subscribed": Boolean,
  
  // Student-specific
  "admissionYear": Number,
  "yearOfStudy": String,
  
  // Doctor-specific
  "licenseNumber": String,
  "specialty": String
}
```

## Field Mappings

The backend automatically transforms MongoDB fields to match frontend expectations:

| MongoDB Field | Frontend Field | Transformation |
|--------------|----------------|----------------|
| `lastName` | `surname` | Direct mapping |
| `firstName` | `firstName` | Direct mapping |
| `middleName` | `otherNames` | Direct mapping |
| `gender` | `sex` | Lowercase: "Male" → "male" |
| `region` | `chapter` | Direct mapping |
| `role` | `category` | Mapped (see below) |
| `dateOfBirth` | `age` | Calculated from date |

## Role to Category Mapping

```
MongoDB Role → Conference Category
- "Student" → "student"
- "Doctor" → "doctor"
- "GlobalNetwork" → "doctor"
```

Users can then select their specific category:
- `student` - Student rate
- `doctor` - Doctor rate (can choose years in practice)
- `doctor-with-spouse` - Doctor with spouse package

## Testing Results

✅ **All tests passing:**
- Student member lookup works
- Doctor member lookup works
- GlobalNetwork member lookup works
- Field transformations correct
- Case-insensitive email search works
- Age calculation from dateOfBirth works
- Gender normalization works

### Sample Test Results

**Student:**
```json
{
  "email": "dixis48594@dovinou.com",
  "surname": "Peter",
  "firstName": "Michael",
  "category": "student",
  "chapter": "Abia State University Teaching Hospital - ABSUTH Chapter"
}
```

**Doctor:**
```json
{
  "email": "daniel.ezimadu@gmail.com",
  "surname": "Ezimadu",
  "firstName": "Daniel Felix",
  "category": "doctor",
  "chapter": "UK/Europe region"
}
```

**Global Network:**
```json
{
  "email": "enitanpeters28@gmail.com",
  "surname": "Peter",
  "firstName": "Michael",
  "category": "doctor",
  "chapter": "The Americas Region"
}
```

## Configuration

### Environment Variables
```env
MONGODB_URI=mongodb+srv://cmdassociationnigeria:hAI6Os9uW2QE2zU8@cluster0.5nfcr.mongodb.net/live?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DATABASE=live
```

### Schema Configuration
File: `backend/src/members/schemas/member.schema.ts`
```typescript
@Schema({ collection: 'users', timestamps: true })
export class Member {
  // Fields match MongoDB structure
}
```

### Service Configuration
File: `backend/src/members/members.service.ts`
- Case-insensitive email search
- Field transformation logic
- Role to category mapping
- Age calculation from dateOfBirth

## Next Steps

1. **Start Backend Server**
   ```bash
   cd backend
   pnpm install
   pnpm run start:dev
   ```

2. **Test API Endpoint**
   ```bash
   curl "http://localhost:3000/api/members/lookup?email=enitanpeters28@gmail.com"
   ```

3. **Test Frontend**
   - Start frontend: `pnpm run dev`
   - Navigate to registration form
   - Enter a member email
   - Verify data auto-populates

## Troubleshooting

### Member Not Found
```bash
# Test with the lookup script first
node test-member-lookup.js <email>

# Check if email exists in database
node inspect-mongodb.js | grep -i <email>
```

### Connection Issues
```bash
# Verify MongoDB connection
node inspect-mongodb.js

# Check environment variables
cat ../. env | grep MONGODB
```

### Field Mapping Issues
- Check `backend/MONGODB_STRUCTURE.md` for detailed field mappings
- Review transformation logic in `backend/src/members/members.service.ts`
- Test with `test-member-lookup.js` to see actual transformations

## Documentation

- `backend/MONGODB_STRUCTURE.md` - Detailed database structure and mappings
- `MONGODB_SETUP_GUIDE.md` - Setup and configuration guide
- `MONGODB_INTEGRATION_COMPLETE.md` - Integration summary and status

## Dependencies

```json
{
  "mongodb": "^6.3.0"
}
```

Installed via: `pnpm install` (already done)

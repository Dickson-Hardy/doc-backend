# MongoDB Database Structure

## Database Information
- **Database Name**: `live`
- **Connection**: MongoDB Atlas
- **Total Collections**: 37
- **Member Collection**: `users` (7,343+ documents)

## Important: Collection Name
⚠️ **The member data is in the `users` collection, NOT `members`**
- The `members` collection exists but is **EMPTY**
- All member data is stored in the `users` collection

## Users Collection Structure

### Key Fields
```javascript
{
  "_id": ObjectId,
  "firstName": String,        // First name
  "middleName": String,       // Middle name (optional)
  "lastName": String,         // Last name (surname)
  "fullName": String,         // Auto-generated full name
  "email": String,            // Unique email address
  "phone": String,            // Phone number
  "gender": String,           // "Male" or "Female"
  "dateOfBirth": Date,        // Date of birth (optional)
  "role": String,             // "Student" | "Doctor" | "GlobalNetwork"
  "region": String,           // Chapter/Region name
  "membershipId": String,     // e.g., "CM100000026"
  "emailVerified": Boolean,
  "subscribed": Boolean,
  "subscriptionExpiry": Date,
  
  // Student-specific fields
  "admissionYear": Number,
  "yearOfStudy": String,      // e.g., "1st Year"
  
  // Doctor-specific fields
  "licenseNumber": String,
  "specialty": String,
  
  // Additional
  "avatarUrl": String,
  "eventsRegistered": Array,
  "createdAt": Date,
  "updatedAt": Date
}
```

## Field Mapping: MongoDB → Frontend

The backend service (`members.service.ts`) transforms MongoDB fields to match the frontend expectations:

| Frontend Field | MongoDB Field | Transformation |
|---------------|---------------|----------------|
| `surname` | `lastName` | Direct mapping |
| `firstName` | `firstName` | Direct mapping |
| `otherNames` | `middleName` | Direct mapping |
| `age` | `dateOfBirth` | Calculated from date of birth |
| `sex` | `gender` | Lowercase: "Male" → "male" |
| `phone` | `phone` | Direct mapping |
| `chapter` | `region` | Direct mapping |
| `isCmdaMember` | - | Always `true` (all users are members) |
| `category` | `role` | Mapped: "Student" → "student", "Doctor"/"GlobalNetwork" → "doctor" |
| `chapterOfGraduation` | `region` | Uses region as chapter of graduation |

## Role to Category Mapping

```typescript
MongoDB Role → Conference Category
- "Student" → "student"
- "Doctor" → "doctor"
- "GlobalNetwork" → "doctor"
```

Users can then select:
- `student` - Student rate
- `doctor` - Doctor rate (can choose years in practice)
- `doctor-with-spouse` - Doctor with spouse package

## Sample User Document

```json
{
  "_id": "667ac47882c9f3eae580918c",
  "firstName": "Michael",
  "middleName": "Ade",
  "lastName": "Peter",
  "email": "enitanpeters28@gmail.com",
  "phone": "+2348036314163",
  "gender": "Male",
  "role": "GlobalNetwork",
  "region": "The Americas Region",
  "membershipId": "CM100000026",
  "emailVerified": false,
  "subscribed": false,
  "licenseNumber": "144444fgy",
  "specialty": "erty6u7i65432"
}
```

## Email Lookup Implementation

The `findByEmail` method in `members.service.ts`:
1. Performs case-insensitive email search using regex
2. Transforms MongoDB document to frontend-expected format
3. Calculates age from `dateOfBirth` if available
4. Maps `role` to `category`
5. Returns data matching the `MemberData` interface

## Testing the Connection

Use the inspection script to verify database access:
```bash
cd backend/scripts
pnpm install
node inspect-mongodb.js
```

This will show:
- All collections in the database
- Sample documents from each collection
- Field structures and types
- Collections with email fields

## Notes

1. **Case-Insensitive Search**: Email lookup uses regex for case-insensitive matching
2. **Default Values**: If `dateOfBirth` is missing, age defaults to 25
3. **All Users Are Members**: Since all users in this database are CMDA members, `isCmdaMember` is always `true`
4. **Metadata**: Additional fields (membershipId, subscriptionExpiry, etc.) are included in `_metadata` for reference

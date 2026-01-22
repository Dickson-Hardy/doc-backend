/**
 * Quick test script to verify member lookup works
 * 
 * Usage: node backend/test-member-lookup.js <email>
 * Example: node backend/test-member-lookup.js enitanpeters28@gmail.com
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://cmdassociationnigeria:hAI6Os9uW2QE2zU8@cluster0.5nfcr.mongodb.net/live?retryWrites=true&w=majority&appName=Cluster0";

async function testMemberLookup(email) {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    const db = client.db('live');
    const usersCollection = db.collection('users');

    // Test case-insensitive email lookup
    console.log(`🔍 Looking up member with email: ${email}\n`);
    
    const member = await usersCollection.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (member) {
      console.log('✅ Member found!\n');
      console.log('📄 Raw MongoDB Document:');
      console.log('═'.repeat(60));
      console.log(JSON.stringify(member, null, 2));
      
      // Calculate age from dateOfBirth
      let age = 25;
      if (member.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(member.dateOfBirth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Show transformed data (as it will be sent to frontend)
      console.log('\n\n📤 Transformed for Frontend:');
      console.log('═'.repeat(60));
      const transformed = {
        email: member.email,
        surname: member.lastName,
        firstName: member.firstName,
        otherNames: member.middleName || '',
        age: age,
        sex: member.gender.toLowerCase(),
        phone: member.phone,
        chapter: member.region,
        isCmdaMember: true,
        currentLeadershipPost: '',
        previousLeadershipPost: '',
        category: member.role === 'Student' ? 'student' : 'doctor',
        chapterOfGraduation: member.region,
        yearsInPractice: undefined,
        _metadata: {
          membershipId: member.membershipId,
          role: member.role,
          emailVerified: member.emailVerified,
          subscribed: member.subscribed,
        }
      };
      console.log(JSON.stringify(transformed, null, 2));

      console.log('\n\n✅ Member lookup successful!');
      console.log('This data will be used to auto-populate the registration form.');
      
    } else {
      console.log('❌ Member not found');
      console.log('\nPossible reasons:');
      console.log('  1. Email does not exist in database');
      console.log('  2. Email is spelled incorrectly');
      console.log('  3. Member has not registered on cmdanigeria.net yet');
      
      // Show some sample emails from database
      console.log('\n📋 Sample emails from database:');
      const samples = await usersCollection.find({}, { projection: { email: 1 } }).limit(5).toArray();
      samples.forEach(s => console.log(`  - ${s.email}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await client.close();
    console.log('\n\n🔌 Connection closed.');
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node test-member-lookup.js <email>');
  console.log('Example: node test-member-lookup.js enitanpeters28@gmail.com');
  process.exit(1);
}

testMemberLookup(email).catch(console.error);

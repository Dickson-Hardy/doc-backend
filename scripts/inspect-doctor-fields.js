/**
 * Detailed Doctor Fields Inspector
 * Looks for fields that might indicate doctor seniority/experience
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://cmdassociationnigeria:hAI6Os9uW2QE2zU8@cluster0.5nfcr.mongodb.net/live?retryWrites=true&w=majority&appName=Cluster0";

async function inspectDoctorFields() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    const db = client.db('live');
    const usersCollection = db.collection('users');

    // Get all unique field names from doctor users
    console.log('📋 Analyzing Doctor user documents...\n');
    console.log('='.repeat(80));
    
    // Find doctors
    const doctors = await usersCollection.find({ 
      role: { $in: ['Doctor', 'GlobalNetwork'] } 
    }).limit(10).toArray();

    console.log(`Found ${doctors.length} doctor samples\n`);

    // Collect all unique fields
    const allFields = new Set();
    doctors.forEach(doc => {
      Object.keys(doc).forEach(key => allFields.add(key));
    });

    console.log('📊 All fields found in doctor documents:');
    console.log('─'.repeat(80));
    Array.from(allFields).sort().forEach(field => {
      console.log(`  - ${field}`);
    });
    console.log('\n');

    // Look for experience/seniority related fields
    console.log('🔍 Looking for experience/seniority indicators...\n');
    console.log('='.repeat(80));

    const experienceFields = Array.from(allFields).filter(field => 
      field.toLowerCase().includes('year') ||
      field.toLowerCase().includes('experience') ||
      field.toLowerCase().includes('practice') ||
      field.toLowerCase().includes('graduation') ||
      field.toLowerCase().includes('license') ||
      field.toLowerCase().includes('category') ||
      field.toLowerCase().includes('rank') ||
      field.toLowerCase().includes('level') ||
      field.toLowerCase().includes('seniority')
    );

    if (experienceFields.length > 0) {
      console.log('✅ Found potential experience-related fields:');
      experienceFields.forEach(field => {
        console.log(`\n  📌 ${field}:`);
        
        // Show sample values
        const samples = doctors
          .filter(doc => doc[field] !== undefined && doc[field] !== null && doc[field] !== '')
          .slice(0, 5);
        
        if (samples.length > 0) {
          samples.forEach((doc, idx) => {
            console.log(`     ${idx + 1}. ${JSON.stringify(doc[field])} (${doc.email})`);
          });
        } else {
          console.log('     (No values found in sample)');
        }
      });
    } else {
      console.log('❌ No obvious experience-related fields found');
    }

    // Show full sample documents
    console.log('\n\n' + '='.repeat(80));
    console.log('📄 Sample Doctor Documents (Full):');
    console.log('='.repeat(80));

    doctors.slice(0, 3).forEach((doc, idx) => {
      console.log(`\n\nDoctor ${idx + 1}:`);
      console.log('─'.repeat(80));
      console.log(JSON.stringify(doc, null, 2));
    });

    // Check for students to compare
    console.log('\n\n' + '='.repeat(80));
    console.log('📄 Sample Student Document (for comparison):');
    console.log('='.repeat(80));
    
    const student = await usersCollection.findOne({ role: 'Student' });
    if (student) {
      console.log(JSON.stringify(student, null, 2));
    } else {
      console.log('No students found');
    }

    // Check if there's a separate collection for experience/categories
    console.log('\n\n' + '='.repeat(80));
    console.log('🔍 Checking for related collections...');
    console.log('='.repeat(80));

    const collections = await db.listCollections().toArray();
    const relevantCollections = collections.filter(col => 
      col.name.toLowerCase().includes('doctor') ||
      col.name.toLowerCase().includes('experience') ||
      col.name.toLowerCase().includes('category') ||
      col.name.toLowerCase().includes('profile') ||
      col.name.toLowerCase().includes('professional')
    );

    if (relevantCollections.length > 0) {
      console.log('\n✅ Found potentially relevant collections:');
      for (const col of relevantCollections) {
        console.log(`\n  📁 ${col.name}`);
        const sampleDoc = await db.collection(col.name).findOne();
        if (sampleDoc) {
          console.log('     Sample document:');
          console.log(JSON.stringify(sampleDoc, null, 2));
        }
      }
    } else {
      console.log('\n❌ No additional relevant collections found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await client.close();
    console.log('\n\n🔌 Connection closed.');
  }
}

inspectDoctorFields().catch(console.error);

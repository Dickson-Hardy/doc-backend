/**
 * MongoDB Database Inspector
 * 
 * This script connects to your MongoDB database and shows:
 * 1. All collections in the database
 * 2. Sample documents from each collection
 * 3. Field structure and types
 * 
 * Run with: node backend/scripts/inspect-mongodb.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://cmdassociationnigeria:hAI6Os9uW2QE2zU8@cluster0.5nfcr.mongodb.net/live?retryWrites=true&w=majority&appName=Cluster0";

async function inspectDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    const db = client.db('live');

    // List all collections
    console.log('📚 Collections in database:');
    console.log('═══════════════════════════════════════\n');
    const collections = await db.listCollections().toArray();
    
    collections.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name}`);
    });
    console.log('\n');

    // Inspect each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Collection: ${collectionName}`);
      console.log('='.repeat(60));

      const coll = db.collection(collectionName);

      // Count documents
      const count = await coll.countDocuments();
      console.log(`\n📊 Total documents: ${count}`);

      if (count > 0) {
        // Get sample document
        console.log('\n📄 Sample document:');
        console.log('─'.repeat(60));
        const sample = await coll.findOne();
        console.log(JSON.stringify(sample, null, 2));

        // Get field structure
        console.log('\n🔍 Field structure:');
        console.log('─'.repeat(60));
        const fields = Object.keys(sample);
        fields.forEach(field => {
          const value = sample[field];
          const type = Array.isArray(value) ? 'Array' : typeof value;
          console.log(`  ${field}: ${type}`);
        });

        // Get a few more samples to see variations
        console.log('\n📝 Additional samples (first 3):');
        console.log('─'.repeat(60));
        const samples = await coll.find().limit(3).toArray();
        samples.forEach((doc, index) => {
          console.log(`\nDocument ${index + 1}:`);
          console.log(JSON.stringify(doc, null, 2));
        });
      } else {
        console.log('\n⚠️  Collection is empty');
      }
    }

    // Look specifically for member-related collections
    console.log('\n\n' + '='.repeat(60));
    console.log('🔍 Looking for member-related data...');
    console.log('='.repeat(60));

    const memberCollections = collections.filter(col => 
      col.name.toLowerCase().includes('member') ||
      col.name.toLowerCase().includes('user') ||
      col.name.toLowerCase().includes('doctor') ||
      col.name.toLowerCase().includes('student')
    );

    if (memberCollections.length > 0) {
      console.log('\n✅ Found potential member collections:');
      memberCollections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    } else {
      console.log('\n⚠️  No obvious member collections found.');
      console.log('   Please check the collections listed above.');
    }

    // Search for documents with email field
    console.log('\n\n' + '='.repeat(60));
    console.log('📧 Searching for collections with email field...');
    console.log('='.repeat(60));

    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const docWithEmail = await coll.findOne({ email: { $exists: true } });
      
      if (docWithEmail) {
        console.log(`\n✅ Found email in: ${collection.name}`);
        console.log('Sample document:');
        console.log(JSON.stringify(docWithEmail, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await client.close();
    console.log('\n\n🔌 Connection closed.');
  }
}

// Run the inspection
inspectDatabase().catch(console.error);

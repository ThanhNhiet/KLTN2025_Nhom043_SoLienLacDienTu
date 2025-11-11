const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { FaqSection } = require('../src/databases/mongodb/schemas/FaqSection');
require('dotenv').config();

async function seedFromJson() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Read JSON file
    const jsonPath = path.resolve(__dirname, '../QA_HocVu.json');
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Clear existing data
    await FaqSection.deleteMany({});
    console.log('🗑️  Cleared existing FAQ data');

    // Transform and insert
    const documents = [];
    for (const block of raw) {
      const section = Object.keys(block)[0];
      const QuestionsAndAnswers = block[section].map(qa => ({
        q: qa.q,
        a: qa.a
      }));
      
      documents.push({
        section,
        QuestionsAndAnswers
      });
    }

    const result = await FaqSection.insertMany(documents);
    console.log(`✅ Seeded ${result.length} sections successfully!`);
    
    result.forEach((doc, idx) => {
      console.log(`  ${idx + 1}. ${doc.section} - ${doc.QuestionsAndAnswers.length} Q&A`);
    });

    await mongoose.connection.close();
    console.log('✅ Done!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seedFromJson();

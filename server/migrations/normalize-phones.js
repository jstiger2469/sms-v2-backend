// One-time fix: rewrite stored mentor/student phones to the canonical 10-digit form.
// Numbers saved as "1XXXXXXXXXX" never matched inbound START replies.
//
//   node server/migrations/normalize-phones.js           # dry run (default)
//   node server/migrations/normalize-phones.js --apply   # write changes
require('dotenv').config();
const mongoose = require('mongoose');
const { normalizePhone } = require('../utils/phone');

const APPLY = process.argv.includes('--apply');

async function fixCollection(name) {
  // Raw collection access so the model setter doesn't mask the stored values
  const col = mongoose.connection.collection(name);
  const docs = await col.find({}, { projection: { phone: 1, firstName: 1, lastName: 1 } }).toArray();
  let changed = 0;
  const invalid = [];

  for (const doc of docs) {
    const fixed = normalizePhone(doc.phone);
    const label = `${name} ${doc._id} (${doc.firstName || ''} ${doc.lastName || ''})`.trim();
    if (!fixed) {
      invalid.push(`${label}: "${doc.phone}"`);
      continue;
    }
    if (fixed === doc.phone) continue;

    changed++;
    console.log(`${APPLY ? 'FIX ' : 'WOULD FIX '}${label}: "${doc.phone}" -> "${fixed}"`);
    if (APPLY) {
      try {
        await col.updateOne({ _id: doc._id }, { $set: { phone: fixed } });
      } catch (err) {
        // Mentor.phone is unique: a duplicate means the same person exists twice
        console.error(`  ! could not update ${label}: ${err.message}`);
      }
    }
  }

  console.log(`\n${name}: ${docs.length} total, ${changed} to normalize, ${invalid.length} invalid`);
  invalid.forEach((line) => console.log(`  INVALID (fix manually) ${line}`));
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log(APPLY ? '*** APPLY MODE ***\n' : '*** DRY RUN (pass --apply to write) ***\n');
  await fixCollection('mentors');
  await fixCollection('students');
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

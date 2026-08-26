const mongoose = require('mongoose');
const XLSX = require('xlsx');
require('dotenv').config({ path: '.env.local' });

const SubscriberSchema = new mongoose.Schema(
  { email: String, language: String },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Subscriber = mongoose.model('Subscriber', SubscriberSchema);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const subs = await Subscriber.find({}).sort({ createdAt: -1 }).lean();

  const rows = subs.map((s, i) => ({
    'Sr No': i + 1,
    'Email': s.email,
    'Language': s.language === 'mr' ? 'Marathi' : 'English',
    'Subscribed At': new Date(s.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  ws['!cols'] = [
    { wch: 6 },   // Sr No
    { wch: 40 },  // Email
    { wch: 10 },  // Language
    { wch: 25 },  // Subscribed At
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Subscribers');

  const outPath = 'C:/Users/tanis/OneDrive/Desktop/subscribers_data.xlsx';
  XLSX.writeFile(wb, outPath);

  console.log(`Done! ${rows.length} subscribers exported to: ${outPath}`);
  await mongoose.disconnect();
})();

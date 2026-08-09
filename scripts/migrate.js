const fs = require('fs');
const postgres = require('postgres');

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const sql = postgres(url, { max: 1 });
(async () => {
  try {
    for (const file of fs.readdirSync('migrations').filter(f => f.endsWith('.sql')).sort()) {
      await sql.file(`migrations/${file}`);
      console.log(`Applied ${file}`);
    }
  } finally { await sql.end(); }
})();

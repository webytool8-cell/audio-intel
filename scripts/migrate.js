#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const schemaPath = path.join(__dirname, '../src/lib/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('Running migrations...');
    await pool.query(sql);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

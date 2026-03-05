import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const res = await pool.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name = 'Message' ORDER BY ordinal_position"
)
console.log('Message table columns:')
console.log(res.rows.map((r: { column_name: string }) => r.column_name).join('\n'))

// Also check Event table for the new registration columns
const res2 = await pool.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name = 'Event' ORDER BY ordinal_position"
)
console.log('\nEvent table columns:')
console.log(res2.rows.map((r: { column_name: string }) => r.column_name).join('\n'))

await pool.end()

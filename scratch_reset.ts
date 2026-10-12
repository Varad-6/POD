import { getDb } from './server/db/database_v3.js';

const db = getDb();
db.pragma('foreign_keys = OFF');
db.prepare('DELETE FROM so_distributions').run();
db.prepare('DELETE FROM staging_checks').run();
db.prepare('DELETE FROM invoice_events').run();
db.prepare('DELETE FROM payment_events').run();
db.prepare('DELETE FROM review_queue').run();
db.prepare('DELETE FROM pod_documents').run();
db.prepare('DELETE FROM weight_logs').run();
db.prepare('DELETE FROM otp_verifications').run();
db.prepare('DELETE FROM bilty_uploads').run();
db.prepare('DELETE FROM supervisor_stamp').run();
db.prepare('DELETE FROM supervisor_checks').run();
db.prepare('DELETE FROM ca_verification').run();
db.prepare('DELETE FROM sap_s4_mirror').run();
db.prepare('DELETE FROM transport_assignments WHERE so_distribution_id IS NOT NULL OR so_id IS NOT NULL').run();
db.prepare("UPDATE sales_orders SET portal_status = 'OPEN'").run();
db.pragma('foreign_keys = ON');

console.log('✓ Reset complete!');
console.log('Sales orders:', db.prepare('SELECT id, sap_so_no, portal_status FROM sales_orders').all());
console.log('Distributions count:', db.prepare('SELECT COUNT(*) as c FROM so_distributions').get());
console.log('Invoices count:', db.prepare('SELECT COUNT(*) as c FROM invoice_events').get());

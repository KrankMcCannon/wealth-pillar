import { X509Certificate } from 'node:crypto';
import { supabaseRootCa } from '../src/server/db/supabase-root-ca';

const warningDays = 180;
const certificate = new X509Certificate(supabaseRootCa);
const expiresAt = new Date(certificate.validTo);
const daysRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000);
const result = {
  subject: certificate.subject,
  fingerprint256: certificate.fingerprint256,
  expiresAt: expiresAt.toISOString(),
  daysRemaining,
};

process.stdout.write(`${JSON.stringify(result)}\n`);
if (daysRemaining < 0) {
  process.stderr.write(
    'Supabase root CA bundle is expired. Review the verified rotation source.\n'
  );
  process.exitCode = 1;
} else if (daysRemaining <= warningDays) {
  process.stderr.write(
    `WARNING: Supabase root CA expires within ${warningDays} days; review the verified rotation source.\n`
  );
}

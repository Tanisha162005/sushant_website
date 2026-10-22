import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
    // Try port 3000 first, then 3001
    for (const port of [3000, 3001]) {
        try {
            const res = await fetch(`http://localhost:${port}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'tanishabadgujar1604@gmail.com' }),
            });
            const data = await res.json();
            console.log(`Port ${port} - Status: ${res.status}`, data);
            return;
        } catch {
            console.log(`Port ${port} - connection refused`);
        }
    }
}
main().catch(console.error);

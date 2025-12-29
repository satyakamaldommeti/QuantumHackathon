import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Try to load .env manually if dotenv is missing
try {
    const envPath = path.resolve(rootDir, '.env');
    console.log('Checking .env at:', envPath);
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                if (!process.env[key]) process.env[key] = value;
            }
        });
        console.log('Loaded .env manually');
    } else {
        console.log('.env not found');
    }
} catch (e) {
    console.log('Error manual load .env', e);
}

console.log('--- OpenAI Connectivity Debug ---');
const key = process.env.OPENAI_API_KEY;
console.log('API Key Present:', !!key);
if (key) console.log('Key prefix:', key.substring(0, 8));

const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${key}`,
        'User-Agent': 'DebugScript/1.0'
    }
};

const req = https.request(options, (res) => {
    console.log('STATUS:', res.statusCode);
    res.on('data', (d) => process.stdout.write(d.toString().substring(0, 100) + '...'));
});

req.on('error', (e) => {
    console.error('CONNECTION_ERROR:', e);
});

req.end();

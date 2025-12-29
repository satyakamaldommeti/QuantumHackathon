
const SERVER = process.env.PROXY_URL || 'http://localhost:3001';

async function run() {
    console.log('Testing connection with current server configuration...');
    try {
        const res = await fetch(`${SERVER}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Hello' }],
                model: 'gpt-4o-mini'
            }),
        });

        if (res.ok) {
            const data = await res.json();
            console.log('Success:', data.reply ? data.reply.substring(0, 50) : 'No reply text');
        } else {
            const text = await res.text();
            console.log('Failed status:', res.status);
            console.log('Response body:', text);
        }
    } catch (err) {
        console.error('Error calling proxy:', err);
    }
}

run();

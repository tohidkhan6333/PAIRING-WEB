import fs from 'fs';

const API_KEYS = [
    "EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL",
    "CNJgmfg9X745hcnMQ7FE-nDxytt6w8xK",
    "c7Jo_q9xvCMAQsj1qihjLJBMBY2Er5--",
    "KpoS0JysNXgUSgCWH2hr__2OG7aJ30S_",
    "furii3L3ijdpwYB-vZ_jej7CxvNjFESk",
    "PS0uqmRdEQ3mSqNWD28lccEmQMz-eu7",
    "9L_JkdEp6u4yAa3Dwi9gnYxvZ2_HrXj-",
    "44649d0b013cfc04c3a7bcadad511ef7",
    "478d52a29c7e952ba116d09bd9625fde",
    "dec737f4cfa5817b78bb5e16e23eda1d",
    "51d707c74e0ad8797b70ae27b3e6f846"
];

function readContent(input) {
    if (Buffer.isBuffer(input)) return input.toString();
    if (typeof input !== 'string') throw new Error('Unsupported input type.');
    if (input.startsWith('data:')) return Buffer.from(input.split(',')[1], 'base64').toString();
    if (input.startsWith('http://') || input.startsWith('https://')) return input;
    if (fs.existsSync(input)) return fs.readFileSync(input, 'utf8');
    return input;
}

async function uploadViaPastebin(content, title, format, privacy, apiKey) {
    const privacyMap = { '0': 0, '1': 1, '2': 2 };

    const body = new URLSearchParams({
        api_dev_key: apiKey,
        api_option: 'paste',
        api_paste_code: content,
        api_paste_name: title,
        api_paste_format: format,
        api_paste_private: String(privacyMap[privacy] ?? 1),
        api_paste_expire_date: 'N',
    });

    const res = await fetch('https://pastebin.com/api/api_post.php', {
        method: 'POST',
        body,
    });

    const text = await res.text();
    if (!text.startsWith('https://')) throw new Error(`Pastebin error: ${text}`);
    return text.trim();
}

async function uploadViaPasteRs(content) {
    const res = await fetch('https://paste.rs/', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: content,
    });

    if (!res.ok) throw new Error(`paste.rs error: ${res.status}`);
    return (await res.text()).trim();
}

async function uploadToPastebin(input, title = 'Untitled', format = 'json', privacy = '1') {
    const content = readContent(input);

    // Try all API keys one by one
    for (const key of API_KEYS) {
        try {
            const pasteUrl = await uploadViaPastebin(content, title, format, privacy, key);

            const pasteId = pasteUrl.replace(/https?:\/\/[^/]+\//, '');
            const customUrl = `puttus-das/PUTTUS-AI_${pasteId}`;

            console.log('✅ Session paste URL:', customUrl);
            return customUrl;
        } catch (err) {
            console.warn(`Pastebin key failed → switching key: ${err.message}`);
        }
    }

    // fallback if all keys fail
    console.log('⚠️ All Pastebin keys failed, using paste.rs fallback');
    const pasteUrl = await uploadViaPasteRs(content);
    return pasteUrl;
}

export default uploadToPastebin;
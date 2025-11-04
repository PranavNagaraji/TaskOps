const Mailjet = require('node-mailjet');

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

async function mailSender({ email, subject, content }) {
  const apiKey = process.env.MJ_API_KEY;
  const apiSecret = process.env.MJ_SECRET_KEY;
  const fromEmail = process.env.MJ_SENDER_EMAIL;
  const fromName = process.env.MJ_SENDER_NAME || 'TaskOps';

  if (!apiKey || !apiSecret || !fromEmail) {
    throw new Error('Mailjet environment variables are not set');
  }

  const client = Mailjet.apiConnect(apiKey, apiSecret);
  const payload = {
    Messages: [
      {
        From: { Email: fromEmail, Name: fromName },
        To: [{ Email: email }],
        Subject: subject,
        TextPart: stripHtml(content),
        HTMLPart: content,
      },
    ],
  };

  const res = await client.post('send', { version: 'v3.1' }).request(payload);
  const body = res.body;
  const status = body?.Messages?.[0]?.Status;
  if (status !== 'success') {
    throw new Error(`Mailjet send failed: ${JSON.stringify(body)}`);
  }
}

module.exports = mailSender;

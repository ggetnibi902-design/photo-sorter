const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY 환경변수가 없음');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'API 키가 서버에 설정되지 않았습니다.' }) };
    }

    const { messages } = JSON.parse(event.body);

    const result = await new Promise((resolve, reject) => {
      const body = JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 800, messages });
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('Anthropic status:', res.statusCode);
          console.log('Anthropic body:', data.slice(0, 500));
          resolve({ status: res.statusCode, body: data });
        });
      });
      req.on('error', (e) => {
        console.error('https 요청 오류:', e.message);
        reject(e);
      });
      req.write(body);
      req.end();
    });

    return { statusCode: result.status, headers, body: result.body };
  } catch(e) {
    console.error('함수 오류:', e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};

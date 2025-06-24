const fs = require('fs').promises;
const path = require('path');

const dataPath = path.join(process.cwd(), 'data', 'historico.json');

async function readHistorico() {
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeHistorico(data) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
}

async function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = async (req, res) => {
  let historico = await readHistorico();

  if (req.method === 'GET') {
    res.status(200).json(historico);
    return;
  }

  if (req.method === 'POST') {
    const body = req.body || (await getBody(req));
    const { isEditing, originalNome, ...entry } = body;

    if (isEditing) {
      historico = historico.map((item) =>
        item.nome === originalNome ? entry : item
      );
    } else {
      historico.push(entry);
    }

    await writeHistorico(historico);
    res.status(200).json({ success: true });
    return;
  }

  if (req.method === 'DELETE') {
    const { nome } = req.query;
    historico = historico.filter((item) => item.nome !== nome);
    await writeHistorico(historico);
    res.status(200).json({ success: true });
    return;
  }

  res.status(405).end('Method Not Allowed');
};

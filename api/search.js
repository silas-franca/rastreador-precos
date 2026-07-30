// Função serverless da Vercel. Roda no servidor, então não sofre bloqueio de CORS.
// Consulta a API pública do Mercado Livre (gratuita, sem necessidade de chave/token).

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const q = (req.query.q || '').toString().trim();
  if (!q) {
    res.status(400).json({ error: 'Parâmetro "q" é obrigatório.' });
    return;
  }

  try {
    const url = 'https://api.mercadolibre.com/sites/MLB/search?q=' + encodeURIComponent(q) + '&limit=8';
    const mlResp = await fetch(url);
    if (!mlResp.ok) {
      throw new Error('Mercado Livre respondeu ' + mlResp.status);
    }
    const data = await mlResp.json();
    const results = (data.results || []).slice(0, 6);

    if (results.length === 0) {
      res.status(200).json({
        produto_identificado: q,
        ofertas: [],
        melhor_preco_avista: null,
        observacoes: 'Nenhum resultado encontrado no Mercado Livre para essa busca. Tente descrever de forma mais simples (menos termos técnicos).'
      });
      return;
    }

    const ofertas = results.map(item => {
      let parcelas = null;
      let precoParcelado = null;
      if (item.installments && item.installments.quantity > 1) {
        parcelas = `${item.installments.quantity}x de R$ ${item.installments.amount.toFixed(2).replace('.', ',')}` +
          (item.installments.rate === 0 ? ' sem juros' : '');
        precoParcelado = item.installments.quantity * item.installments.amount;
      }
      return {
        fonte: 'Mercado Livre' + (item.seller_id ? ` (vendedor ${item.seller_id})` : ''),
        preco_avista: item.price,
        preco_parcelado_total: precoParcelado,
        parcelas: parcelas,
        link: item.permalink,
        cupom: null
      };
    });

    ofertas.sort((a, b) => (a.preco_avista ?? Infinity) - (b.preco_avista ?? Infinity));
    const melhor = ofertas.length ? ofertas[0].preco_avista : null;

    res.status(200).json({
      produto_identificado: results[0].title,
      ofertas: ofertas,
      melhor_preco_avista: melhor,
      observacoes: 'Resultados do Mercado Livre. Cupons ativos não são informados por esta API pública — confira no site na hora da compra.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar Mercado Livre: ' + err.message });
  }
}

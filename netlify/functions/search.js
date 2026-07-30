// Função serverless da Netlify. Roda no servidor, então não sofre bloqueio de CORS.
// Consulta a API pública do Mercado Livre (gratuita, sem necessidade de chave/token).

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const q = ((event.queryStringParameters && event.queryStringParameters.q) || '').toString().trim();
  if (!q) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Parametro "q" e obrigatorio.' }) };
  }

  try {
    const url = 'https://api.mercadolibre.com/sites/MLB/search?q=' + encodeURIComponent(q) + '&limit=8';
    const mlResp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RastreadorDePrecos/1.0)',
        'Accept': 'application/json'
      }
    });
    if (!mlResp.ok) {
      throw new Error('Mercado Livre respondeu ' + mlResp.status);
    }
    const data = await mlResp.json();
    const results = (data.results || []).slice(0, 6);

    if (results.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          produto_identificado: q,
          ofertas: [],
          melhor_preco_avista: null,
          observacoes: 'Nenhum resultado encontrado no Mercado Livre para essa busca. Tente descrever de forma mais simples (menos termos tecnicos).'
        })
      };
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        produto_identificado: results[0].title,
        ofertas: ofertas,
        melhor_preco_avista: melhor,
        observacoes: 'Resultados do Mercado Livre. Cupons ativos nao sao informados por esta API publica - confira no site na hora da compra.'
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro ao consultar Mercado Livre: ' + err.message })
    };
  }
};

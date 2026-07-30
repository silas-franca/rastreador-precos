# Rastreador de Preços (versão Netlify)

App pessoal para acompanhar o preço de produtos até a Black Friday.
Busca automática e gratuita via API pública do Mercado Livre.

## Estrutura
- `index.html` — a página (interface + lógica), guarda o histórico no navegador (localStorage)
- `netlify/functions/search.js` — função que roda no servidor da Netlify e consulta o Mercado Livre
- `netlify.toml` — configuração: diz à Netlify onde estão as funções e redireciona `/api/search` para a função (assim o index.html não precisa mudar nada)

## Como colocar no ar (grátis)

### 1. Subir pro GitHub
Se você já tem o repositório `rastreador-precos` no GitHub, é mais simples apagar os arquivos antigos (`index.html`, pasta `api`) e subir estes três no lugar:
- `index.html`
- `netlify.toml`
- pasta `netlify/functions/search.js` (mantendo essa estrutura de pastas exatamente assim)

**Importante:** ao editar arquivos pelo GitHub, verifique que a tradução automática do navegador está desligada (clique no ícone de tradução na barra de endereço → "Mostrar página original") antes de copiar/colar qualquer código, senão o JavaScript quebra de novo.

### 2. Conectar na Netlify
1. Acesse https://app.netlify.com e entre com sua conta do GitHub
2. Clique em "Add new site" → "Import an existing project"
3. Selecione o repositório `rastreador-precos`
4. Não precisa mexer em nenhuma configuração de build (a Netlify detecta o `netlify.toml` sozinha) — clique em "Deploy"
5. Em ~1 minuto a Netlify te dá uma URL tipo `nome-aleatorio.netlify.app`

### 3. Testar
Abra a URL, cole a descrição de um produto e clique em "Buscar preço agora".

## Limitações conhecidas
- Cobre preços do Mercado Livre (não Amazon/Magalu/Kabum automaticamente)
- Cupons de desconto ativos não aparecem (API pública do ML não informa isso)
- Histórico fica salvo no navegador/dispositivo usado

## Varredura ampla ocasional (multi-loja + cupons)
Peça no chat do Claude: "pesquise o preço de: [descrição do produto]" e cole o JSON retornado na seção "Importar resultado" da página.

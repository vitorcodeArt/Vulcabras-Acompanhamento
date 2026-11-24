*O uso deste software está sujeito aos termos do arquivo [LICENSE](LICENSE).*

# Acompanhamento Webview (app privado da Zendesk Support)

Painel no menu lateral esquerdo (`support.nav_bar`) para acompanhar as webviews enviadas nas conversas: catálogo, troca/devolução e rastreamento. O app só **lê** a API do backend descrita em [docs/api-contract.md](docs/api-contract.md), que manda no formato dos dados.

Telas: Visão geral, Envios (tabela com busca, filtros, "carregar mais", jornada de cada envio), Troca/Devolução e Catálogo (relatório + funil) e exportação CSV.

> Este repositório pode ser público. Nunca coloque segredo, URL privada ou dado real em código, mocks, testes ou commits. Veja [Segurança](#segurança).

## Requisitos

- Node.js 18.12 ou superior e npm
- [Zendesk CLI (`zcli`)](https://github.com/zendesk/zcli) (`zcli apps --help` lista os comandos)
- Uma conta Zendesk com permissão de administrador para instalar o app

## Rodando localmente

```bash
npm install
```

### Modo demonstração (sem backend e sem Zendesk)

```bash
npm run dev
# abra http://localhost:5273/iframe.html?mock=1
```

Os dados são **fictícios**, gerados por [src/api/mock.js](src/api/mock.js) no formato do contrato. Para simular falhas, acrescente `&mock_error=wake`, `401`, `429`, `503` ou `timeout` à URL.

A porta 5273 é fixa (`--strictPort`): se estiver ocupada o Vite avisa em vez de trocar de porta, o que quebraria a URL do manifest de desenvolvimento.

### Dentro da Zendesk, com o servidor do zcli

```bash
npm run dev     # terminal 1
npm start       # terminal 2 (zcli apps:server src, porta 4567)
```

Abra a Zendesk com `?zcli_apps=true` na URL. O zcli pergunta o valor de cada configuração do manifest (não vem de `.env`): `api_host`, `api_secret` e `demo_mode`. Para só ver a interface, responda `https://demo.invalid`, qualquer texto e `true`.

Para testar com o backend real use o pacote compilado, que inclui o `domainWhitelist`:

```bash
# .env.local (ignorado pelo git): só o hostname do backend
echo 'VITE_API_DOMAIN=seu-backend.exemplo.com' > .env.local
npm run build
npm run start:prod
```

## Configurações do app

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `api_host` | texto | sim | Origem https do backend, sem barra no final (ex.: `https://seu-backend.exemplo.com`). O app acrescenta `/api/analytics`. |
| `api_secret` | texto, `secure: true` | sim | Segredo da API (`ANALYTICS_API_SECRET` do backend). Fica guardado pela Zendesk e é aplicado no servidor da Zendesk (`{{setting.api_secret}}`); **nunca chega ao navegador**. |
| `demo_mode` | caixa de seleção | não | Mostra dados fictícios sem consultar o servidor. |

O cliente usa `client.request({ secure: true })` com o cabeçalho `Authorization: Bearer {{setting.api_secret}}`. Por isso o hostname do backend precisa estar no `domainWhitelist` do manifest (veja abaixo).

## Gerar o pacote

```bash
# 1) hostname do backend (só ele, sem https:// nem caminho) em .env.local
echo 'VITE_API_DOMAIN=seu-backend.exemplo.com' > .env.local

# 2) build de produção (gera dist/manifest.json com assets/iframe.html e domainWhitelist)
npm run build

# 3) checagem offline do pacote (manifest, parâmetros, logos, traduções, sem segredo no bundle)
npm run check:dist

# 4) validação e empacotamento oficiais (exigem login: zcli login -i)
zcli apps:validate dist
zcli apps:package dist
```

O `.zip` é gerado dentro da pasta do app (normalmente em `dist/tmp/`; o comando informa o caminho). Sem `VITE_API_DOMAIN` o build avisa e o manifest sai sem `domainWhitelist`: o modo real não funciona (só o demonstração). Para um pacote só de demonstração, use `npm run check:dist -- --demo`.

> `src/manifest.json` aponta para `http://localhost:5273/...` porque serve o desenvolvimento. O manifest que vale para instalar é o gerado em `dist/manifest.json` (`assets/iframe.html`).

## Instalar (upload privado)

1. Gere o pacote (seção anterior).
2. No **Admin Center**, vá em *Apps e integrações* → *Apps* → *Apps do Zendesk Support* e escolha *Enviar app privado* (upload). Os nomes exatos dos menus podem variar conforme a versão da interface da Zendesk.
3. Envie o `.zip`, preencha `api_host` e `api_secret` (e deixe `demo_mode` desmarcado) e clique em **Instalar**.
4. O app aparece como um ícone (gráfico de barras) no menu lateral esquerdo.

### Restrição por função

A tela mostra o nome do cliente (`customer_name`) e as jornadas das conversas. Depois de instalar, restrinja o app às funções que precisam dele (por exemplo analistas e supervisores) nas opções do app instalado, em *Apps do Zendesk Support* → *Gerenciar* → opções do app (restrição por função). Sem restrição, qualquer agente com acesso ao Support vê o app.

## Atualizar uma versão

1. Aumente `version` em [src/manifest.json](src/manifest.json).
2. `npm run build`, `npm run check:dist`, `zcli apps:validate dist`.
3. Atualize o app já instalado:
   ```bash
   zcli apps:update dist
   ```
   `apps:update` atualiza um app privado que já foi criado pelo `zcli apps:create dist` (o zcli guarda o id em `dist/zcli.apps.config.json`, ignorado pelo git). Alternativa: enviar o novo `.zip` pelo Admin Center.
4. As configurações já salvas (`api_host`, `api_secret`) são mantidas.

## Trocar o segredo

O segredo não precisa de novo pacote: ele é só uma configuração do app.

1. Gere um novo valor e atualize `ANALYTICS_API_SECRET` no backend. A partir daí o app responde "Acesso negado" até o passo 2.
2. No Admin Center, abra as configurações do app instalado, cole o novo valor em `api_secret` e salve.
3. Confirme abrindo o app: a Visão geral deve carregar. Depois de salvo, o valor não é exibido de volta.

Nunca cole o segredo em issues, commits, prints ou no `.env`.

## Estrutura

```
docs/api-contract.md     contrato da API (fonte única do formato dos dados)
src/api/                 cliente (client.js), erros, hooks e modo demonstração (mock.js)
src/app/                 telas (routes/), componentes, tema (theme.js)
src/lib/                 datas (fuso America/Sao_Paulo), formatação, clipboard, download
src/translations/        pt.json e en.json (textos fixos da interface e do app na Zendesk)
rollup/, vite.config.js  build: gera dist/manifest.json, traduções e o domainWhitelist
scripts/check-dist.mjs   checagem offline do pacote
spec/                    testes (Vitest + Testing Library)
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento (porta 5273) |
| `npm start` / `npm run start:prod` | `zcli apps:server` com `src` / `dist` |
| `npm run build` | build de produção em `dist/` |
| `npm run check:dist` | checagem offline do pacote |
| `npm test` / `npm run test:run` | testes (modo watch / uma vez) |
| `npm run lint` | ESLint |

## Como o app trata erros da API

| Situação | Comportamento |
|---|---|
| Servidor dormindo (Render gratuito), timeout de 60 s, 502/503/504 sem corpo do contrato | "Acordando o servidor, isso pode levar até 1 minuto", **1 tentativa automática** e botão "Tentar de novo" |
| 401 | "Acesso negado": confira o `api_secret` |
| 429 | "Muitas consultas": aguarde (limite de 60 por minuto) |
| 503 com corpo do contrato | servidor no ar, mas sem segredo configurado; não é repetido |
| 400/404 | mostra o texto curto em português que a API devolve |

## Rótulos

Os rótulos (`label`) vêm da API. O app só traduz o que é fixo da interface. Por enquanto a API não manda rótulo para marca, fluxo, status do clique, situação e última etapa: o app usa os textos fixos de `pt.json`/`en.json` (conforme a seção 4 do contrato) e passa a usar `click_status_label`, `session_status_label` e `last_step_label` automaticamente se o backend os enviar.

## Diagnóstico do erro na jornada

Ao abrir um envio, a tela mostra um cartão **"Diagnóstico do erro"** quando a jornada teve erro, falha de integração ou pediu atendente: o tipo do erro, o retorno da integração (ferramenta, status HTTP, tentativas), o motivo de inelegibilidade do pedido e a mensagem que o cliente viu. Cada evento da linha do tempo também lista seus detalhes (`meta`) com rótulo em português.

- Os textos de erro e de integração são **mascarados duas vezes** (no backend, antes de gravar, e no app, antes de exibir): e-mail, links, números longos (CPF, telefone, pedido) e códigos opacos viram `•••`. Nomes próprios não são reconhecidos, por isso só entram textos do sistema.
- O cartão depende de campos que o backend passou a gravar (`error_shown.meta.detail`, `api_call.meta.upstream_code` e `ineligibility_code`). Jornadas **anteriores** a essa versão mostram só o que já estava gravado (por exemplo, o `ineligibility_code` do evento do servidor).
- As palavras `alreadyHaveActiveExchangeRequest` e `contactSAC` têm tradução fixa nos arquivos de tradução. As demais aparecem como o Troque as envia.

## Segurança

- O segredo só existe como configuração `secure` da Zendesk; o código usa apenas o texto `{{setting.api_secret}}`.
- O app **não** chama a API do webview direto do navegador: toda requisição passa pelo proxy do ZAF.
- Nada é guardado em `localStorage`/`sessionStorage`/cookies. A aba e a jornada abertas ficam no hash da URL.
- Mocks e testes usam só dados fictícios (nomes genéricos, IDs `demo…`, hosts `*.invalid`).
- `.env.local`, `zcli.apps.config.json`, `*.zip` e `dist/` são ignorados pelo git. O hostname do backend só entra no manifest, via `VITE_API_DOMAIN`, nunca no código.
- `npm run check:dist` falha se o bundle tiver um token `Bearer` literal ou um host `onrender.com`.

## Limitações conhecidas

- `zcli apps:validate` e `zcli apps:package` exigem login e não foram executados na construção do projeto; rode-os antes de instalar.
- Não foi possível confirmar dentro da Zendesk: o download do CSV a partir do iframe do app e o comportamento do app com a largura real da área do menu lateral.
- A exportação CSV de Envios leva só período, marca e fluxo (é o que o contrato aceita); não inclui busca nem filtros de clique e situação.
- A proteção contra injeção de fórmula no CSV (apóstrofo antes de `=`, `+`, `-`, `@`) é feita pelo backend.

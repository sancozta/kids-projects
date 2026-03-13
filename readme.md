# Kids Projects

## Visao Geral

Kids Projects e um painel visual para organizar varios projetos em uma unica tela, com foco em velocidade operacional, leitura rapida e acompanhamento diario.

Cada projeto vive em um card proprio com checklist editavel, progresso visivel e persistencia local. O produto foi desenhado para funcionar como um cockpit compacto de execucao, sem desperdiçar area util da tela.

## Proposta de Valor

O painel foi pensado para quem precisa enxergar muitos projetos ao mesmo tempo e transformar ideias em proximos passos claros.

Principais ganhos:

- visao simultanea de ate 8 projetos em uma grade fixa
- criacao e edicao inline de titulos e tarefas
- marcacao rapida de tarefas concluídas
- exportacao estruturada em JSON
- base pronta para futura sincronizacao com backend ou nuvem
- temas visuais para diferentes contextos de uso

## O Produto

O dashboard ocupa a tela inteira e mantem alta densidade de informacao.

Funcionalidades atuais:

- grade fixa `4 x 2`
- cards de projeto com titulo editavel
- tarefas editaveis com conclusao por bolinha dedicada
- criacao inline de novos itens dentro do card
- persistencia local em JSON versionado
- exportacao manual do estado atual
- temas `light`, `dark` e `blue`
- opcao de aumentar a fonte dos titulos dos projetos

## Estrutura dos Dados

O estado do painel e salvo de forma estruturada, o que facilita backup, importacao futura e sincronizacao com servicos externos.

Exemplo:

```json
{
  "version": 1,
  "updatedAt": "2026-03-13T19:42:14.401Z",
  "theme": "dark",
  "projectTitleSize": "normal",
  "projects": [
    {
      "id": "p1",
      "title": "kids-architect",
      "items": [
        {
          "id": "p1-1",
          "text": "melhorar a heuristica de leitura da planta 2d",
          "done": false
        }
      ]
    }
  ]
}
```

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React

## Como Rodar

Instale as dependencias:

```bash
npm install
```

Suba o projeto em desenvolvimento:

```bash
npm run dev -- --port 3002
```

Abra no navegador:

```text
http://localhost:3002
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Organizacao do Codigo

- `app/page.tsx`: tela principal, interacoes e fluxo do dashboard
- `app/dashboard-state.ts`: tipos, estado inicial, parse e persistencia estruturada
- `app/globals.css`: tokens visuais, temas e classes do painel
- `app/layout.tsx`: shell raiz, metadata e fonts
- `AGENTS.md`: contexto de projeto para agentes e IAs

## Posicionamento

Este projeto nao e apenas um checklist em grade. Ele serve como uma base de produto para um painel de projetos que pode evoluir para:

- sincronizacao em nuvem
- colaboracao entre usuarios
- backup e restore automatizado
- filtros e agrupamentos por contexto
- templates de projetos
- integracoes com ferramentas externas

## Cuidados de Repositorio

O repositório esta configurado para nao versionar artefatos locais e sensiveis, como:

- `node_modules`
- `.next`
- `.env`
- logs
- artefatos locais de automacao do Playwright

Se houver futura sincronizacao com backend, segredos e tokens devem continuar fora do repositório e ser gerenciados por variaveis de ambiente ou secret managers.

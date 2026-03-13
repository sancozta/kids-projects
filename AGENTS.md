# AGENTS.md

## Objetivo
- Este projeto e um dashboard fullscreen para organizar projetos em uma grade fixa `4 x 2`.
- Cada card representa um projeto com titulo, contador de progresso e lista to-do editavel.
- A interface deve priorizar alta densidade de informacao, leitura rapida e uso operacional diario.

## Stack
- Next.js 16 com App Router
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React

## Estado atual
- A tela principal esta em `app/page.tsx`.
- O dashboard ocupa `100vh` e `100vw`, sem scroll na pagina inteira.
- O scroll deve existir apenas dentro da lista de cada card.
- Existem tres temas: `light`, `dark` e `blue`.
- Tema e dados dos projetos sao persistidos em `localStorage`.

## Estrutura importante
- `app/page.tsx`: composicao da tela, dados iniciais, logica de tema e tarefas.
- `app/globals.css`: tokens visuais, temas e classes utilitarias principais do dashboard.
- `app/layout.tsx`: fontes, metadata e shell raiz.

## Regras de interface
- Manter a grade `4 colunas x 2 linhas`.
- As duas linhas devem continuar visualmente equilibradas em `50% / 50%`.
- A interface deve ser compacta e pixel perfect.
- Evitar aumentar header, paddings, inputs e tipografia sem necessidade.
- Preservar o uso full screen e o aproveitamento maximo da area util.
- Preferir densidade alta com boa legibilidade em vez de elementos decorativos grandes.

## Regras de implementacao
- Nao introduzir bibliotecas novas sem necessidade clara.
- Antes de mudar a estrutura, preservar a experiencia principal: cards de projetos + checklist + temas.
- Se criar componentes novos, manter nomes objetivos e coesos com o dominio.
- Validar sempre com `npm run lint` e `npm run build`.

## Direcao visual
- Estetica inspirada em dashboard tecnico.
- Contraste alto, linhas finas, ritmo consistente e espacamentos pequenos.
- Animacoes devem ser discretas e nao atrapalhar a densidade da interface.

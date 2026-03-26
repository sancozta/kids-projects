# kids CLI

CLI local do `kids-projects` para operacao, automacao e uso por agentes.

## Objetivo

- expor operacoes recorrentes do projeto por linha de comando
- manter um ponto de entrada simples para humanos e agentes
- reutilizar a melhor parte do `mark-cli`: descoberta automatica, help, autocomplete e convencoes claras

## Uso rapido

```bash
./cli/kids.sh help
npm run cli -- help
```

Para ativar o comando `kids` no zsh com autocomplete:

```bash
source ./cli/install.sh
```

Depois disso:

```bash
kids help
kids state --summary
kids health
kids backup
```

## Convencoes

- comandos vivem em `cli/commands/`
- extensoes suportadas: `.sh`, `.mjs`, `.js`
- `# desc:` ou `// desc:` define a descricao exibida no help
- prefixo `_` cria comandos privados expostos sem o `_`
- prefixo `util_` oculta arquivos de suporte

## Comandos iniciais

- `serve`: inicia o app em modo production local
- `health`: consulta `/api/health`
- `state`: le o estado canonico persistido no SQLite
- `backup`: gera backup compactado do diretorio `data/`
- `install launchd`: instala os agentes `launchd`
- `uninstall launchd`: remove os agentes `launchd`

Observacao operacional:

- antes de executar comandos Node da CLI, o projeto verifica se `better-sqlite3` esta compativel com a versao atual do Node
- se houver mismatch de `NODE_MODULE_VERSION`, a CLI tenta rodar `npm rebuild better-sqlite3` automaticamente
- `kids health` tenta primeiro o HTTP do app; se o servidor nao responder, ele cai para diagnostico local do SQLite e mostra divergencias de porta do `launchd`
- se voce trocar a porta padrao ou a versao do Node usada pelo projeto, reinstale o `launchd` com `kids uninstall launchd` e `kids install launchd`

## Guia para agentes

- prefira `kids state --summary` para leitura rapida do estado
- use `kids health --json` para checks operacionais
- use `kids backup` antes de operacoes mais invasivas no store
- use `kids serve` para subir o app localmente quando precisar validar API/UI

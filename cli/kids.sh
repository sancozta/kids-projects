#!/bin/zsh

CLI_DIR="$(cd "$(dirname "$0")" && pwd)"
COMMANDS_DIR="$CLI_DIR/commands"

list_command_files() {
  find "$COMMANDS_DIR" -maxdepth 1 -type f | sort
}

display_command_name() {
  printf '%s\n' "$1" | tr '_-' '  '
}

canonical_command_name() {
  printf '%s\n' "$1" | tr '-' '_'
}

command_name_variants() {
  local original="$1"
  local canonical
  local dashed

  canonical="$(canonical_command_name "$original")"
  dashed="$(printf '%s\n' "$canonical" | tr '_' '-')"

  printf '%s\n' "$original"

  if [[ "$canonical" != "$original" ]]; then
    printf '%s\n' "$canonical"
  fi

  if [[ "$dashed" != "$original" && "$dashed" != "$canonical" ]]; then
    printf '%s\n' "$dashed"
  fi
}

collect_commands() {
  local file
  local name
  local commands=()

  while IFS= read -r file; do
    name=$(basename "$file")
    name="${name%.*}"
    [[ "$name" == util_* ]] && continue
    [[ "$name" == __* ]] && continue
    [[ "$name" == _* ]] && name="${name#_}"
    commands+=("$(display_command_name "$name")")
  done < <(list_command_files)

  printf '%s\n' "${commands[@]}" | sort -u
}

find_command_file() {
  local command_name="$1"
  local candidate
  local variant

  while IFS= read -r variant; do
    for candidate in \
      "$COMMANDS_DIR/${variant}.sh" \
      "$COMMANDS_DIR/${variant}.mjs" \
      "$COMMANDS_DIR/${variant}.js" \
      "$COMMANDS_DIR/_${variant}.sh" \
      "$COMMANDS_DIR/_${variant}.mjs" \
      "$COMMANDS_DIR/_${variant}.js"
    do
      if [ -f "$candidate" ]; then
        printf '%s\n' "$candidate"
        return 0
      fi
    done
  done < <(command_name_variants "$command_name")

  return 1
}

read_desc() {
  local file="$1"
  local desc

  desc=$(grep -m1 -E '^(#|//) desc:' "$file" 2>/dev/null | sed -E 's@^(#|//) desc:[[:space:]]*@@')
  printf '%s\n' "${desc:-Sem descricao disponivel}"
}

show_help() {
  local file
  local name

  echo "Uso: kids <comando> [args...]"
  echo ""
  printf "  %-24s | %s\n" "Comando" "Descricao"
  printf "  %-24s-+-%s\n" "------------------------" "--------------------------------------------------"

  while IFS= read -r file; do
    name=$(basename "$file")
    name="${name%.*}"
    [[ "$name" == util_* ]] && continue
    [[ "$name" == __* ]] && continue
    [[ "$name" == _* ]] && continue
    printf "  %-24s | %s\n" "$(display_command_name "$name")" "$(read_desc "$file")"
  done < <(list_command_files)

  local has_private=false

  while IFS= read -r file; do
    name=$(basename "$file")
    name="${name%.*}"
    if [[ "$name" == _* ]]; then
      has_private=true
      break
    fi
  done < <(list_command_files)

  if $has_private; then
    echo ""
    printf "  %-24s | %s\n" "Comando Privado" "Descricao"
    printf "  %-24s-+-%s\n" "------------------------" "--------------------------------------------------"

    while IFS= read -r file; do
      name=$(basename "$file")
      name="${name%.*}"
      [[ "$name" == _* ]] || continue
      printf "  %-24s | %s\n" "$(display_command_name "${name#_}")" "$(read_desc "$file")"
    done < <(list_command_files)
  fi
}

resolve_command_name() {
  local first_arg="$1"
  local second_arg="${2:-}"

  if find_command_file "$first_arg" >/dev/null 2>&1; then
    printf '%s\n' "$(canonical_command_name "$first_arg")"
    return 0
  fi

  if [[ -n "$second_arg" ]]; then
    local compound_name="${first_arg}_${second_arg}"

    if find_command_file "$compound_name" >/dev/null 2>&1; then
      printf '%s\n' "$(canonical_command_name "$compound_name")"
      return 0
    fi
  fi

  return 1
}

run_command() {
  local file="$1"
  shift

  case "$file" in
    *.sh)
      exec "$file" "$@"
      ;;
    *.mjs|*.js)
      bash "$CLI_DIR/../scripts/ensure-native-deps.sh"
      exec node "$file" "$@"
      ;;
    *)
      echo "Erro: tipo de comando nao suportado: $file"
      exit 1
      ;;
  esac
}

if [[ "$1" == "--setup-completion" ]]; then
  _KIDS_CLI_DIR="$CLI_DIR"

  kids() {
    "$_KIDS_CLI_DIR/kids.sh" "$@"
  }

  _kids_complete() {
    local commands=()
    local first_level=()
    local second_level=()
    local command_name

    while IFS= read -r command_name; do
      [[ -n "$command_name" ]] && commands+=("$command_name")
    done < <("$_KIDS_CLI_DIR/kids.sh" --list-commands)

    if (( CURRENT == 2 )); then
      local command_words

      for command_name in "${commands[@]}"; do
        command_words=(${=command_name})
        [[ -n "${command_words[1]:-}" ]] && first_level+=("${command_words[1]}")
      done

      compadd -X "Comandos disponiveis:" "${(@u)first_level}"
      return
    fi

    if (( CURRENT == 3 )); then
      local command_words

      for command_name in "${commands[@]}"; do
        command_words=(${=command_name})

        if [[ "${command_words[1]:-}" == "${words[2]:-}" && -n "${command_words[2]:-}" ]]; then
          second_level+=("${command_words[2]}")
        fi
      done

      if (( ${#second_level[@]} > 0 )); then
        compadd -X "Subcomandos disponiveis:" "${(@u)second_level}"
      fi
    fi
  }

  compdef _kids_complete kids
  return 0 2>/dev/null || exit 0
fi

if [[ "$1" == "--list-commands" ]]; then
  collect_commands
  exit 0
fi

if [[ -z "$1" || "$1" == "help" || "$1" == "--help" || "$1" == "-h" ]]; then
  show_help
  exit 0
fi

COMMAND_NAME="$(resolve_command_name "${1:-}" "${2:-}")" || {
  echo "Erro: comando '$1${2:+ $2}' nao encontrado em $COMMANDS_DIR"
  echo "Use 'kids help' para listar os comandos disponiveis."
  exit 1
}

if [[ "$COMMAND_NAME" == "${1:-}_${2:-}" ]]; then
  shift 2
else
  shift
fi

COMMAND_FILE="$(find_command_file "$COMMAND_NAME")"

run_command "$COMMAND_FILE" "$@"

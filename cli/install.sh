#!/bin/zsh

CLI_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_LINE="source $CLI_DIR/kids.sh --setup-completion"
ZSHRC="$HOME/.zshrc"

if [ ! -f "$ZSHRC" ]; then
  touch "$ZSHRC"
fi

if grep -qF "$SOURCE_LINE" "$ZSHRC"; then
  echo "CLI kids ja configurado no .zshrc"
else
  {
    echo ""
    echo "# kids-projects CLI"
    echo "$SOURCE_LINE"
  } >> "$ZSHRC"
  echo "CLI kids adicionada ao .zshrc"
fi

source "$CLI_DIR/kids.sh" --setup-completion
echo "CLI kids ativa nesta sessao. Use 'kids help'."

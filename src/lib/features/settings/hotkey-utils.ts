const modifierOrder = ["ctrl", "alt", "shift", "meta"] as const;

type ModifierToken = (typeof modifierOrder)[number];

const modifierAliases: Record<string, ModifierToken> = {
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  option: "alt",
  shift: "shift",
  meta: "meta",
  super: "meta",
  cmd: "meta",
  command: "meta",
};

const keyAliases: Record<string, string> = {
  esc: "Esc",
  escape: "Esc",
  enter: "Enter",
  return: "Enter",
  tab: "Tab",
  space: "Space",
  backspace: "Backspace",
  delete: "Delete",
  up: "Up",
  arrowup: "Up",
  down: "Down",
  arrowdown: "Down",
  left: "Left",
  arrowleft: "Left",
  right: "Right",
  arrowright: "Right",
  pageup: "PageUp",
  pagedown: "PageDown",
  home: "Home",
  end: "End",
  insert: "Insert",
};

function normalizeModifier(token: string): ModifierToken | null {
  const lowered = token.trim().toLowerCase();
  return modifierAliases[lowered] ?? null;
}

function normalizeMainKey(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) {
    return "";
  }

  const lowered = trimmed.toLowerCase();
  if (keyAliases[lowered]) {
    return keyAliases[lowered];
  }

  if (/^f\d{1,2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  if (trimmed.length === 1) {
    return /^[a-z]$/i.test(trimmed) ? trimmed.toUpperCase() : trimmed;
  }

  return trimmed[0].toUpperCase() + trimmed.slice(1);
}

function normalizeTokenList(tokens: string[]) {
  const modifiers = new Set<ModifierToken>();
  let mainKey = "";

  for (const token of tokens) {
    if (!token) {
      continue;
    }

    const modifier = normalizeModifier(token);
    if (modifier) {
      modifiers.add(modifier);
      continue;
    }

    mainKey = normalizeMainKey(token);
  }

  const orderedModifiers = modifierOrder.filter((modifier) =>
    modifiers.has(modifier),
  );

  return {
    modifiers: orderedModifiers,
    mainKey,
  };
}

function displayModifier(token: ModifierToken): string {
  if (token === "ctrl") {
    return "Ctrl";
  }
  if (token === "alt") {
    return "Alt";
  }
  if (token === "shift") {
    return "Shift";
  }
  return "Meta";
}

function isModifierKey(key: string): boolean {
  return (
    key === "Control" || key === "Alt" || key === "Shift" || key === "Meta"
  );
}

function normalizeEventKey(key: string): string {
  if (key === " ") {
    return "Space";
  }

  if (keyAliases[key.toLowerCase()]) {
    return keyAliases[key.toLowerCase()];
  }

  if (key.length === 1) {
    return /^[a-z]$/i.test(key) ? key.toUpperCase() : key;
  }

  if (/^f\d{1,2}$/i.test(key)) {
    return key.toUpperCase();
  }

  return key[0].toUpperCase() + key.slice(1);
}

export function formatHotkeyFromKeyboardEvent(
  event: KeyboardEvent,
): string | null {
  if (isModifierKey(event.key)) {
    return null;
  }

  const parts: string[] = [];
  if (event.ctrlKey) {
    parts.push("Ctrl");
  }
  if (event.altKey) {
    parts.push("Alt");
  }
  if (event.shiftKey) {
    parts.push("Shift");
  }
  if (event.metaKey) {
    parts.push("Meta");
  }

  const mainKey = normalizeEventKey(event.key);
  if (!mainKey) {
    return null;
  }

  parts.push(mainKey);
  return parts.join("+");
}

export function canonicalizeHotkey(value: string): string {
  const tokens = value
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return "";
  }

  const { modifiers, mainKey } = normalizeTokenList(tokens);
  if (!mainKey) {
    return modifiers.join("+");
  }

  return [...modifiers, mainKey.toLowerCase()].join("+");
}

export function formatHotkeyDisplay(value: string): string {
  const tokens = value
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return "";
  }

  const { modifiers, mainKey } = normalizeTokenList(tokens);
  const parts = modifiers.map(displayModifier);
  if (mainKey) {
    parts.push(mainKey);
  }
  return parts.join("+");
}

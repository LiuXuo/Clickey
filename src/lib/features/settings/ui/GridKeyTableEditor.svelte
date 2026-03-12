<script lang="ts">
  let {
    idPrefix,
    rows,
    cols,
    keys,
    disabled = false,
    onChange,
  } = $props<{
    idPrefix: string;
    rows: number;
    cols: number;
    keys: string[];
    disabled?: boolean;
    onChange: (nextKeys: string[]) => void;
  }>();

  let inputRefs = $state<(HTMLInputElement | null)[]>([]);
  let isComposing = $state(false);

  const safeRows = $derived(Math.max(1, Math.round(rows)));
  const safeCols = $derived(Math.max(1, Math.round(cols)));
  const expected = $derived(safeRows * safeCols);
  const slotValues = $derived(normalizeSlots(keys, expected));

  function normalizeSlotToken(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      return "";
    }
    const [first] = Array.from(trimmed);
    return (first ?? "").toLowerCase();
  }

  function normalizeSlots(source: string[], count: number): string[] {
    const normalized: string[] = [];
    for (let index = 0; index < count; index += 1) {
      normalized.push(normalizeSlotToken(source[index] ?? ""));
    }
    return normalized;
  }

  function emit(values: string[]) {
    onChange(normalizeSlots(values, expected));
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function focusSlot(index: number) {
    if (expected <= 0) {
      return;
    }
    const next = clamp(index, 0, expected - 1);
    requestAnimationFrame(() => {
      inputRefs[next]?.focus();
      inputRefs[next]?.select();
    });
  }

  function handleKeydown(index: number, event: KeyboardEvent) {
    if (disabled || isComposing) {
      return;
    }

    if (event.key === "Tab") {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusSlot(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusSlot(index + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusSlot(index - safeCols);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusSlot(index + safeCols);
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      const nextValues = [...slotValues];
      if (nextValues[index]) {
        nextValues[index] = "";
        emit(nextValues);
        return;
      }
      if (index > 0) {
        nextValues[index - 1] = "";
        emit(nextValues);
        focusSlot(index - 1);
      }
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      const nextValues = [...slotValues];
      nextValues[index] = "";
      emit(nextValues);
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
      return;
    }

    if (/\s/.test(event.key)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const nextValues = [...slotValues];
    nextValues[index] = normalizeSlotToken(event.key);
    emit(nextValues);
    if (index + 1 < expected) {
      focusSlot(index + 1);
    }
  }

  function handleInput(index: number, event: Event) {
    if (disabled || isComposing) {
      return;
    }
    const target = event.currentTarget as HTMLInputElement;
    const nextValues = [...slotValues];
    nextValues[index] = normalizeSlotToken(target.value);
    emit(nextValues);
    if (nextValues[index] && index + 1 < expected) {
      focusSlot(index + 1);
    }
  }

  function parsePastedTokens(text: string): string[] {
    const trimmed = text.trim();
    if (!trimmed) {
      return [];
    }
    const chunks = trimmed.split(/\s+/).filter(Boolean);
    if (chunks.length === 1) {
      return Array.from(chunks[0])
        .map((chunk) => normalizeSlotToken(chunk))
        .filter((token) => token.length > 0);
    }
    return chunks
      .map((chunk) => normalizeSlotToken(chunk))
      .filter((token) => token.length > 0);
  }

  function handlePaste(index: number, event: ClipboardEvent) {
    if (disabled) {
      return;
    }
    event.preventDefault();
    const pasted = event.clipboardData?.getData("text") ?? "";
    const tokens = parsePastedTokens(pasted);
    if (!tokens.length) {
      return;
    }

    const nextValues = [...slotValues];
    let cursor = index;
    for (const token of tokens) {
      if (cursor >= expected) {
        break;
      }
      nextValues[cursor] = token;
      cursor += 1;
    }
    emit(nextValues);
    focusSlot(Math.min(cursor, expected - 1));
  }

  function handleCompositionStart() {
    isComposing = true;
  }

  function handleCompositionEnd(index: number, event: CompositionEvent) {
    isComposing = false;
    const target = event.currentTarget as HTMLInputElement;
    const nextValues = [...slotValues];
    nextValues[index] = normalizeSlotToken(target.value);
    emit(nextValues);
    if (nextValues[index] && index + 1 < expected) {
      focusSlot(index + 1);
    }
  }

  function cellIndex(rowIndex: number, colIndex: number): number {
    return rowIndex * safeCols + colIndex;
  }
</script>

<div class="w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
  <table class="w-full table-fixed border-collapse text-[11px] text-zinc-700">
    <tbody>
      {#each Array.from({ length: safeRows }, (_unused, row) => row) as rowIndex (`row-${rowIndex}`)}
        <tr class="odd:bg-white even:bg-zinc-50">
          {#each Array.from({ length: safeCols }, (_unused, col) => col) as colIndex (`col-${colIndex}`)}
            {@const index = cellIndex(rowIndex, colIndex)}
            <td class="border border-zinc-200 p-1.5">
              <input
                bind:this={inputRefs[index]}
                id={`${idPrefix}-${index}`}
                type="text"
                inputmode="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                maxlength="1"
                class="min-w-0 w-full rounded-md border border-zinc-300 bg-white px-0 py-1.5 text-center font-mono text-sm text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-100"
                value={slotValues[index]}
                onkeydown={(event) => handleKeydown(index, event)}
                oninput={(event) => handleInput(index, event)}
                onpaste={(event) => handlePaste(index, event)}
                oncompositionstart={handleCompositionStart}
                oncompositionend={(event) => handleCompositionEnd(index, event)}
                {disabled}
              />
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

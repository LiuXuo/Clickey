<script lang="ts">
  let {
    idPrefix,
    columnKeys,
    rowKeys,
    disabled = false,
    onColumnKeysChange,
    onRowKeysChange,
  } = $props<{
    idPrefix: string;
    columnKeys: string[];
    rowKeys: string[];
    disabled?: boolean;
    onColumnKeysChange: (nextKeys: string[]) => void;
    onRowKeysChange: (nextKeys: string[]) => void;
  }>();

  let columnRefs = $state<(HTMLInputElement | null)[]>([]);
  let rowRefs = $state<(HTMLInputElement | null)[]>([]);
  let isComposingColumn = $state(false);
  let isComposingRow = $state(false);

  const safeColumnKeys = $derived(normalizeKeys(columnKeys));
  const safeRowKeys = $derived(normalizeKeys(rowKeys));

  function normalizeKey(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      return "";
    }
    const [first] = Array.from(trimmed);
    return (first ?? "").toLowerCase();
  }

  function normalizeKeys(values: string[]): string[] {
    return values.map((value) => normalizeKey(value));
  }

  function displayCell(columnKey: string, rowKey: string): string {
    const col = normalizeKey(columnKey);
    const row = normalizeKey(rowKey);
    if (!col || !row) {
      return "-";
    }
    return `${col}${row}`;
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function focusColumn(index: number) {
    if (safeColumnKeys.length <= 0) {
      return;
    }
    const next = clamp(index, 0, safeColumnKeys.length - 1);
    requestAnimationFrame(() => {
      columnRefs[next]?.focus();
      columnRefs[next]?.select();
    });
  }

  function focusRow(index: number) {
    if (safeRowKeys.length <= 0) {
      return;
    }
    const next = clamp(index, 0, safeRowKeys.length - 1);
    requestAnimationFrame(() => {
      rowRefs[next]?.focus();
      rowRefs[next]?.select();
    });
  }

  function parsePastedTokens(text: string): string[] {
    const trimmed = text.trim();
    if (!trimmed) {
      return [];
    }
    const chunks = trimmed.split(/\s+/).filter(Boolean);
    if (chunks.length === 1) {
      return Array.from(chunks[0])
        .map((chunk) => normalizeKey(chunk))
        .filter((token) => token.length > 0);
    }
    return chunks
      .map((chunk) => normalizeKey(chunk))
      .filter((token) => token.length > 0);
  }

  function handleColumnKeydown(index: number, event: KeyboardEvent) {
    if (disabled || isComposingColumn) {
      return;
    }
    if (event.key === "Tab") {
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusColumn(index - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusColumn(index + 1);
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...safeColumnKeys];
      if (next[index]) {
        next[index] = "";
        onColumnKeysChange(next);
        return;
      }
      if (index > 0) {
        next[index - 1] = "";
        onColumnKeysChange(next);
        focusColumn(index - 1);
      }
      return;
    }
    if (event.key === "Delete") {
      event.preventDefault();
      const next = [...safeColumnKeys];
      next[index] = "";
      onColumnKeysChange(next);
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
    const next = [...safeColumnKeys];
    next[index] = normalizeKey(event.key);
    onColumnKeysChange(next);
    if (index + 1 < next.length) {
      focusColumn(index + 1);
    }
  }

  function handleRowKeydown(index: number, event: KeyboardEvent) {
    if (disabled || isComposingRow) {
      return;
    }
    if (event.key === "Tab") {
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusRow(index - 1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRow(index + 1);
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...safeRowKeys];
      if (next[index]) {
        next[index] = "";
        onRowKeysChange(next);
        return;
      }
      if (index > 0) {
        next[index - 1] = "";
        onRowKeysChange(next);
        focusRow(index - 1);
      }
      return;
    }
    if (event.key === "Delete") {
      event.preventDefault();
      const next = [...safeRowKeys];
      next[index] = "";
      onRowKeysChange(next);
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
    const next = [...safeRowKeys];
    next[index] = normalizeKey(event.key);
    onRowKeysChange(next);
    if (index + 1 < next.length) {
      focusRow(index + 1);
    }
  }

  function handleColumnInput(index: number, event: Event) {
    if (disabled || isComposingColumn) {
      return;
    }
    const target = event.currentTarget as HTMLInputElement;
    const next = [...safeColumnKeys];
    next[index] = normalizeKey(target.value);
    onColumnKeysChange(next);
    if (next[index] && index + 1 < next.length) {
      focusColumn(index + 1);
    }
  }

  function handleRowInput(index: number, event: Event) {
    if (disabled || isComposingRow) {
      return;
    }
    const target = event.currentTarget as HTMLInputElement;
    const next = [...safeRowKeys];
    next[index] = normalizeKey(target.value);
    onRowKeysChange(next);
    if (next[index] && index + 1 < next.length) {
      focusRow(index + 1);
    }
  }

  function handleColumnPaste(index: number, event: ClipboardEvent) {
    if (disabled) {
      return;
    }
    event.preventDefault();
    const pasted = event.clipboardData?.getData("text") ?? "";
    const tokens = parsePastedTokens(pasted);
    if (!tokens.length) {
      return;
    }
    const next = [...safeColumnKeys];
    let cursor = index;
    for (const token of tokens) {
      if (cursor >= next.length) {
        break;
      }
      next[cursor] = token;
      cursor += 1;
    }
    onColumnKeysChange(next);
    focusColumn(Math.min(cursor, next.length - 1));
  }

  function handleRowPaste(index: number, event: ClipboardEvent) {
    if (disabled) {
      return;
    }
    event.preventDefault();
    const pasted = event.clipboardData?.getData("text") ?? "";
    const tokens = parsePastedTokens(pasted);
    if (!tokens.length) {
      return;
    }
    const next = [...safeRowKeys];
    let cursor = index;
    for (const token of tokens) {
      if (cursor >= next.length) {
        break;
      }
      next[cursor] = token;
      cursor += 1;
    }
    onRowKeysChange(next);
    focusRow(Math.min(cursor, next.length - 1));
  }

  function handleColumnCompositionStart() {
    isComposingColumn = true;
  }

  function handleColumnCompositionEnd(index: number, event: CompositionEvent) {
    isComposingColumn = false;
    const target = event.currentTarget as HTMLInputElement;
    const next = [...safeColumnKeys];
    next[index] = normalizeKey(target.value);
    onColumnKeysChange(next);
    if (next[index] && index + 1 < next.length) {
      focusColumn(index + 1);
    }
  }

  function handleRowCompositionStart() {
    isComposingRow = true;
  }

  function handleRowCompositionEnd(index: number, event: CompositionEvent) {
    isComposingRow = false;
    const target = event.currentTarget as HTMLInputElement;
    const next = [...safeRowKeys];
    next[index] = normalizeKey(target.value);
    onRowKeysChange(next);
    if (next[index] && index + 1 < next.length) {
      focusRow(index + 1);
    }
  }
</script>

<div class="w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
  <table class="w-full table-fixed border-collapse text-[11px] text-zinc-700">
    <thead>
      <tr class="bg-zinc-100 text-zinc-500">
        <th class="w-10 border border-zinc-200 bg-zinc-100 px-1 py-1.5">
          #
        </th>
        {#each safeColumnKeys as key, colIndex (`col-${colIndex}`)}
          <th class="border border-zinc-200 p-1.5">
            <input
              bind:this={columnRefs[colIndex]}
              id={`${idPrefix}-col-${colIndex}`}
              type="text"
              inputmode="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              maxlength="1"
              class="min-w-0 w-full rounded-md border border-zinc-300 bg-white px-0 py-1.5 text-center font-mono text-sm text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-100"
              value={key}
              onkeydown={(event) => handleColumnKeydown(colIndex, event)}
              oninput={(event) => handleColumnInput(colIndex, event)}
              onpaste={(event) => handleColumnPaste(colIndex, event)}
              oncompositionstart={handleColumnCompositionStart}
              oncompositionend={(event) =>
                handleColumnCompositionEnd(colIndex, event)}
              {disabled}
            />
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each safeRowKeys as rowKey, rowIndex (`row-${rowIndex}`)}
        <tr class="odd:bg-white even:bg-zinc-50">
          <th class="w-10 border border-zinc-200 bg-inherit p-1.5 text-zinc-500">
            <input
              bind:this={rowRefs[rowIndex]}
              id={`${idPrefix}-row-${rowIndex}`}
              type="text"
              inputmode="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              maxlength="1"
              class="min-w-0 w-full rounded-md border border-zinc-300 bg-white px-0 py-1.5 text-center font-mono text-sm text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-100"
              value={rowKey}
              onkeydown={(event) => handleRowKeydown(rowIndex, event)}
              oninput={(event) => handleRowInput(rowIndex, event)}
              onpaste={(event) => handleRowPaste(rowIndex, event)}
              oncompositionstart={handleRowCompositionStart}
              oncompositionend={(event) => handleRowCompositionEnd(rowIndex, event)}
              {disabled}
            />
          </th>
          {#each safeColumnKeys as columnKey, colIndex (`cell-${rowIndex}-${colIndex}`)}
            <td class="border border-zinc-200 px-1 py-1.5 text-center">
              <span class="font-mono text-zinc-800"
                >{displayCell(columnKey, rowKey)}</span
              >
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

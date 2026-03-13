<script lang="ts">
  import {
    colorNativeInputClass,
    controlButtonSmClass,
    controlInputClass,
  } from "$lib/features/settings/ui/control-classes";

  let { id, label, value, disabled, onChange } = $props<{
    id: string;
    label: string;
    value: string;
    disabled: boolean;
    onChange: (next: string) => void;
  }>();

  let isOpen = $state(false);
  let container: HTMLDivElement | null = null;

  const safeHex = $derived.by(() => {
    if (/^#[0-9a-fA-F]{6}$/.test(value.trim())) {
      return value.trim();
    }
    return "#000000";
  });
  const colorTriggerClass = `${controlInputClass} flex items-center justify-between`;

  function togglePicker() {
    if (disabled) {
      return;
    }
    isOpen = !isOpen;
  }

  function closePicker() {
    isOpen = false;
  }

  function handleWindowPointerDown(event: PointerEvent) {
    if (!isOpen || !container) {
      return;
    }
    if (!container.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  function onHexInput(event: Event) {
    const next = (event.currentTarget as HTMLInputElement).value;
    onChange(next);
  }

  function onColorInput(event: Event) {
    const next = (event.currentTarget as HTMLInputElement).value;
    onChange(next);
  }
</script>

<svelte:window onpointerdown={handleWindowPointerDown} />

<div class="space-y-2" bind:this={container}>
  <label class="text-sm font-medium text-zinc-700" for={id}>{label}</label>
  <div class="relative">
    <button
      {id}
      type="button"
      class={`${colorTriggerClass} hover:border-zinc-400`}
      onclick={togglePicker}
      {disabled}
    >
      <span class="inline-flex items-center gap-2">
        <span
          class="h-4 w-4 rounded border border-zinc-300"
          style={`background:${safeHex};`}
        ></span>
        <span class="font-semibold">{value}</span>
      </span>
      <span class="text-xs text-zinc-500">HEX</span>
    </button>

    {#if isOpen}
      <div
        class="absolute z-30 mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 shadow-lg"
      >
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <input
              type="color"
              class={colorNativeInputClass}
              value={safeHex}
              oninput={onColorInput}
              {disabled}
            />
          </div>
          <div class="flex-1">
            <input
              class={controlInputClass}
              {value}
              oninput={onHexInput}
              {disabled}
            />
          </div>
        </div>
        <div class="mt-3 flex justify-end">
          <button
            type="button"
            class={controlButtonSmClass}
            onclick={closePicker}
          >
            OK
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

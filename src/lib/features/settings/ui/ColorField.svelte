<script lang="ts">
  import type { AppIconName } from "$lib/features/settings/icons";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";
  import {
    colorNativeInputClass,
    controlButtonSmClass,
    controlInputClass,
  } from "$lib/features/settings/ui/control-classes";
  import FieldLabel from "$lib/features/settings/ui/FieldLabel.svelte";

  let { id, icon, label, value, disabled, onChange } = $props<{
    id: string;
    icon?: AppIconName;
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
  <FieldLabel text={label} {icon} forId={id} />
  <div class="relative">
    <button
      {id}
      type="button"
      class={colorTriggerClass}
      onclick={togglePicker}
      {disabled}
    >
      <span class="inline-flex items-center gap-2">
        <span
          class="settings-border h-4 w-4 rounded border"
          style={`background:${safeHex};`}
        ></span>
        <span>{value}</span>
      </span>
      <span class="settings-text-muted text-xs">HEX</span>
    </button>

    {#if isOpen}
      <div class="settings-panel absolute z-30 mt-2 w-full rounded-xl p-3">
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
            class={`${controlButtonSmClass} gap-1.5`}
            onclick={closePicker}
          >
            <AppIcon name="success" size={14} />
            OK
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

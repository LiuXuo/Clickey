<script lang="ts">
  import { t } from "$lib/i18n";
  import {
    formatHotkeyDisplay,
    formatHotkeyFromKeyboardEvent,
  } from "$lib/features/settings/hotkey-utils";

  let {
    id,
    label,
    value,
    disabled,
    isRecording,
    onStartRecording,
    onStopRecording,
    onChange,
    onDisable,
    onResetDefault,
  } = $props<{
    id: string;
    label: string;
    value: string;
    disabled: boolean;
    isRecording: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onChange: (nextValue: string) => void;
    onDisable: () => void;
    onResetDefault: () => void;
  }>();

  const displayValue = $derived(formatHotkeyDisplay(value));

  function beginRecording() {
    if (disabled) {
      return;
    }
    if (isRecording) {
      onStopRecording();
      return;
    }
    onStartRecording();
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (!isRecording) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const recorded = formatHotkeyFromKeyboardEvent(event);
    if (!recorded) {
      return;
    }

    onChange(recorded);
    onStopRecording();
  }

  function disableValue() {
    onDisable();
    onStopRecording();
  }

  function resetDefaultValue() {
    onResetDefault();
    onStopRecording();
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="space-y-2">
  <label class="text-sm font-medium text-zinc-700" for={id}>{label}</label>
  <button
    {id}
    type="button"
    class={`w-full rounded-lg border bg-white px-3 py-2 text-left text-sm shadow-sm transition disabled:cursor-not-allowed disabled:bg-zinc-100 ${
      isRecording
        ? "border-zinc-900 text-zinc-900"
        : "border-zinc-300 text-zinc-900 hover:border-zinc-400"
    }`}
    onclick={beginRecording}
    {disabled}
  >
    {#if isRecording}
      <span class="font-semibold text-zinc-900">{$t("hotkeys.recording")}</span>
    {:else if displayValue}
      <span class="font-semibold text-zinc-900">{displayValue}</span>
    {:else}
      <span class="text-zinc-500">{$t("hotkeys.recorderPlaceholder")}</span>
    {/if}
  </button>
  {#if isRecording}
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
        onclick={onStopRecording}
      >
        {$t("hotkeys.recorderCancel")}
      </button>
      <button
        type="button"
        class="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
        onclick={disableValue}
      >
        {$t("hotkeys.recorderClear")}
      </button>
      <button
        type="button"
        class="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
        onclick={resetDefaultValue}
      >
        {$t("hotkeys.recorderDefault")}
      </button>
    </div>
  {/if}
</div>

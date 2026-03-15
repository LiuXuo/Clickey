<script lang="ts">
  import type { AppIconName } from "$lib/features/settings/icons";
  import { t } from "$lib/i18n";
  import {
    formatHotkeyDisplay,
    formatHotkeyFromKeyboardEvent,
  } from "$lib/features/settings/hotkey-utils";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";
  import {
    controlButtonSmClass,
    controlInputClass,
  } from "$lib/features/settings/ui/control-classes";
  import FieldLabel from "$lib/features/settings/ui/FieldLabel.svelte";

  let {
    id,
    icon,
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
    icon?: AppIconName;
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
  const spacedDisplayValue = $derived(displayValue.replaceAll("+", " + "));
  const recorderButtonClass = `${controlInputClass} text-left`;

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
  <FieldLabel {icon} text={label} forId={id} />
  <button
    {id}
    type="button"
    class={recorderButtonClass}
    data-recording={isRecording}
    onclick={beginRecording}
    {disabled}
  >
    <span class="inline-flex items-center gap-2">
      {#if isRecording}
        <span class="settings-text-primary">{$t("hotkeys.recording")}</span>
      {:else if displayValue}
        <span class="settings-text-primary">{spacedDisplayValue}</span>
      {:else}
        <span class="settings-text-muted"
          >{$t("hotkeys.recorderPlaceholder")}</span
        >
      {/if}
    </span>
  </button>
  {#if isRecording}
    <div class="flex items-center gap-2">
      <button
        type="button"
        class={`${controlButtonSmClass} gap-1.5`}
        onclick={onStopRecording}
      >
        <AppIcon name="cancel" size={14} />
        {$t("hotkeys.recorderCancel")}
      </button>
      <button
        type="button"
        class={`${controlButtonSmClass} gap-1.5`}
        onclick={disableValue}
      >
        <AppIcon name="clear" size={14} />
        {$t("hotkeys.recorderClear")}
      </button>
      <button
        type="button"
        class={`${controlButtonSmClass} gap-1.5`}
        onclick={resetDefaultValue}
      >
        <AppIcon name="default" size={14} />
        {$t("hotkeys.recorderDefault")}
      </button>
    </div>
  {/if}
</div>

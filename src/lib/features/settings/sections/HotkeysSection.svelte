<script lang="ts">
  import { t } from "$lib/i18n";
  import type { AppConfig } from "$lib/core";
  import { getDefaultConfig } from "$lib/shared/default-config";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";
  import HotkeyRecorder from "$lib/features/settings/ui/HotkeyRecorder.svelte";
  import { formatHotkeyDisplay } from "$lib/features/settings/hotkey-utils";

  type RecorderKey =
    | "trigger"
    | "switchAction"
    | "cancel"
    | "undo"
    | "directClick"
    | "nextMonitor";

  let { config, isLoading, onConfigMutated } = $props<{
    config: AppConfig;
    isLoading: boolean;
    onConfigMutated: () => void;
  }>();

  let activeRecorder = $state<RecorderKey | null>(null);

  function setRecorder(key: RecorderKey) {
    if (isLoading) {
      return;
    }
    activeRecorder = key;
  }

  function stopRecording() {
    activeRecorder = null;
  }

  function applyHotkey(key: RecorderKey, nextValue: string) {
    const normalized = formatHotkeyDisplay(nextValue);

    if (key === "trigger") {
      config.hotkeys.activation.trigger = normalized;
    } else if (key === "switchAction") {
      config.hotkeys.controls.switchAction = normalized;
    } else if (key === "cancel") {
      config.hotkeys.controls.cancel = normalized;
    } else if (key === "undo") {
      config.hotkeys.controls.undo = normalized;
    } else if (key === "directClick") {
      config.hotkeys.controls.directClick = normalized;
    } else {
      config.hotkeys.controls.nextMonitor = normalized;
    }

    onConfigMutated();
  }

  function getDefaultHotkey(key: RecorderKey): string {
    const defaultConfig = getDefaultConfig();

    if (key === "trigger") {
      return defaultConfig.hotkeys.activation.trigger;
    }
    if (key === "switchAction") {
      return defaultConfig.hotkeys.controls.switchAction;
    }
    if (key === "cancel") {
      return defaultConfig.hotkeys.controls.cancel;
    }
    if (key === "undo") {
      return defaultConfig.hotkeys.controls.undo;
    }
    if (key === "directClick") {
      return defaultConfig.hotkeys.controls.directClick;
    }
    return defaultConfig.hotkeys.controls.nextMonitor;
  }

  $effect(() => {
    if (isLoading && activeRecorder !== null) {
      activeRecorder = null;
    }
  });
</script>

<SettingsCard id="hotkeys">
  <SectionHeader title={$t("hotkeys.title")} icon="hotkeys" />

  <div class="mt-6 grid gap-4 md:grid-cols-2">
    <HotkeyRecorder
      id="hotkey-trigger"
      label={$t("hotkeys.trigger")}
      value={config.hotkeys.activation.trigger}
      disabled={isLoading}
      isRecording={activeRecorder === "trigger"}
      onStartRecording={() => setRecorder("trigger")}
      onStopRecording={stopRecording}
      onChange={(next) => applyHotkey("trigger", next)}
      onDisable={() => applyHotkey("trigger", "")}
      onResetDefault={() =>
        applyHotkey("trigger", getDefaultHotkey("trigger"))}
    />

    <HotkeyRecorder
      id="hotkey-switch-action"
      label={$t("hotkeys.switchAction")}
      value={config.hotkeys.controls.switchAction}
      disabled={isLoading}
      isRecording={activeRecorder === "switchAction"}
      onStartRecording={() => setRecorder("switchAction")}
      onStopRecording={stopRecording}
      onChange={(next) => applyHotkey("switchAction", next)}
      onDisable={() => applyHotkey("switchAction", "")}
      onResetDefault={() =>
        applyHotkey("switchAction", getDefaultHotkey("switchAction"))}
    />

    <HotkeyRecorder
      id="hotkey-cancel"
      label={$t("hotkeys.cancel")}
      value={config.hotkeys.controls.cancel}
      disabled={isLoading}
      isRecording={activeRecorder === "cancel"}
      onStartRecording={() => setRecorder("cancel")}
      onStopRecording={stopRecording}
      onChange={(next) => applyHotkey("cancel", next)}
      onDisable={() => applyHotkey("cancel", "")}
      onResetDefault={() => applyHotkey("cancel", getDefaultHotkey("cancel"))}
    />

    <HotkeyRecorder
      id="hotkey-undo"
      label={$t("hotkeys.undo")}
      value={config.hotkeys.controls.undo}
      disabled={isLoading}
      isRecording={activeRecorder === "undo"}
      onStartRecording={() => setRecorder("undo")}
      onStopRecording={stopRecording}
      onChange={(next) => applyHotkey("undo", next)}
      onDisable={() => applyHotkey("undo", "")}
      onResetDefault={() => applyHotkey("undo", getDefaultHotkey("undo"))}
    />

    <HotkeyRecorder
      id="hotkey-direct"
      label={$t("hotkeys.directClick")}
      value={config.hotkeys.controls.directClick}
      disabled={isLoading}
      isRecording={activeRecorder === "directClick"}
      onStartRecording={() => setRecorder("directClick")}
      onStopRecording={stopRecording}
      onChange={(next) => applyHotkey("directClick", next)}
      onDisable={() => applyHotkey("directClick", "")}
      onResetDefault={() =>
        applyHotkey("directClick", getDefaultHotkey("directClick"))}
    />

    <HotkeyRecorder
      id="hotkey-next-monitor"
      label={$t("hotkeys.nextMonitor")}
      value={config.hotkeys.controls.nextMonitor}
      disabled={isLoading}
      isRecording={activeRecorder === "nextMonitor"}
      onStartRecording={() => setRecorder("nextMonitor")}
      onStopRecording={stopRecording}
      onChange={(next) => applyHotkey("nextMonitor", next)}
      onDisable={() => applyHotkey("nextMonitor", "")}
      onResetDefault={() =>
        applyHotkey("nextMonitor", getDefaultHotkey("nextMonitor"))}
    />
  </div>
</SettingsCard>

<script lang="ts">
  import { t } from "$lib/i18n";
  import type { AppConfig } from "$lib/core";
  import { getDefaultConfig } from "$lib/shared/default-config";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";
  import HotkeyRecorder from "$lib/features/settings/ui/HotkeyRecorder.svelte";
  import { controlInputSpaceWrapClass } from "$lib/features/settings/ui/control-classes";
  import { formatHotkeyDisplay } from "$lib/features/settings/hotkey-utils";

  type RecorderKey =
    | "trigger"
    | "switchAction"
    | "cancel"
    | "undo"
    | "directClick"
    | "nextMonitor"
    | "nudgeLeft"
    | "nudgeRight"
    | "nudgeUp"
    | "nudgeDown";

  let { config, isLoading, fieldClass, onConfigMutated, onUpdateNudgeStep } =
    $props<{
    config: AppConfig;
    isLoading: boolean;
    fieldClass: string;
    onConfigMutated: () => void;
    onUpdateNudgeStep: (event: Event) => void;
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
    } else if (key === "nudgeLeft") {
      config.hotkeys.controls.nudgeLeft = normalized;
    } else if (key === "nudgeRight") {
      config.hotkeys.controls.nudgeRight = normalized;
    } else if (key === "nudgeUp") {
      config.hotkeys.controls.nudgeUp = normalized;
    } else if (key === "nudgeDown") {
      config.hotkeys.controls.nudgeDown = normalized;
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
    if (key === "nudgeLeft") {
      return defaultConfig.hotkeys.controls.nudgeLeft;
    }
    if (key === "nudgeRight") {
      return defaultConfig.hotkeys.controls.nudgeRight;
    }
    if (key === "nudgeUp") {
      return defaultConfig.hotkeys.controls.nudgeUp;
    }
    if (key === "nudgeDown") {
      return defaultConfig.hotkeys.controls.nudgeDown;
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

  <div class={`mt-6 gap-4 ${controlInputSpaceWrapClass}`}>
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
      onResetDefault={() => applyHotkey("trigger", getDefaultHotkey("trigger"))}
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

    <HotkeyRecorder
      id="hotkey-nudge-left"
      label={$t("hotkeys.nudgeLeft")}
      value={config.hotkeys.controls.nudgeLeft}
      disabled={isLoading}
      isRecording={activeRecorder === "nudgeLeft"}
      onStartRecording={() => setRecorder("nudgeLeft")}
      onStopRecording={stopRecording}
      onChange={(next) => applyHotkey("nudgeLeft", next)}
      onDisable={() => applyHotkey("nudgeLeft", "")}
      onResetDefault={() =>
        applyHotkey("nudgeLeft", getDefaultHotkey("nudgeLeft"))}
    />

    <HotkeyRecorder
      id="hotkey-nudge-right"
      label={$t("hotkeys.nudgeRight")}
      value={config.hotkeys.controls.nudgeRight}
      disabled={isLoading}
      isRecording={activeRecorder === "nudgeRight"}
      onStartRecording={() => setRecorder("nudgeRight")}
      onStopRecording={stopRecording}
      onChange={(next) => applyHotkey("nudgeRight", next)}
      onDisable={() => applyHotkey("nudgeRight", "")}
      onResetDefault={() =>
        applyHotkey("nudgeRight", getDefaultHotkey("nudgeRight"))}
    />

    <HotkeyRecorder
      id="hotkey-nudge-up"
      label={$t("hotkeys.nudgeUp")}
      value={config.hotkeys.controls.nudgeUp}
      disabled={isLoading}
      isRecording={activeRecorder === "nudgeUp"}
      onStartRecording={() => setRecorder("nudgeUp")}
      onStopRecording={stopRecording}
      onChange={(next) => applyHotkey("nudgeUp", next)}
      onDisable={() => applyHotkey("nudgeUp", "")}
      onResetDefault={() => applyHotkey("nudgeUp", getDefaultHotkey("nudgeUp"))}
    />

    <HotkeyRecorder
      id="hotkey-nudge-down"
      label={$t("hotkeys.nudgeDown")}
      value={config.hotkeys.controls.nudgeDown}
      disabled={isLoading}
      isRecording={activeRecorder === "nudgeDown"}
      onStartRecording={() => setRecorder("nudgeDown")}
      onStopRecording={stopRecording}
      onChange={(next) => applyHotkey("nudgeDown", next)}
      onDisable={() => applyHotkey("nudgeDown", "")}
      onResetDefault={() =>
        applyHotkey("nudgeDown", getDefaultHotkey("nudgeDown"))}
    />

    <div>
      <label class="text-sm font-medium text-zinc-700" for="nudge-step"
        >{$t("nudge.step")}</label
      >
      <input
        id="nudge-step"
        type="number"
        min="1"
        class={fieldClass}
        value={config.nudge.stepPx}
        oninput={onUpdateNudgeStep}
        disabled={isLoading}
      />
    </div>
  </div>
</SettingsCard>

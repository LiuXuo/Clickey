<script lang="ts">
  import type { SettingsThemePreference } from "$lib/core";
  import { t, type LocalePreference } from "$lib/i18n";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";
  import ActionBar from "$lib/features/settings/ui/ActionBar.svelte";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";
  import { controlInputSpaceWrapClass } from "$lib/features/settings/ui/control-classes";
  import FieldLabel from "$lib/features/settings/ui/FieldLabel.svelte";

  let {
    localeValue,
    themeValue,
    openOnLaunchValue,
    isLoading,
    compactSelectClass,
    isImporting,
    isExporting,
    isOpeningConfigDir,
    isResetting,
    isApplying,
    canReset,
    onImport,
    onExport,
    onOpenConfigDir,
    onReset,
    onLocaleChange,
    onThemeChange,
    onOpenOnLaunchChange,
  } = $props<{
    localeValue: LocalePreference;
    themeValue: SettingsThemePreference;
    openOnLaunchValue: boolean;
    isLoading: boolean;
    compactSelectClass: string;
    isImporting: boolean;
    isExporting: boolean;
    isOpeningConfigDir: boolean;
    isResetting: boolean;
    isApplying: boolean;
    canReset: boolean;
    onImport: () => void;
    onExport: () => void;
    onOpenConfigDir: () => void;
    onReset: () => void;
    onLocaleChange: (next: LocalePreference) => void;
    onThemeChange: (next: SettingsThemePreference) => void;
    onOpenOnLaunchChange: (next: boolean) => void;
  }>();

  function handleLocaleChange(event: Event) {
    const target = event.currentTarget as HTMLSelectElement;
    const next = target.value as LocalePreference;
    onLocaleChange(next);
  }

  function handleThemeChange(event: Event) {
    const target = event.currentTarget as HTMLSelectElement;
    const next = target.value as SettingsThemePreference;
    onThemeChange(next);
  }

  function handleOpenOnLaunchChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    onOpenOnLaunchChange(target.checked);
  }
</script>

<SettingsCard id="general">
  <SectionHeader title={$t("general.title")} icon="general" />

  <div class="mt-6 space-y-6">
    <div>
      <FieldLabel
        text={$t("language.label")}
        icon="language"
        forId="locale-select"
      />
      <div class={`mt-2 gap-2 ${controlInputSpaceWrapClass}`}>
        <div class="relative">
          <select
            id="locale-select"
            class={compactSelectClass}
            value={localeValue}
            onchange={handleLocaleChange}
            disabled={isLoading}
          >
            <option value="system">{$t("language.system")}</option>
            <option value="zh-CN">{$t("language.zh")}</option>
            <option value="en-US">{$t("language.en")}</option>
          </select>
          <span
            class="pointer-events-none absolute inset-y-0 right-3 flex items-center settings-text-muted"
          >
            <AppIcon name="selectArrows" size={14} strokeWidth={1.8} />
          </span>
        </div>
      </div>
    </div>

    <div>
      <FieldLabel text={$t("theme.label")} icon="theme" forId="theme-select" />
      <div class={`mt-2 gap-2 ${controlInputSpaceWrapClass}`}>
        <div class="relative">
          <select
            id="theme-select"
            class={compactSelectClass}
            value={themeValue}
            onchange={handleThemeChange}
            disabled={isLoading}
          >
            <option value="system">{$t("theme.system")}</option>
            <option value="light">{$t("theme.light")}</option>
            <option value="dark">{$t("theme.dark")}</option>
          </select>
          <span
            class="pointer-events-none absolute inset-y-0 right-3 flex items-center settings-text-muted"
          >
            <AppIcon name="selectArrows" size={14} strokeWidth={1.8} />
          </span>
        </div>
      </div>
    </div>

    <div>
      <FieldLabel text={$t("general.configLabel")} icon="config" element="p" />
      <div class="mt-2">
        <ActionBar
          {isLoading}
          {isImporting}
          {isExporting}
          {isOpeningConfigDir}
          {isResetting}
          {isApplying}
          {canReset}
          {onImport}
          {onExport}
          {onOpenConfigDir}
          {onReset}
        />
      </div>
    </div>

    <div>
      <FieldLabel
        text={$t("general.startupLabel")}
        icon="startup"
        element="p"
      />
      <div class={`mt-2 gap-2 ${controlInputSpaceWrapClass}`}>
        <label
          for="settings-open-on-launch"
          class={`settings-text-secondary inline-flex items-center gap-3 text-sm font-medium ${
            isLoading ? "opacity-60" : ""
          }`}
        >
          <input
            id="settings-open-on-launch"
            type="checkbox"
            class="peer sr-only"
            checked={openOnLaunchValue}
            onchange={handleOpenOnLaunchChange}
            disabled={isLoading}
          />
          <span class="settings-checkbox"></span>
          <span>{$t("general.openSettingsOnLaunch")}</span>
        </label>
      </div>
    </div>
  </div>
</SettingsCard>

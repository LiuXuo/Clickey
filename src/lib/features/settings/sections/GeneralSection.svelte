<script lang="ts">
  import { t, type Locale } from "$lib/i18n";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";
  import ActionBar from "$lib/features/settings/ui/ActionBar.svelte";
  import {
    controlInputSpaceWrapClass,
  } from "$lib/features/settings/ui/control-classes";

  let {
    localeValue,
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
  } = $props<{
    localeValue: Locale;
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
    onLocaleChange: (next: Locale) => void;
  }>();

  function handleLocaleChange(event: Event) {
    const target = event.currentTarget as HTMLSelectElement;
    const next = target.value as Locale;
    onLocaleChange(next);
  }
</script>

<SettingsCard id="general">
  <SectionHeader title={$t("general.title")} icon="general" />

  <div class="mt-6 space-y-6">
    <div>
      <label class="text-sm font-medium text-zinc-700" for="locale-select"
        >{$t("language.label")}</label
      >
      <div class={`mt-2 gap-2 ${controlInputSpaceWrapClass}`}>
        <div class="relative">
          <select
            id="locale-select"
            class={compactSelectClass}
            value={localeValue}
            onchange={handleLocaleChange}
            disabled={isLoading}
          >
            <option value="zh-CN">{$t("language.zh")}</option>
            <option value="en-US">{$t("language.en")}</option>
          </select>
          <span
            class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              class="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 4.5 6 1.8l3 2.7" />
              <path d="M3 7.5 6 10.2l3-2.7" />
            </svg>
          </span>
        </div>
      </div>
    </div>

    <div>
      <p class="text-sm font-medium text-zinc-700">
        {$t("general.configLabel")}
      </p>
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
  </div>
</SettingsCard>

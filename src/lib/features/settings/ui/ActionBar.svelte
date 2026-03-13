<script lang="ts">
  import { t } from "$lib/i18n";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";

  let {
    isLoading,
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
  } = $props<{
    isLoading: boolean;
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
  }>();

  const buttonClass =
    "inline-flex w-full items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60";

  const busy = $derived(
    isLoading ||
      isImporting ||
      isExporting ||
      isOpeningConfigDir ||
      isResetting ||
      isApplying,
  );
</script>

<div class="grid gap-2 sm:grid-cols-2">
  <button type="button" class={buttonClass} onclick={onImport} disabled={busy}>
    <AppIcon name="import" />
    <span>{isImporting ? $t("app.importing") : $t("app.import")}</span>
  </button>

  <button type="button" class={buttonClass} onclick={onExport} disabled={busy}>
    <AppIcon name="export" />
    <span>{isExporting ? $t("app.exporting") : $t("app.export")}</span>
  </button>

  <button
    type="button"
    class={buttonClass}
    onclick={onOpenConfigDir}
    disabled={busy}
  >
    <AppIcon name="folder" />
    <span
      >{isOpeningConfigDir
        ? $t("app.openingConfigDir")
        : $t("app.openConfigDir")}</span
    >
  </button>

  <button
    type="button"
    class={buttonClass}
    onclick={onReset}
    disabled={isLoading || isResetting || isApplying || !canReset}
  >
    <AppIcon name="reset" />
    <span>{isResetting ? $t("app.resetting") : $t("app.reset")}</span>
  </button>
</div>

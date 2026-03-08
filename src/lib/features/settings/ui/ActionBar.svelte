<script lang="ts">
  import { t } from "$lib/i18n";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";

  let {
    isLoading,
    isImporting,
    isExporting,
    isResetting,
    isApplying,
    onImport,
    onExport,
    onReset,
  } = $props<{
    isLoading: boolean;
    isImporting: boolean;
    isExporting: boolean;
    isResetting: boolean;
    isApplying: boolean;
    onImport: () => void;
    onExport: () => void;
    onReset: () => void;
  }>();

  const buttonClass =
    "inline-flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60";

  const busy = $derived(
    isLoading || isImporting || isExporting || isResetting || isApplying,
  );
</script>

<div class="grid gap-2 sm:grid-cols-3">
  <button type="button" class={buttonClass} onclick={onImport} disabled={busy}>
    <span class="inline-flex items-center gap-2">
      <AppIcon name="import" />
      <span>{isImporting ? $t("app.importing") : $t("app.import")}</span>
    </span>
    <span class="text-xs font-medium text-zinc-400">JSON</span>
  </button>

  <button type="button" class={buttonClass} onclick={onExport} disabled={busy}>
    <span class="inline-flex items-center gap-2">
      <AppIcon name="export" />
      <span>{isExporting ? $t("app.exporting") : $t("app.export")}</span>
    </span>
    <span class="text-xs font-medium text-zinc-400">JSON</span>
  </button>

  <button
    type="button"
    class={buttonClass}
    onclick={onReset}
    disabled={isLoading || isResetting || isApplying}
  >
    <span class="inline-flex items-center gap-2">
      <AppIcon name="reset" />
      <span>{isResetting ? $t("app.resetting") : $t("app.reset")}</span>
    </span>
    <span class="text-xs font-medium text-zinc-400">Default</span>
  </button>
</div>

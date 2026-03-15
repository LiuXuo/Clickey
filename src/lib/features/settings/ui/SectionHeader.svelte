<script lang="ts">
  import type { SettingsIconName } from "$lib/features/settings/icons";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";

  let { title, icon } = $props<{
    title: string;
    icon?: SettingsIconName;
  }>();
</script>

<div class="flex items-center justify-between gap-4">
  <div class="flex items-center gap-2">
    {#if icon}
      <AppIcon
        name={icon}
        size={18}
        strokeWidth={2.2}
        className="settings-icon-muted"
      />
    {/if}
    <h2 class="settings-text-primary text-lg font-semibold">{title}</h2>
  </div>
</div>

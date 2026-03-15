<script lang="ts">
  import type { Snippet } from "svelte";
  import type { SettingsIconName } from "$lib/features/settings/icons";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";

  export type SettingsSectionItem = {
    id: string;
    label: string;
    icon: SettingsIconName;
  };

  let { sections, activeSection, onSelectSection, children } = $props<{
    sections: SettingsSectionItem[];
    activeSection: string;
    onSelectSection: (id: string) => void;
    children?: Snippet;
  }>();
</script>

<div class="flex gap-4">
  <aside class="settings-nav w-52 shrink-0 pr-3">
    <nav class="sticky top-0 space-y-1 py-1">
      {#each sections as section (section.id)}
        <button
          type="button"
          class="settings-nav-button"
          data-active={section.id === activeSection}
          onclick={() => onSelectSection(section.id)}
        >
          <span class="flex items-center gap-2 font-semibold">
            <AppIcon
              name={section.icon}
              size={17}
              strokeWidth={section.id === activeSection ? 2.4 : 2}
            />
            <span>{section.label}</span>
          </span>
        </button>
      {/each}
    </nav>
  </aside>

  <div class="min-w-0 flex-1">
    <div class="space-y-6 pb-4 pr-1">
      {@render children?.()}
    </div>
  </div>
</div>

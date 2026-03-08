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

<div class="flex h-full min-h-0 gap-4">
  <aside class="w-52 shrink-0 border-r border-zinc-200 pr-3">
    <nav class="sticky top-0 space-y-1 py-1">
      {#each sections as section (section.id)}
        <button
          type="button"
          class={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
            section.id === activeSection
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
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

  <div class="settings-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
    <div class="space-y-6 pb-4">
      {@render children?.()}
    </div>
  </div>
</div>

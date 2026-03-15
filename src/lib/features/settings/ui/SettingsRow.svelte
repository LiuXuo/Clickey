<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    label,
    forId = "",
    description = "",
    compact = false,
    children,
  } = $props<{
    label: string;
    forId?: string;
    description?: string;
    compact?: boolean;
    children?: Snippet;
  }>();
</script>

<div class={compact ? "space-y-1" : "space-y-2"}>
  <label class="settings-text-secondary text-sm font-medium" for={forId}
    >{label}</label
  >
  {#if description}
    <p class="settings-text-muted text-xs">{description}</p>
  {/if}
  {@render children?.()}
</div>

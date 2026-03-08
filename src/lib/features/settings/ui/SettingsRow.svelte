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
  <label class="text-sm font-medium text-zinc-700" for={forId}>{label}</label>
  {#if description}
    <p class="text-xs text-zinc-500">{description}</p>
  {/if}
  {@render children?.()}
</div>

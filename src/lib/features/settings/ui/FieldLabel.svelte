<script lang="ts">
  import type { AppIconName } from "$lib/features/settings/icons";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";

  let {
    text,
    icon,
    forId,
    element = "label",
    className = "",
  } = $props<{
    text: string;
    icon?: AppIconName;
    forId?: string;
    element?: "label" | "p" | "span";
    className?: string;
  }>();

  const baseClass = $derived(
    `inline-flex items-center gap-2 text-sm font-medium text-zinc-700 ${className}`,
  );
</script>

{#if element === "label"}
  <label class={baseClass} for={forId}>
    {#if icon}
      <AppIcon
        name={icon}
        size={14}
        strokeWidth={2.1}
        className="text-zinc-400"
      />
    {/if}
    <span>{text}</span>
  </label>
{:else if element === "p"}
  <p class={baseClass}>
    {#if icon}
      <AppIcon
        name={icon}
        size={14}
        strokeWidth={2.1}
        className="text-zinc-400"
      />
    {/if}
    <span>{text}</span>
  </p>
{:else}
  <span class={baseClass}>
    {#if icon}
      <AppIcon
        name={icon}
        size={14}
        strokeWidth={2.1}
        className="text-zinc-400"
      />
    {/if}
    <span>{text}</span>
  </span>
{/if}

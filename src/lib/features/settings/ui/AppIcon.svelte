<script lang="ts">
  import type { SettingsIconName } from "$lib/features/settings/icons";

  let {
    name,
    size = 16,
    strokeWidth = 2,
    className = "",
  } = $props<{
    name: SettingsIconName;
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>();
</script>

<svg
  aria-hidden="true"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class={`shrink-0 ${className}`}
>
  {#if name === "general"}
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.5v2.2" />
    <path d="M12 18.3v2.2" />
    <path d="m18.1 5.9-1.6 1.6" />
    <path d="m7.5 16.5-1.6 1.6" />
    <path d="M20.5 12h-2.2" />
    <path d="M5.7 12H3.5" />
    <path d="m18.1 18.1-1.6-1.6" />
    <path d="m7.5 7.5-1.6-1.6" />
  {:else if name === "mouse"}
    <rect x="7" y="2.8" width="10" height="18.4" rx="5" />
    <path d="M12 2.8v5.4" />
  {:else if name === "layers"}
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    <path d="M12 3.5v17" />
    <path d="M3.5 12h17" />
  {:else if name === "hotkeys"}
    <rect x="2.8" y="6.2" width="18.4" height="11.6" rx="2" />
    <path d="M6.4 10h0.01" />
    <path d="M10.2 10h0.01" />
    <path d="M14 10h0.01" />
    <path d="M17.8 10h0.01" />
    <path d="M6.4 13.8h11.4" />
  {:else if name === "overlay"}
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5v17" />
    <path d="m3.5 3.5 17 17" />
  {:else if name === "import"}
    <path d="M12 3.5v10.4" />
    <path d="m8.2 10.8 3.8 3.8 3.8-3.8" />
    <path d="M4 18.5h16" />
  {:else if name === "export"}
    <path d="M12 20.5V10.1" />
    <path d="m15.8 13.2-3.8-3.8-3.8 3.8" />
    <path d="M4 5.5h16" />
  {:else if name === "folder"}
    <path
      d="M3.5 8.4a2 2 0 0 1 2-2h4l1.4 1.6h7.6a2 2 0 0 1 2 2v7.2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"
    />
    <path d="M3.8 10.1h16.4" />
  {:else}
    <path d="M20 11a8 8 0 1 0 2 5.2" />
    <path d="M20.4 4.6v5h-5" />
  {/if}
</svg>

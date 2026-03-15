<script lang="ts">
  import type { AppIconName } from "$lib/features/settings/icons";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";

  export type ToastTone = "success" | "error" | "info";

  export type ToastItem = {
    id: number;
    tone: ToastTone;
    message: string;
  };

  let { toasts, onDismiss } = $props<{
    toasts: ToastItem[];
    onDismiss: (id: number) => void;
  }>();

  function toneClass(tone: ToastTone): string {
    if (tone === "success") {
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }
    if (tone === "error") {
      return "border-rose-200 bg-rose-50 text-rose-800";
    }
    return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }

  function toneIcon(tone: ToastTone): AppIconName {
    if (tone === "success") {
      return "success";
    }
    if (tone === "error") {
      return "error";
    }
    return "info";
  }
</script>

<div
  class="pointer-events-none fixed right-4 top-4 z-50 flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2"
>
  {#each toasts as toast (toast.id)}
    <div
      class={`pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-md ${toneClass(toast.tone)}`}
      role="status"
      aria-live="polite"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-start gap-2">
          <AppIcon
            name={toneIcon(toast.tone)}
            size={16}
            strokeWidth={2.2}
            className="mt-0.5 shrink-0"
          />
          <p class="leading-5">{toast.message}</p>
        </div>
        <button
          type="button"
          class="rounded px-1 py-0.5 text-xs font-semibold opacity-70 transition hover:opacity-100"
          onclick={() => onDismiss(toast.id)}
        >
          x
        </button>
      </div>
    </div>
  {/each}
</div>

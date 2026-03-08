<script lang="ts">
  import type { Snippet } from "svelte";

  let { id = "", children } = $props<{ id?: string; children?: Snippet }>();
</script>

<section {id} class="px-1 py-2">
  {@render children?.()}
</section>

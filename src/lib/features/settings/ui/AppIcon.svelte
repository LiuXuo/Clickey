<script lang="ts">
  import type { Component } from "svelte";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowLeftRight from "@lucide/svelte/icons/arrow-left-right";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import Ban from "@lucide/svelte/icons/ban";
  import Blend from "@lucide/svelte/icons/blend";
  import CaseSensitive from "@lucide/svelte/icons/case-sensitive";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import CircleCheckBig from "@lucide/svelte/icons/circle-check-big";
  import CircleHelp from "@lucide/svelte/icons/circle-help";
  import CirclePlus from "@lucide/svelte/icons/circle-plus";
  import Clock3 from "@lucide/svelte/icons/clock-3";
  import Columns3 from "@lucide/svelte/icons/columns-3";
  import Combine from "@lucide/svelte/icons/combine";
  import Crosshair from "@lucide/svelte/icons/crosshair";
  import Dice5 from "@lucide/svelte/icons/dice-5";
  import FileInput from "@lucide/svelte/icons/file-input";
  import FileOutput from "@lucide/svelte/icons/file-output";
  import Focus from "@lucide/svelte/icons/focus";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import Gauge from "@lucide/svelte/icons/gauge";
  import Grid3x3 from "@lucide/svelte/icons/grid-3x3";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import Info from "@lucide/svelte/icons/info";
  import Keyboard from "@lucide/svelte/icons/keyboard";
  import Layers3 from "@lucide/svelte/icons/layers-3";
  import Languages from "@lucide/svelte/icons/languages";
  import ListOrdered from "@lucide/svelte/icons/list-ordered";
  import MonitorUp from "@lucide/svelte/icons/monitor-up";
  import MousePointer2 from "@lucide/svelte/icons/mouse-pointer-2";
  import MousePointerClick from "@lucide/svelte/icons/mouse-pointer-click";
  import Paintbrush from "@lucide/svelte/icons/paintbrush";
  import Palette from "@lucide/svelte/icons/palette";
  import Pilcrow from "@lucide/svelte/icons/pilcrow";
  import Pipette from "@lucide/svelte/icons/pipette";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Rocket from "@lucide/svelte/icons/rocket";
  import Rows3 from "@lucide/svelte/icons/rows-3";
  import ScanLine from "@lucide/svelte/icons/scan-line";
  import Settings2 from "@lucide/svelte/icons/settings-2";
  import SlidersHorizontal from "@lucide/svelte/icons/sliders-horizontal";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import SquareMousePointer from "@lucide/svelte/icons/square-mouse-pointer";
  import SquareStack from "@lucide/svelte/icons/square-stack";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Type from "@lucide/svelte/icons/type";
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import Waypoints from "@lucide/svelte/icons/waypoints";
  import Workflow from "@lucide/svelte/icons/workflow";
  import X from "@lucide/svelte/icons/x";
  import type { AppIconName } from "$lib/features/settings/icons";

  type LucideIconComponent = Component<{
    "aria-hidden"?: "true" | "false";
    class?: string;
    size?: number | string;
    strokeWidth?: number | string;
  }>;

  const icons = {
    general: Settings2,
    mouse: MousePointerClick,
    layers: Layers3,
    hotkeys: Keyboard,
    overlay: Focus,
    startup: Rocket,
    language: Languages,
    theme: Palette,
    config: SlidersHorizontal,
    selectArrows: ChevronsUpDown,
    import: FileInput,
    export: FileOutput,
    folder: FolderOpen,
    reset: RotateCcw,
    record: SquareMousePointer,
    cancel: X,
    clear: Ban,
    default: Undo2,
    focus: Focus,
    workflow: Workflow,
    arrowLeft: ArrowLeft,
    arrowRight: ArrowRight,
    arrowUp: ArrowUp,
    arrowDown: ArrowDown,
    nudge: ArrowLeftRight,
    monitor: MonitorUp,
    layerItem: SquareStack,
    addSingle: CirclePlus,
    addCombo: Combine,
    moveUp: ArrowUp,
    moveDown: ArrowDown,
    remove: Trash2,
    mode: Workflow,
    font: Type,
    rows: Rows3,
    columns: Columns3,
    keys: CaseSensitive,
    showGrid: Grid3x3,
    showDiagonals: ScanLine,
    alpha: Blend,
    lineWidth: Paintbrush,
    fontFamily: Pilcrow,
    colorMask: Palette,
    colorLine: Pipette,
    colorText: CaseSensitive,
    actionCycle: ListOrdered,
    smoothMove: MousePointer2,
    duration: Clock3,
    step: ListOrdered,
    press: MousePointerClick,
    landing: Crosshair,
    randomness: Dice5,
    distance: ArrowLeftRight,
    curve: Waypoints,
    jitter: Sparkles,
    stride: Workflow,
    maxSteps: Gauge,
    success: CircleCheckBig,
    error: CircleAlert,
    info: Info,
    help: CircleHelp,
    leftAction: MousePointerClick,
    rightAction: MousePointer2,
    middleAction: Crosshair,
    moveOnlyAction: Focus,
    doubleLeftAction: Workflow,
    ctrlLeftAction: Keyboard,
    cmdLeftAction: Keyboard,
    shiftLeftAction: Keyboard,
    dragHandle: GripVertical,
  } satisfies Record<AppIconName, LucideIconComponent>;

  let {
    name,
    size = 16,
    strokeWidth = 2,
    className = "",
  } = $props<{
    name: AppIconName;
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>();

  const Icon = $derived(icons[name as AppIconName]);
</script>

<Icon aria-hidden="true" {size} {strokeWidth} class={`shrink-0 ${className}`} />

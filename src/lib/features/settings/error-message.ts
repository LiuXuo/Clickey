import type { TranslateFn, TranslationKey } from "$lib/i18n";

const CODE_TO_KEY_MAP: Record<string, TranslationKey> = {
  ERR_LAYERS_EMPTY: "errors.layersRequired",
  ERR_NUDGE_STEP_INVALID: "errors.nudgeStep",
  ERR_MOUSE_MOVE_DURATION_INVALID: "errors.mouseMoveDuration",
  ERR_MOUSE_MOVE_STEP_INVALID: "errors.mouseMoveStep",
  ERR_MOUSE_DURATION_RANDOMNESS_INVALID: "errors.mouseDurationRandomness",
  ERR_MOUSE_STEP_RANDOMNESS_INVALID: "errors.mouseStepRandomness",
  ERR_MOUSE_DISTANCE_BOOST_INVALID: "errors.mouseDistanceBoostPx",
  ERR_MOUSE_DURATION_DISTANCE_BOOST_INVALID:
    "errors.mouseDurationDistanceBoost",
  ERR_MOUSE_STEP_DISTANCE_BOOST_INVALID: "errors.mouseStepDistanceBoost",
  ERR_MOUSE_CURVE_ALONG_RATIO_INVALID: "errors.mouseCurveAlongRatio",
  ERR_MOUSE_CURVE_SPREAD_RATIO_INVALID: "errors.mouseCurveSpreadRatio",
  ERR_MOUSE_JITTER_RATIO_INVALID: "errors.mouseJitterRatio",
  ERR_MOUSE_ADAPTIVE_STRIDE_BASE_INVALID: "errors.mouseAdaptiveStrideBase",
  ERR_MOUSE_ADAPTIVE_STRIDE_DISTANCE_RATIO_INVALID:
    "errors.mouseAdaptiveStrideDistanceRatio",
  ERR_MOUSE_ADAPTIVE_STRIDE_MAX_INVALID: "errors.mouseAdaptiveStrideMax",
  ERR_MOUSE_MAX_STEPS_INVALID: "errors.mouseMaxSteps",
  ERR_MOUSE_MAX_STEP_SLEEP_INVALID: "errors.mouseMaxStepSleepMs",
  ERR_OVERLAY_LINE_WIDTH_INVALID: "errors.overlayLineWidth",
  ERR_OVERLAY_FONT_SIZE_INVALID: "errors.overlayFontSize",
  ERR_OVERLAY_LAYER_FONT_SIZE_INVALID: "errors.overlayFontSize",
  ERR_OVERRIDE_JSON_NOT_OBJECT: "errors.overrideJsonObject",
  ERR_OVERRIDE_JSON_PARSE_FAILED: "errors.overrideJsonParse",
  ERR_OVERRIDE_SCHEMA_INVALID: "errors.overrideJsonSchemaInvalid",
  ERR_HOTKEY_INVALID_TRIGGER: "errors.activationHotkeyInvalid",
  ERR_HOTKEY_REGISTER_FAILED: "errors.backendHotkeyRegisterFailed",
  ERR_BACKEND_STATE_UNAVAILABLE: "errors.backendStateUnavailable",
  ERR_CONFIG_DIR_UNAVAILABLE: "errors.backendConfigDirUnavailable",
  ERR_CONFIG_SERIALIZE_FAILED: "errors.backendConfigPersistFailed",
  ERR_CONFIG_PERSIST_FAILED: "errors.backendConfigPersistFailed",
  ERR_CLICK_ACTION_UNSUPPORTED: "errors.backendClickUnsupported",
  ERR_MAC_ACCESSIBILITY_REQUIRED: "errors.backendMacAccessibilityRequired",
};

const HOTKEY_CODE_TO_LABEL_KEY: Record<string, TranslationKey> = {
  ERR_HOTKEY_INVALID_CANCEL: "hotkeys.cancel",
  ERR_HOTKEY_INVALID_UNDO: "hotkeys.undo",
  ERR_HOTKEY_INVALID_DIRECT_CLICK: "hotkeys.directClick",
  ERR_HOTKEY_INVALID_SWITCH_ACTION: "hotkeys.switchAction",
  ERR_HOTKEY_INVALID_NEXT_MONITOR: "hotkeys.nextMonitor",
  ERR_HOTKEY_INVALID_NUDGE_LEFT: "hotkeys.nudgeLeft",
  ERR_HOTKEY_INVALID_NUDGE_RIGHT: "hotkeys.nudgeRight",
  ERR_HOTKEY_INVALID_NUDGE_UP: "hotkeys.nudgeUp",
  ERR_HOTKEY_INVALID_NUDGE_DOWN: "hotkeys.nudgeDown",
};

function unwrapError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return String((error as { code: string }).code);
  }
  return String(error);
}

function normalizeCode(raw: string): string {
  let message = raw.trim();
  if (message.startsWith("Error: ")) {
    message = message.slice("Error: ".length).trim();
  }
  if (message.length >= 2 && message.startsWith('"') && message.endsWith('"')) {
    try {
      const parsed = JSON.parse(message);
      if (typeof parsed === "string") {
        message = parsed.trim();
      }
    } catch {
      // Keep raw text if it is not valid JSON.
    }
  }
  return message;
}

function layerDisplayIndex(rawIndex: string | undefined): number {
  const parsed = Number.parseInt(rawIndex ?? "", 10);
  return Number.isFinite(parsed) ? parsed + 1 : 1;
}

function expectedValue(rawExpected: string | undefined): string {
  const parsed = Number.parseInt(rawExpected ?? "", 10);
  return Number.isFinite(parsed) ? String(parsed) : "0";
}

export function toLocalizedErrorMessage(
  error: unknown,
  translate: TranslateFn,
): string {
  const code = normalizeCode(unwrapError(error));
  if (!code || code === "[object Object]") {
    return translate("errors.backendUnknown");
  }

  const [base, layer, expected] = code.split(":");

  const directKey = CODE_TO_KEY_MAP[base];
  if (directKey) {
    return translate(directKey);
  }

  const hotkeyLabelKey = HOTKEY_CODE_TO_LABEL_KEY[base];
  if (hotkeyLabelKey) {
    return translate("errors.backendHotkeyInvalid", {
      field: translate(hotkeyLabelKey),
    });
  }

  if (base === "ERR_LAYER_GRID_INVALID") {
    return translate("errors.layerGridInvalidSimple", {
      index: layerDisplayIndex(layer),
    });
  }

  if (base === "ERR_LAYER_STAGE0_GRID_INVALID") {
    return translate("errors.stage0GridInvalidSimple", {
      index: layerDisplayIndex(layer),
    });
  }

  if (base === "ERR_LAYER_STAGE1_GRID_INVALID") {
    return translate("errors.stage1GridInvalidSimple", {
      index: layerDisplayIndex(layer),
    });
  }

  if (base === "ERR_LAYER_KEYS_EXPECTED") {
    return translate("errors.layerExpectedKeysSimple", {
      index: layerDisplayIndex(layer),
      expected: expectedValue(expected),
    });
  }

  if (base === "ERR_LAYER_STAGE0_KEYS_EXPECTED") {
    return translate("errors.stage0ExpectedKeysSimple", {
      index: layerDisplayIndex(layer),
      expected: expectedValue(expected),
    });
  }

  if (base === "ERR_LAYER_STAGE1_KEYS_EXPECTED") {
    return translate("errors.stage1ExpectedKeysSimple", {
      index: layerDisplayIndex(layer),
      expected: expectedValue(expected),
    });
  }

  if (base === "ERR_LAYER_KEYS_EMPTY") {
    return translate("errors.layerEmptyKeysSimple", {
      index: layerDisplayIndex(layer),
    });
  }

  if (base === "ERR_LAYER_STAGE0_KEYS_EMPTY") {
    return translate("errors.stage0EmptyKeysSimple", {
      index: layerDisplayIndex(layer),
    });
  }

  if (base === "ERR_LAYER_STAGE1_KEYS_EMPTY") {
    return translate("errors.stage1EmptyKeysSimple", {
      index: layerDisplayIndex(layer),
    });
  }

  if (base === "ERR_COMBO_AXIS_CONSTRAINT") {
    return translate("errors.comboAxisConstraintSimple", {
      index: layerDisplayIndex(layer),
    });
  }

  return translate("errors.backendUnknownWithDetail", { detail: code });
}

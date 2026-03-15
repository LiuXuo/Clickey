import { describe, expect, it } from "vitest";
import {
  canonicalizeHotkey,
  formatHotkeyDisplay,
  formatHotkeyFromKeyboardEvent,
} from "../hotkey-utils";

function mockKeyboardEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: "",
    code: "",
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ...overrides,
  } as KeyboardEvent;
}

describe("hotkey utils", () => {
  it("normalizes macOS private-use function-key characters for display", () => {
    const f20 = String.fromCodePoint(0xf717);

    expect(formatHotkeyDisplay(f20)).toBe("F20");
    expect(canonicalizeHotkey(f20)).toBe("f20");
  });

  it("records macOS private-use function-key characters as F20", () => {
    const event = mockKeyboardEvent({
      key: String.fromCodePoint(0xf717),
      code: "F20",
    });

    expect(formatHotkeyFromKeyboardEvent(event)).toBe("F20");
  });

  it("records macOS private-use function-key characters as F24", () => {
    const event = mockKeyboardEvent({
      key: String.fromCodePoint(0xf71b),
      code: "F24",
    });

    expect(formatHotkeyFromKeyboardEvent(event)).toBe("F24");
  });
});

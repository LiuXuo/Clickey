type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    platform?: string;
  };
};

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgentDataPlatform = (navigator as NavigatorWithUserAgentData)
    .userAgentData?.platform;
  if (typeof userAgentDataPlatform === "string" && userAgentDataPlatform) {
    return userAgentDataPlatform.toLowerCase().includes("mac");
  }

  const platform = navigator.platform || navigator.userAgent;
  return platform.toLowerCase().includes("mac");
}

// import { createClient } from "@supabase/supabase-js";

type AssetType = "image" | "link" | "text" | "video" | "audio";

export type Asset = {
  url: string;
  type: AssetType;
};

export type UserInfo = {
  email: string;
  name: string;
};
console.log("Background script loaded!");

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-image",
    title: "Save Image to Pantry",
    contexts: ["image"],
  });
  chrome.contextMenus.create({
    id: "save-link",
    title: "Save Link to Pantry",
    contexts: ["link"],
  });
  chrome.contextMenus.create({
    id: "save-text",
    title: "Save Text to Pantry",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "save-video",
    title: "Save Video to Pantry",
    contexts: ["video"],
  });
  chrome.contextMenus.create({
    id: "save-audio",
    title: "Save Audio to Pantry",
    contexts: ["audio"],
  });
});

chrome.contextMenus.onClicked.addListener((asset, tab) => {
  const hasSession = checkUserSession();
  if (!hasSession && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "show-login-modal",
    });
    return;
  }

  if (asset.menuItemId === "save-image") {
    console.log("Save image to pantry");
    const assetToSave = { url: asset.srcUrl, type: "image" };
    // send message to content script with asset to save
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: "save-image",
        asset: { asset: assetToSave, auth: hasSession },
      });
    }
  }
  if (asset.menuItemId === "save-link") {
    console.log("Save Link");
  }
});

async function checkUserSession() {
  // check chrome local storage for session
  await chrome.storage.local.get(["session"]);
}

// listen for auth message
chrome.runtime.onMessageExternal.addListener(async (message) => {
  if (message.type === "auth-message") {
    console.log("auth message received");
    const session = message.session;
    if (session) {
      await chrome.storage.local.set({ session: session });
    }
  }
  return true;
});

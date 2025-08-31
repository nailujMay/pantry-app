

type AssetType = "image" | "link" | "text" | "video" | "audio"

export type Asset = {
    url: string,
    type: AssetType
}
console.log("Background script loaded!")

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-image",
        title: "Save Image to Pantry",
        contexts: ["image"]
    });
    chrome.contextMenus.create({
        id: "save-link",
        title: "Save Link to Pantry",
        contexts: ["link"]
      });
    chrome.contextMenus.create({
        id: "save-text",
        title: "Save Text to Pantry",
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id:"save-video",
        title: "Save Video to Pantry",
        contexts: ["video"]
    });
    chrome.contextMenus.create({
        id:"save-audio",
        title: "Save Audio to Pantry",
        contexts: ["audio"]
    });
});

chrome.contextMenus.onClicked.addListener((asset, tab) => {
    console.log(asset);
    if (asset.menuItemId === "save-image") {
        console.log("Save image to pantry");
        const assetToSave = {url: asset.srcUrl, type: "image"}
        // send message to content script with error handling
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: "save-image",
                asset: assetToSave,
            }).catch((error) => {
                console.error("Failed to send message to content script:", error);
                console.log("Content script not available, handling in background");
                // Handle the save directly in background script
                console.log("Asset to save:", asset);
            });
        }
    }
    if (asset.menuItemId ==="save-link") {
        console.log("Save Link");
   
    }

});


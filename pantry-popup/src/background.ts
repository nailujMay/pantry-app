import { createClient } from '@supabase/supabase-js'

// console.log("Background script loaded!")
// console.log(chrome.contextMenus)

type AssetType = "image" | "link" | "text" | "video" | "audio"

type Asset = {
    url: string,
    type: AssetType
}

const supabaseURL = "https://oqawdekjzxidfkqrgsot.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseURL, supabaseAnonKey)
console.log(supabase)

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

chrome.contextMenus.onClicked.addListener((asset) => {
    console.log(asset);
    if (asset.menuItemId === "save-image") {
        console.log("Save image to pantry");
        saveToPantry({
            url: asset.srcUrl!,    
            type: "image"
        }, "image")
    }
    if (asset.menuItemId ==="save-link") {
        console.log("Save Link");
        saveToPantry({
            url: asset.srcUrl!,    
            type: "link"
        }, "link")
    }

});


async function saveToPantry(asset: Asset, type: AssetType){
    const {data, error} = await supabase.from('asset collection').insert({
       src_url: asset.url,
       asset_type:type,
    })
    console.log(data)
    console.log(error)
}
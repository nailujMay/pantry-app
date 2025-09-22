

type AssetType = "image" | "link" | "text" | "video" | "audio"

export type Asset = {
    url: string,
    type: AssetType
}

export type UserInfo = {
    email: string,
    name: string,
}
console.log("Background script loaded!")

// Create supabase client
const supabaseURL = "https://oqawdekjzxidfkqrgsot.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

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
        // send message to content script with asset to save
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: "save-image",
                asset: assetToSave,
            })
        }
    }
    if (asset.menuItemId ==="save-link") {
        console.log("Save Link");
    }
});

// listen for auth message
chrome.runtime.onMessage.addListener( (message,sender,sendResponse) => {
    if (message.action === "auth-message") {

        (async ()=>{
            try {
                // get supabase auth tokens
                const authResult = await getSupabaseAuthToken() as { accessToken: string, refreshToken: string }
                console.log("supabase auth result", authResult)
                
                // get user info from supabase
                const userInfo = await getUserInfoFromSupabase(authResult.accessToken)
                console.log("user auth info", userInfo)
                console.log(sender)
               sendResponse({
                action: "auth-success",
                userInfo: userInfo
               })
            } catch (error) {
                console.error("Auth flow failed:", error)
                sendResponse({
                    action: "auth-error",
                    error: error
                })
            }

        })()
       
        return true 
    }
})

// listen for logout message
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "logout-message") {
        console.log("logout message received")
        chrome.identity.clearAllCachedAuthTokens(() => {
            console.log('Chrome tokens cleared');
          });
    }
})

function getSupabaseAuthToken(){
    console.log("start supabase auth flow")
    const redirectUri = chrome.identity.getRedirectURL()
    
    // Supabase OAuth URL
    const supabaseAuthUrl = `${supabaseURL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;
    
    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
            url: supabaseAuthUrl,
            interactive: true
        }, (responseUrl) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                console.log("Supabase auth response URL:", responseUrl);
                
                // Extract tokens from Supabase response
                const url = new URL(responseUrl as string);
                
                // Supabase returns access_token and refresh_token in the hash
                const accessToken = url.hash.includes('access_token=') ? 
                    url.hash.split('access_token=')[1]?.split('&')[0] : null;
                const refreshToken = url.hash.includes('refresh_token=') ? 
                    url.hash.split('refresh_token=')[1]?.split('&')[0] : null;
                
                console.log("Access token from Supabase:", accessToken);
                console.log("Refresh token from Supabase:", refreshToken);
                
                if (accessToken) {
                    console.log("Supabase tokens extracted successfully");
                    resolve({ accessToken, refreshToken });
                } else {
                    console.error("No access token found. Full response:", responseUrl);
                    reject(new Error("No access token found in response"));
                }
            }
        })
    })
}

async function getUserInfoFromSupabase(accessToken: string){
    console.log("getting user info from supabase", accessToken)
    
    try {
        const response = await fetch(`${supabaseURL}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': supabaseAnonKey
            }
        })
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const userInfo = await response.json()
        console.log("supabase user info", userInfo)
        
        return {
            email: userInfo.email,
            name: userInfo.user_metadata?.full_name || userInfo.user_metadata?.name,
            picture: userInfo.user_metadata?.avatar_url,
            sub: userInfo.id,
            email_verified: userInfo.email_confirmed_at ? true : false
        };
    } catch (error) {
        console.error('Error getting user info from Supabase:', error);
        throw new Error('Failed to get user info from Supabase');
    }
}




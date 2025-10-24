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
  const hasSession = checkUserSession(asset);
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

async function checkUserSession(asset: chrome.contextMenus.OnClickData) {
  console.log("Context menu clicked:", asset.menuItemId);

  // check chrome local storage for session
  const { session } = await chrome.storage.local.get(["session"]);
  console.log("Session from chrome storage:", session);
}

// listen for logout message
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "logout-message") {
    console.log("logout message received");
    chrome.identity.clearAllCachedAuthTokens(() => {
      console.log("Chrome tokens cleared");
    });
  }
});

// listen for auth message
chrome.runtime.onMessageExternal.addListener(async (message) => {
  if (message.type === "auth-message") {
    console.log("auth message received");
    const session = message.session;
    if (session) {
      console.log("setting session", session);
      console.log("Setting session with:", JSON.stringify(session, null, 2));

      // Store the session in chrome storage
      await chrome.storage.local.set({ session: session });

      // Set session in background supabase client
      // await supabase.auth.setSession(session);

      // if (error) {
      //   console.error("Error setting session in background:", error);
      // } else {
      //   console.log("Session set successfully in background:", data);
      // }
    }
  }
  return true;
});

// function getSupabaseAuthToken() {
//   console.log("start supabase auth flow");
//   const redirectUri = chrome.identity.getRedirectURL();

//   // Supabase OAuth URL
//   const supabaseAuthUrl = `${supabaseURL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
//     redirectUri
//   )}`;

//   return new Promise((resolve, reject) => {
//     chrome.identity.launchWebAuthFlow(
//       {
//         url: supabaseAuthUrl,
//         interactive: true,
//       },
//       (responseUrl) => {
//         if (chrome.runtime.lastError) {
//           reject(chrome.runtime.lastError);
//         } else {
//           console.log("Supabase auth response URL:", responseUrl);

//           // Extract tokens from Supabase response
//           const url = new URL(responseUrl as string);

//           // Supabase returns access_token and refresh_token in the hash
//           const accessToken = url.hash.includes("access_token=")
//             ? url.hash.split("access_token=")[1]?.split("&")[0]
//             : null;
//           const refreshToken = url.hash.includes("refresh_token=")
//             ? url.hash.split("refresh_token=")[1]?.split("&")[0]
//             : null;

//           console.log("Access token from Supabase:", accessToken);
//           console.log("Refresh token from Supabase:", refreshToken);

//           if (accessToken) {
//             console.log("Supabase tokens extracted successfully");
//             resolve({ accessToken, refreshToken });
//           } else {
//             console.error("No access token found. Full response:", responseUrl);
//             reject(new Error("No access token found in response"));
//           }
//         }
//       }
//     );
//   });
// }

// async function getUserInfoFromSupabase(accessToken: string) {
//   console.log("getting user info from supabase", accessToken);

//   try {
//     const response = await fetch(`${supabaseURL}/auth/v1/user`, {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         apikey: supabaseAnonKey,
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const userInfo = await response.json();
//     console.log("supabase user info", userInfo);

//     return {
//       email: userInfo.email,
//       name: userInfo.user_metadata?.full_name || userInfo.user_metadata?.name,
//       picture: userInfo.user_metadata?.avatar_url,
//       sub: userInfo.id,
//       email_verified: userInfo.email_confirmed_at ? true : false,
//     };
//   } catch (error) {
//     console.error("Error getting user info from Supabase:", error);
//     throw new Error("Failed to get user info from Supabase");
//   }
// }

import { createClient } from '@supabase/supabase-js'
// import { useState, useEffect } from 'react'
import type { Asset } from '../background'
import { useState } from 'react'

const supabaseURL = "https://oqawdekjzxidfkqrgsot.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseURL, supabaseAnonKey)

export function ExtPopup({ asset }: { asset: Asset }) {
    const [isSaved, setIsSaved] = useState(false)


    async function saveAsset() {
        console.log("saving asset")
        try{
            const {data, error} = await supabase.from('asset collection').insert({
                src_url: asset.url,
                asset_type: asset.type
              
            })
            console.log(data)
            setIsSaved(true)
            if(error) {
                throw error
            }

        }catch(error) {
            console.error(error)
        }
    }

    console.log("rendering popup")
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            display: 'flex',
            zIndex: 999999,
            border: '1px solid black',
            margin: '10px',
            backgroundColor: 'white',
            borderRadius: '8px',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px'
        }}>
      
                <h1 style={{ 
                    color: '#333',
                    fontSize: '24px',
                    fontWeight: 'bold'
                }}>Muse</h1>
                <img style={{height: '200px', width: 'auto'}} src={asset.url} alt="Asset" />

                <button style={{
                    backgroundColor: 'blue',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px'
                }} onClick={saveAsset}>Save</button>
                {isSaved && <p>Asset saved</p>}
    
            
        </div>
    )
}
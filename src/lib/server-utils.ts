import { BackendType } from './types';
export function getLiveKitURLS(): BackendType[]  {
    const res = getBackends().map((item) => {
        return {
            url: item.url,
            label: item.label
        }
    })
    return res;
}

export function getBackends() {
    const backends: BackendType[] = [];
    let prefixKey = 'LIVEKIT_';
    let i = 0;
    let hasNext = true;
    
    while(hasNext) {
        i++;
        const label = process.env[prefixKey + `LABEL_${i}`] || '';
        
        console.log(prefixKey + `LABEL_${i}`, label);
        if(!label){
            hasNext = false;
            break
        }
        const apiKey = process.env[prefixKey + `API_KEY_${i}`] || '';
        const secret = process.env[prefixKey + `API_SECRET_${i}`] || '';
        const url = process.env[prefixKey + `URL_${i}`] || '';
        backends.push({
            url,
            apiKey,
            secret,
            label
        });
    }
    return backends;
}
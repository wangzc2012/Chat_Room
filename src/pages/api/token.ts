import { NextApiRequest, NextApiResponse } from 'next';

import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import type { AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';
import { TokenResult, RoomMetadata, BackendType } from '../../lib/types';
import { lru } from '@/lib/lru';
import { error } from 'console';
import { getBackends } from '@/lib/server-utils';
const backends = getBackends();

export const createToken = async (userInfo: AccessTokenOptions, grant: VideoGrant, backend: BackendType) => {
  const at = new AccessToken(backend.apiKey, backend.secret, userInfo);
  at.ttl = '24h';
  at.addGrant(grant);
  return await at.toJwt();
};
export default async function handleToken(req: NextApiRequest, res: NextApiResponse) {

    const { roomName, identity, name, passwd, metadata, backendLabel } = req.body;
    // console.log({ roomName, identity, name, metadata } )
    if (typeof identity !== 'string' || typeof roomName !== 'string') {
      res.status(403).end();
      return;
    }

    if (Array.isArray(name)) {
        return res.status(500).json({ error: "provide max one name"});
    }
    if (Array.isArray(metadata)) {
        return res.status(500).json({ error: 'provide max one metadata string'});
    }

    if (!backendLabel) {
      return res.status(500).json({ error: "Need specify backend" });
    }

    const backend = backends.find((item) => item.label === backendLabel);
    if(!backend){
      return res.status(500).json({ error: "Backend not found" });
    }
    const wsUrl = backend.url;
    const apiKey = backend.apiKey;
    const apiSecret = backend.secret

    if (!apiKey || !apiSecret || !wsUrl) {
        return res.status(500).json({ error: "Server misconfigured" });
      }

    const livekitHost = wsUrl?.replace("wss://", "https://");

    const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
    

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      roomAdmin: false
    };

    let metadataObj: any = undefined
    let metadataProcess = metadata;
    const defaultMaxParticipants = process.env.LIVEKIT_DEFAULT_MAXPARTICIPANTS ? parseInt(process.env.LIVEKIT_DEFAULT_MAXPARTICIPANTS) : 10
    const lruKey = backendLabel + '-' + roomName

    try{
        const participants = await roomService.listParticipants(roomName);
        if(participants.length == 0) throw error("room is empty");
        const roomLRUItem: RoomMetadata = lru.get(roomName)
        if(roomLRUItem != undefined && roomLRUItem.maxParticipants > 0 &&
         participants.length >= roomLRUItem.maxParticipants){
            return res.status(500).json({ error: 'api.RoomFull'})
        }
        console.log('roomLRUItem:', roomLRUItem)
        if(roomLRUItem.passwd != undefined && roomLRUItem.passwd != "" && roomLRUItem.passwd != passwd){
            return res.status(500).json({ error: 'api.PasswordError'})
        }
        // 检查是否有相同名称的用户
        for(const participant of participants){
            if(participant.identity == identity){
                return res.status(500).json({ error: 'api.NameIsUsed'})
            }
        }
    }catch(e: any){
        console.log(e)
        if(e?.code === 'UND_ERR_CONNECT_TIMEOUT'){
            return res.status(500).json({ error: 'api.Timeout'})
        }
        // If room doesn't exist, user is room admin
        grant.roomAdmin = true;
        // set no passwrd
        if(lru.get(lruKey)){
            lru.delete(lruKey)
        }
        const t: RoomMetadata = {passwd: passwd, time: new Date().getTime(), maxParticipants: defaultMaxParticipants, numOfPaticipants: 0}
        lru.set(lruKey, t)
        
        const rooms = await roomService.listRooms()
        if(rooms.findIndex((room)=> room.name === roomName) >= 0){
            roomService.updateRoomMetadata(
                'roomName',
                JSON.stringify(t)
            )
        }else{
            roomService.createRoom({
                name: roomName,
                emptyTimeout: 30,
                maxParticipants: defaultMaxParticipants,
                metadata: JSON.stringify(t),
            })
        }

        // console.log('metadata: ', metadata)
        try {
          metadataObj = metadata ? {...JSON.parse(metadata)} : {};
        } catch (error) {
          console.log('set metadata error:',error)
          metadataObj = {};
        }

        metadataObj = {...metadataObj, admin: true}
        metadataProcess = JSON.stringify(metadataObj)

        // for passwd debug
        console.log('room metadata:', t)
        console.log(`set passwd for ${roomName}`)
        // const t2 = lru.get(roomName) as RoomMetadata;
        // console.log(`get passwd for ${roomName}, passwd: ${t2.passwd}`)
    }

    const token = await createToken({ identity, name, metadata: metadataProcess }, grant, backend);
    const roomLRUItem: RoomMetadata = lru.get(lruKey)
    roomLRUItem.numOfPaticipants += 1;
    lru.set(lruKey, roomLRUItem)

    const result: TokenResult = {
      identity,
      accessToken: token,
      isAdmin: grant.roomAdmin as boolean
    };

    res.status(200).json(result);
}

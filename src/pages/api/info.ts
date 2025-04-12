// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { RoomServiceClient } from "livekit-server-sdk";
import { RoomMetadata } from "@/lib/types";
import { lru } from "@/lib/lru";
import { getBackends } from "@/lib/server-utils";
const backends = getBackends();
export type RoomInfo = {
  num_participants: number;
  hasPasswd: boolean,
  maxParticipants: number
};

type ErrorResponse = {
  error: string;
};

type Query = {
  room: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RoomInfo | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(400).json({ error: "Invalid method" });
  }
  const { roomName, backendLabel } = req.query;
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
  ;
  const livekitHost = wsUrl?.replace("wss://", "https://");
  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

  try {
    const lruKey = backendLabel + '-' + roomName
    const l: (RoomMetadata | undefined) = lru.get(lruKey as string) as RoomMetadata | undefined
    // for passwd debug
    // if(l) console.log(`get passwd for ${roomName}, passwd: ${l.passwd}`)
    // const participants = await roomService.listParticipants(roomName as string);
    // if(l) console.log(`get num_participants for ${roomName}`)
    const needpass = (l && l.passwd !== "" && l.passwd !== undefined) ? true: false
    const maxParticipants = l?.maxParticipants || 0
    return res.status(200).json({ num_participants: l?.numOfPaticipants || 0, hasPasswd: needpass, maxParticipants: maxParticipants });
  } catch(e) {
    return res.status(200).json({ num_participants: 0, hasPasswd: false, maxParticipants: 0 });
  }
}
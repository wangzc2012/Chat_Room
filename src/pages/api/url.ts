import { NextApiRequest, NextApiResponse } from 'next';
import { getLiveKitURLS } from '../../lib/server-utils';

export default async function handleServerUrl(req: NextApiRequest, res: NextApiResponse) {
  try {
    const urls = getLiveKitURLS();
    res.status(200).json(urls);
  } catch (e) {
    res.statusMessage = (e as Error).message;
    res.status(500).end();
  }
}
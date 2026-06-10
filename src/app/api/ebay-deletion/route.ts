import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const challengeCode = searchParams.get('challenge_code');

    const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;
    const endpointUrl = process.env.EBAY_DELETION_ENDPOINT_URL;

    if (!challengeCode) {
      return NextResponse.json({ error: 'Missing challenge_code' }, { status: 400 });
    }

    if (!verificationToken || !endpointUrl) {
      console.error(
        '[eBay Webhook] Missing EBAY_VERIFICATION_TOKEN or EBAY_DELETION_ENDPOINT_URL in env variables.'
      );
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    
    const hashString = challengeCode + verificationToken + endpointUrl;

    const challengeResponse = crypto
      .createHash('sha256')
      .update(hashString)
      .digest('hex');

    console.log(`[eBay Webhook] Responding to challenge. Response: ${challengeResponse}`);

    return NextResponse.json({ challengeResponse }, { status: 200 });
  } catch (error) {
    console.error('[eBay Webhook] GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    
    const body = await req.json();
    console.log('[eBay Webhook] Received Account Deletion Notification payload:', JSON.stringify(body, null, 2));

    
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[eBay Webhook] POST Error:', error);
    
    return new NextResponse('OK', { status: 200 });
  }
}

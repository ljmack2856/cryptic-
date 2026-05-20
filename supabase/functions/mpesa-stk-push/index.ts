// ══════════════════════════════════════════════════════
//  SUPABASE EDGE FUNCTION: mpesa-stk-push
//  Deploy this to: supabase/functions/mpesa-stk-push/index.ts
//
//  Setup steps:
//  1. Install Supabase CLI: npm install -g supabase
//  2. Login: supabase login
//  3. Link project: supabase link --project-ref xbazuosvlggtolahgcjv
//  4. Create function folder: supabase/functions/mpesa-stk-push/
//  5. Save this file as index.ts inside that folder
//  6. Set secrets (see bottom of this file)
//  7. Deploy: supabase functions deploy mpesa-stk-push
// ══════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, amount, accountRef, userId, txnId } = await req.json()

    // ── Validate inputs
    if (!phone || !amount || !userId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ── Format phone number to 254XXXXXXXXX
    let formattedPhone = phone.toString().trim()
    if (formattedPhone.startsWith('0'))       formattedPhone = '254' + formattedPhone.slice(1)
    if (formattedPhone.startsWith('+254'))    formattedPhone = formattedPhone.slice(1)
    if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = '254' + formattedPhone
    }
    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid phone number format. Use 07XXXXXXXX or 01XXXXXXXX' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ── Get credentials from Supabase secrets
    const CONSUMER_KEY    = Deno.env.get('MPESA_CONSUMER_KEY')!
    const CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET')!
    const TILL_NUMBER     = Deno.env.get('MPESA_TILL_NUMBER')!
    const SHORTCODE       = Deno.env.get('MPESA_SHORTCODE')!    // Same as till for Buy Goods
    const PASSKEY         = Deno.env.get('MPESA_PASSKEY')!
    const CALLBACK_URL    = Deno.env.get('MPESA_CALLBACK_URL')! // Your callback URL
    const IS_PRODUCTION   = Deno.env.get('MPESA_PRODUCTION') === 'true'

    const BASE_URL = IS_PRODUCTION
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'

    // ── Step 1: Get OAuth token
    const credentials = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`)
    const tokenRes = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to authenticate with Safaricom', error: err }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { access_token } = await tokenRes.json()

    // ── Step 2: Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password  = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`)

    // ── Step 3: Initiate STK Push
    const stkBody = {
      BusinessShortCode: SHORTCODE,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerBuyGoodsOnline', // Use this for Till numbers
      Amount:            Math.ceil(amount),         // M-Pesa requires whole numbers
      PartyA:            formattedPhone,
      PartyB:            TILL_NUMBER,
      PhoneNumber:       formattedPhone,
      CallBackURL:       CALLBACK_URL,
      AccountReference:  accountRef || 'CryptoFXMiners',
      TransactionDesc:   `Deposit ${txnId || ''}`
    }

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method:  'POST',
      headers: {
        'Authorization':  `Bearer ${access_token}`,
        'Content-Type':   'application/json',
      },
      body: JSON.stringify(stkBody)
    })

    const stkData = await stkRes.json()

    if (stkData.ResponseCode === '0') {
      // STK push sent successfully
      return new Response(
        JSON.stringify({
          success:         true,
          message:        'STK push sent. Please check your phone and enter M-Pesa PIN.',
          checkoutRequestId: stkData.CheckoutRequestID,
          merchantRequestId: stkData.MerchantRequestID,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: stkData.errorMessage || stkData.CustomerMessage || 'STK push failed',
          code:    stkData.ResponseCode
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// ══════════════════════════════════════════════════════
//  SET THESE SECRETS USING SUPABASE CLI:
//
//  supabase secrets set MPESA_CONSUMER_KEY=your_consumer_key
//  supabase secrets set MPESA_CONSUMER_SECRET=your_consumer_secret
//  supabase secrets set MPESA_TILL_NUMBER=your_till_number
//  supabase secrets set MPESA_SHORTCODE=your_till_number
//  supabase secrets set MPESA_PASSKEY=your_passkey_from_daraja
//  supabase secrets set MPESA_CALLBACK_URL=https://xbazuosvlggtolahgcjv.supabase.co/functions/v1/mpesa-callback
//  supabase secrets set MPESA_PRODUCTION=false
//
//  For production change MPESA_PRODUCTION to true
// ══════════════════════════════════════════════════════
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Request body received:', JSON.stringify(body))

    const { phone, amount, accountRef, userId, txnId } = body

    if (!phone || !amount || !userId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Format phone
    let formattedPhone = phone.toString().trim()
    if (formattedPhone.startsWith('0'))       formattedPhone = '254' + formattedPhone.slice(1)
    if (formattedPhone.startsWith('+254'))    formattedPhone = formattedPhone.slice(1)
    if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = '254' + formattedPhone
    }
    console.log('Formatted phone:', formattedPhone)

    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid phone number: ' + formattedPhone }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const CONSUMER_KEY    = Deno.env.get('MPESA_CONSUMER_KEY')
    const CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET')
    const TILL_NUMBER     = Deno.env.get('MPESA_TILL_NUMBER')
    const SHORTCODE       = Deno.env.get('MPESA_SHORTCODE')
    const PASSKEY         = Deno.env.get('MPESA_PASSKEY')
    const CALLBACK_URL    = Deno.env.get('MPESA_CALLBACK_URL')
    const IS_PRODUCTION   = Deno.env.get('MPESA_PRODUCTION') === 'true'

    console.log('Secrets loaded:', {
      hasKey: !!CONSUMER_KEY,
      hasSecret: !!CONSUMER_SECRET,
      tillNumber: TILL_NUMBER,
      shortcode: SHORTCODE,
      hasPasskey: !!PASSKEY,
      callbackUrl: CALLBACK_URL,
      isProduction: IS_PRODUCTION
    })

    if (!CONSUMER_KEY || !CONSUMER_SECRET || !SHORTCODE || !PASSKEY || !CALLBACK_URL) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing server configuration - check secrets' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const BASE_URL = IS_PRODUCTION
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'

    console.log('Getting OAuth token from:', BASE_URL)

    const credentials = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`)
    const tokenRes = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    })

    const tokenText = await tokenRes.text()
    console.log('Token response status:', tokenRes.status)
    console.log('Token response body:', tokenText)

    if (!tokenRes.ok) {
      return new Response(
        JSON.stringify({ success: false, message: 'Safaricom auth failed', error: tokenText, status: tokenRes.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { access_token } = JSON.parse(tokenText)
    console.log('Got access token:', !!access_token)

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password  = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`)

    const stkBody = {
      BusinessShortCode: SHORTCODE,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount:            Math.ceil(amount),
      PartyA:            formattedPhone,
      PartyB: SHORTCODE,  // was TILL_NUMBER
      PhoneNumber:       formattedPhone,
      CallBackURL:       CALLBACK_URL,
      AccountReference:  accountRef || 'CryptoFXMiners',
      TransactionDesc:   `Deposit ${txnId || ''}`
    }

    console.log('STK push body:', JSON.stringify(stkBody))

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method:  'POST',
      headers: {
        'Authorization':  `Bearer ${access_token}`,
        'Content-Type':   'application/json',
      },
      body: JSON.stringify(stkBody)
    })

    const stkText = await stkRes.text()
    console.log('STK response status:', stkRes.status)
    console.log('STK response body:', stkText)

    const stkData = JSON.parse(stkText)

    if (stkData.ResponseCode === '0') {
      return new Response(
        JSON.stringify({
          success:           true,
          message:           'STK push sent. Please check your phone and enter M-Pesa PIN.',
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
          code:    stkData.ResponseCode,
          raw:     stkData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

  } catch (err) {
    console.error('Caught error:', err)
    return new Response(
      JSON.stringify({ success: false, message: err.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
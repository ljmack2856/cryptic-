// ══════════════════════════════════════════════════════
//  SUPABASE EDGE FUNCTION: mpesa-callback
//  Deploy to: supabase/functions/mpesa-callback/index.ts
//  This receives payment confirmation from Safaricom
//  and automatically approves the deposit in your DB
// ══════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const body = await req.json()

    // Safaricom sends callback to this URL
    const stk = body?.Body?.stkCallback
    if (!stk) {
      return new Response('OK', { status: 200 })
    }

    const resultCode    = stk.ResultCode        // 0 = success
    const checkoutId    = stk.CheckoutRequestID
    const merchantReqId = stk.MerchantRequestID

    // Initialize Supabase with service role (can bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (resultCode === 0) {
      // Payment successful — extract details
      const items = stk.CallbackMetadata?.Item || []
      const get   = (name: string) => items.find((i: any) => i.Name === name)?.Value

      const amount      = get('Amount')
      const mpesaRef    = get('MpesaReceiptNumber')
      const phone       = get('PhoneNumber')
      const paidAt      = get('TransactionDate')

      // Find the pending deposit matching this checkout request
      const { data: deposit } = await supabase
        .from('deposits')
        .select('id, user_id, amount')
        .eq('reference', checkoutId)   // we store checkoutId as reference
        .eq('status', 'pending')
        .single()

      if (deposit) {
        // Update deposit to approved
        await supabase.from('deposits').update({
          status:      'approved',
          reference:   mpesaRef,       // replace temp ref with actual M-Pesa receipt
          reviewed_at: new Date().toISOString(),
        }).eq('id', deposit.id)

        // The on_deposit_approved trigger will automatically:
        // - Update user's main_balance
        // - Create a transaction record
        // - Credit referral bonus if applicable
      }

    } else {
      // Payment failed — mark deposit as rejected
      const { data: deposit } = await supabase
        .from('deposits')
        .select('id')
        .eq('reference', checkoutId)
        .eq('status', 'pending')
        .single()

      if (deposit) {
        await supabase.from('deposits').update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        }).eq('id', deposit.id)
      }
    }

    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('Callback error:', err)
    return new Response('OK', { status: 200 }) // Always return 200 to Safaricom
  }
})
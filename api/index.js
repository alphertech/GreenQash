import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

const PORT = process.env.PORT || 3000

app.get('/health', (req, res) => res.json({ ok: true }))

// Get user profile by id
app.get('/users/:id', async (req, res) => {
  const userId = req.params.id
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, user_name, email_address, status, rank, last_login, total_income')
      .eq('id', userId)
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Get earnings summary for user
app.get('/earnings/:id', async (req, res) => {
  const userId = req.params.id
  try {
    const { data, error } = await supabase
      .from('earnings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Get contents for a user (supports ?userId=)
app.get('/contents', async (req, res) => {
  const userId = req.query.userId
  try {
    let query = supabase.from('contents').select('*')
    if (userId) query = query.eq('user_id', userId)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Get payment info
app.get('/payment-info/:id', async (req, res) => {
  const userId = req.params.id
  try {
    const { data, error } = await supabase
      .from('payment_info')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Get withdrawal requests
app.get('/withdrawals', async (req, res) => {
  const userId = req.query.userId
  try {
    let query = supabase.from('withdrawals').select('*')
    if (userId) query = query.eq('user_id', userId)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Create a withdrawal request
app.post('/withdrawals', async (req, res) => {
  const payload = req.body
  // Expected: { user_id, amount, payment_method, phone_number, email }
  try {
    const insert = {
      user_id: payload.user_id,
      amount: payload.amount,
      payment_method: payload.payment_method,
      phone_number: payload.phone_number,
      email: payload.email,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    const { data, error } = await supabase.from('withdrawals').insert([insert]).select().maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})

// api/index.js - Main backend API server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://kwghulqonljulmvlcfnz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== AUTHENTICATION MIDDLEWARE ====================
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        // Add user to request
        req.user = user;
        next();
        
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

// ==================== PUBLIC ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'GreenQash API'
    });
});

// Get Supabase config for frontend
app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    });
});

// ==================== PROTECTED ROUTES ====================

// Get current user profile
app.get('/api/user/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user from public.users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userId)
            .single();
        
        if (userError && userError.code !== 'PGRST116') {
            throw userError;
        }
        
        // Get earnings
        const { data: earningsData, error: earningsError } = await supabase
            .from('earnings')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (earningsError && earningsError.code !== 'PGRST116') {
            throw earningsError;
        }
        
        // Get payment info
        const { data: paymentData, error: paymentError } = await supabase
            .from('payment_information')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (paymentError && paymentError.code !== 'PGRST116') {
            throw paymentError;
        }
        
        res.json({
            user: {
                id: userId,
                email: req.user.email,
                ...userData,
                authMetadata: req.user.user_metadata
            },
            earnings: earningsData || {
                id: userId,
                youtube: 0,
                tiktok: 0,
                trivia: 0,
                refferal: 0,
                bonus: 0,
                all_time_earn: 0,
                total_withdrawn: 0
            },
            payment: paymentData || null,
            success: true
        });
        
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile data' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, phone, email } = req.body;
        
        // Update users table
        const { error: userError } = await supabase
            .from('users')
            .update({
                user_name: username,
                email_address: email
            })
            .eq('uuid', userId);
        
        if (userError) throw userError;
        
        // Update or create payment info
        const { error: paymentError } = await supabase
            .from('payment_information')
            .upsert({
                id: userId,
                mobile_number: phone,
                email: email
            }, {
                onConflict: 'id'
            });
        
        if (paymentError) throw paymentError;
        
        // Update auth email if changed
        if (email !== req.user.email) {
            const { error: authError } = await supabase.auth.updateUser({
                email: email
            });
            
            if (authError) throw authError;
        }
        
        res.json({ 
            success: true, 
            message: 'Profile updated successfully' 
        });
        
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Claim task reward
app.post('/api/tasks/claim', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskType } = req.body; // 'youtube' or 'tiktok'
        
        if (!['youtube', 'tiktok'].includes(taskType)) {
            return res.status(400).json({ error: 'Invalid task type' });
        }
        
        // Get current earnings
        const { data: currentEarnings, error: fetchError } = await supabase
            .from('earnings')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }
        
        // Calculate new values
        const rewardAmount = 1000;
        const currentValue = currentEarnings?.[taskType] || 0;
        const newValue = currentValue + rewardAmount;
        const currentTotal = currentEarnings?.all_time_earn || 0;
        const newTotal = currentTotal + rewardAmount;
        
        // Update earnings
        const updateData = {
            [taskType]: newValue,
            all_time_earn: newTotal
        };
        
        const { error: updateError } = await supabase
            .from('earnings')
            .upsert({
                id: userId,
                ...updateData
            }, {
                onConflict: 'id'
            });
        
        if (updateError) throw updateError;
        
        // Update users table total_income
        await supabase
            .from('users')
            .update({ total_income: newTotal })
            .eq('uuid', userId);
        
        // Log activity
        await supabase
            .from('activities')
            .insert({
                user_id: userId,
                activity_type: `${taskType}_task`,
                description: `Completed ${taskType} task`,
                amount: rewardAmount,
                status: 'completed'
            });
        
        res.json({
            success: true,
            message: `Successfully claimed UGX ${rewardAmount}`,
            newBalance: newValue,
            taskType: taskType
        });
        
    } catch (error) {
        console.error('Task claim error:', error);
        res.status(500).json({ error: 'Failed to claim task reward' });
    }
});

// Submit trivia answers
app.post('/api/trivia/submit', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { answers } = req.body;
        
        // Calculate score
        const correctAnswers = {
            q1: 'c',
            q2: 'b',
            q3: 'c',
            q4: 'b',
            q5: 'b'
        };
        
        let score = 0;
        Object.keys(correctAnswers).forEach(q => {
            if (answers[q] === correctAnswers[q]) {
                score++;
            }
        });
        
        // Calculate earnings
        const amountEarned = score >= 3 ? 1500 : score * 300;
        
        // Get current earnings
        const { data: currentEarnings, error: fetchError } = await supabase
            .from('earnings')
            .select('trivia, all_time_earn')
            .eq('id', userId)
            .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }
        
        const newTriviaValue = (currentEarnings?.trivia || 0) + amountEarned;
        const newTotal = (currentEarnings?.all_time_earn || 0) + amountEarned;
        
        // Update database
        const { error: updateError } = await supabase
            .from('earnings')
            .upsert({
                id: userId,
                trivia: newTriviaValue,
                all_time_earn: newTotal
            }, {
                onConflict: 'id'
            });
        
        if (updateError) throw updateError;
        
        // Update users table
        await supabase
            .from('users')
            .update({ total_income: newTotal })
            .eq('uuid', userId);
        
        // Log activity
        await supabase
            .from('activities')
            .insert({
                user_id: userId,
                activity_type: 'trivia',
                description: `Completed trivia with score ${score}/5`,
                amount: amountEarned,
                status: 'completed'
            });
        
        res.json({
            success: true,
            score: score,
            totalQuestions: 5,
            amountEarned: amountEarned,
            message: score >= 3 ? 
                `Excellent! You scored ${score}/5 and earned UGX ${amountEarned} bonus!` :
                `You got ${score} correct answers. You earned UGX ${amountEarned}.`
        });
        
    } catch (error) {
        console.error('Trivia submit error:', error);
        res.status(500).json({ error: 'Failed to submit trivia answers' });
    }
});

// Request withdrawal
app.post('/api/withdrawals/request', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, paymentMethod, accountDetails } = req.body;
        
        // Validate amount
        if (amount < 59000) {
            return res.status(400).json({ error: 'Minimum withdrawal is UGX 59,000' });
        }
        
        // Get current balance
        const { data: earnings, error: fetchError } = await supabase
            .from('earnings')
            .select('all_time_earn, total_withdrawn')
            .eq('id', userId)
            .single();
        
        if (fetchError) throw fetchError;
        
        const availableBalance = (earnings?.all_time_earn || 0) - (earnings?.total_withdrawn || 0);
        
        if (amount > availableBalance) {
            return res.status(400).json({ 
                error: `Insufficient balance. Available: UGX ${availableBalance}` 
            });
        }
        
        // Create withdrawal request
        const { data: withdrawal, error: withdrawalError } = await supabase
            .from('withdrawal_requests')
            .insert({
                id: userId,
                amount: amount,
                payment_method: paymentMethod,
                phone_number: accountDetails,
                email: req.user.email,
                status: 'pending'
            })
            .select()
            .single();
        
        if (withdrawalError) throw withdrawalError;
        
        // Update total withdrawn
        const newTotalWithdrawn = (earnings.total_withdrawn || 0) + amount;
        
        await supabase
            .from('earnings')
            .update({ total_withdrawn: newTotalWithdrawn })
            .eq('id', userId);
        
        res.json({
            success: true,
            message: `Withdrawal request submitted for UGX ${amount.toLocaleString()}`,
            requestId: withdrawal.request_id,
            status: 'pending',
            estimatedCompletion: '8pm EAT today'
        });
        
    } catch (error) {
        console.error('Withdrawal request error:', error);
        res.status(500).json({ error: 'Failed to submit withdrawal request' });
    }
});

// Get user activities
app.get('/api/user/activities', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data: activities, error } = await supabase
            .from('activities')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        res.json({
            success: true,
            activities: activities || []
        });
        
    } catch (error) {
        console.error('Activities fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

// Get referral data
app.get('/api/user/referrals', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // This would query your referrals table
        // For now, return mock data
        res.json({
            success: true,
            referrals: {
                directReferrals: 2,
                subNetwork: 1,
                totalEarnings: 25000,
                downlines: [
                    {
                        username: 'john_doe',
                        email: 'john.doe@example.com',
                        date: '2023-10-15',
                        status: 'Active',
                        level: 1,
                        earnings: 25000
                    },
                    {
                        username: 'jane_smith',
                        email: 'jane.smith@example.com',
                        date: '2023-10-20',
                        status: 'Active',
                        level: 2,
                        earnings: 12000
                    }
                ]
            }
        });
        
    } catch (error) {
        console.error('Referrals fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch referral data' });
    }
});

// Activate account
app.post('/api/user/activate', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Update user status
        const { error } = await supabase
            .from('users')
            .update({
                status: 'active',
                rank: 'activated_user'
            })
            .eq('uuid', userId);
        
        if (error) throw error;
        
        // Add bonus for activation
        const { data: currentEarnings, error: fetchError } = await supabase
            .from('earnings')
            .select('bonus, all_time_earn')
            .eq('id', userId)
            .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }
        
        const activationBonus = 5000;
        const newBonus = (currentEarnings?.bonus || 0) + activationBonus;
        const newTotal = (currentEarnings?.all_time_earn || 0) + activationBonus;
        
        await supabase
            .from('earnings')
            .upsert({
                id: userId,
                bonus: newBonus,
                all_time_earn: newTotal
            }, {
                onConflict: 'id'
            });
        
        // Update users table
        await supabase
            .from('users')
            .update({ total_income: newTotal })
            .eq('uuid', userId);
        
        // Log activity
        await supabase
            .from('activities')
            .insert({
                user_id: userId,
                activity_type: 'account_activation',
                description: 'Account activated with bonus',
                amount: activationBonus,
                status: 'completed'
            });
        
        res.json({
            success: true,
            message: 'Account activated successfully!',
            bonusAdded: activationBonus
        });
        
    } catch (error) {
        console.error('Activation error:', error);
        res.status(500).json({ error: 'Failed to activate account' });
    }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Supabase URL: ${supabaseUrl}`);
});

// Export for testing
module.exports = app;
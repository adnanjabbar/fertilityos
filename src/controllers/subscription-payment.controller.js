/**
 * Subscription Payment Controller
 * 
 * Handles Stripe subscription payments for clinic registration
 */

const db = require('../config/database');
const emailService = require('../services/email.service');
const crypto = require('crypto');

// Subscription plans
const SUBSCRIPTION_PLANS = {
    STARTER: {
        name: 'Starter',
        monthly: 20,
        quarterly: 18,
        yearly: 15,
        features: ['Basic patient management', 'Up to 50 patients/month', 'Email support']
    },
    GROWTH: {
        name: 'Growth',
        monthly: 79,
        quarterly: 71,
        yearly: 63,
        features: ['Full lab integration', 'Unlimited patients', 'Verification badges', 'Priority support']
    },
    ENTERPRISE: {
        name: 'Enterprise',
        monthly: null, // Custom pricing
        features: ['Custom features', 'Dedicated account manager', '24/7 support', 'Custom integrations']
    }
};

/**
 * Create Stripe checkout session for subscription
 */
const createCheckoutSession = async (req, res) => {
    try {
        const { clinicId, planName, billingCycle, couponCode } = req.body;

        // Validate inputs
        if (!clinicId || !planName || !billingCycle) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Check if Stripe is configured
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(400).json({
                success: false,
                error: 'Stripe is not configured'
            });
        }

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // Get plan pricing
        const plan = SUBSCRIPTION_PLANS[planName.toUpperCase()];
        if (!plan || !plan[billingCycle]) {
            return res.status(400).json({
                success: false,
                error: 'Invalid plan or billing cycle'
            });
        }

        const amount = plan[billingCycle];
        const amountInCents = Math.round(amount * 100);

        // Get clinic details
        const clinicResult = await db.query(
            'SELECT clinic_name, email FROM clinics WHERE id = $1',
            [clinicId]
        );

        if (clinicResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Clinic not found'
            });
        }

        const clinic = clinicResult.rows[0];

        // Create or retrieve Stripe customer
        let customerId = null;
        const existingCustomer = await db.query(
            'SELECT stripe_customer_id FROM clinics WHERE id = $1',
            [clinicId]
        );

        if (existingCustomer.rows[0]?.stripe_customer_id) {
            customerId = existingCustomer.rows[0].stripe_customer_id;
        } else {
            const customer = await stripe.customers.create({
                email: clinic.email,
                name: clinic.clinic_name,
                metadata: {
                    clinic_id: clinicId
                }
            });
            customerId = customer.id;

            // Update clinic with customer ID
            await db.query(
                'UPDATE clinics SET stripe_customer_id = $1 WHERE id = $2',
                [customerId, clinicId]
            );
        }

        const appUrl = process.env.APP_URL || 'http://localhost:3000';

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            customer: customerId,
            metadata: {
                clinic_id: clinicId,
                plan_name: planName,
                billing_cycle: billingCycle
            },
            description: `FertilityOS ${planName} Plan - ${billingCycle}`
        });

        res.json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount,
                currency: 'USD'
            }
        });

    } catch (error) {
        console.error('Create checkout session error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error creating checkout session'
        });
    }
};

/**
 * Confirm subscription payment
 */
const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId, clinicId } = req.body;

        if (!paymentIntentId || !clinicId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(400).json({
                success: false,
                error: 'Stripe is not configured'
            });
        }

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                error: 'Payment not completed',
                status: paymentIntent.status
            });
        }

        // Record payment in database
        const amount = paymentIntent.amount / 100;
        const metadata = paymentIntent.metadata;

        const paymentResult = await db.query(
            `INSERT INTO subscription_payments (
                clinic_id, amount, currency, stripe_payment_id, stripe_payment_intent_id,
                stripe_customer_id, status, payment_method, billing_cycle, plan_name,
                metadata, paid_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            RETURNING *`,
            [
                clinicId, amount, paymentIntent.currency.toUpperCase(),
                paymentIntent.id, paymentIntent.id, paymentIntent.customer,
                'completed', 'card', metadata.billing_cycle, metadata.plan_name,
                JSON.stringify(metadata)
            ]
        );

        const payment = paymentResult.rows[0];

        // Generate invoice number with UUID prefix for uniqueness
        const invoiceNumber = `INV-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Create invoice
        const invoiceResult = await db.query(
            `INSERT INTO subscription_invoices (
                clinic_id, payment_id, invoice_number, amount, currency,
                status, issued_at, paid_at, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7)
            RETURNING *`,
            [
                clinicId, payment.id, invoiceNumber, amount,
                paymentIntent.currency.toUpperCase(), 'paid',
                JSON.stringify({ payment_intent_id: paymentIntentId })
            ]
        );

        const invoice = invoiceResult.rows[0];

        // Update clinic subscription details
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

        const subscriptionEndsAt = new Date();
        if (metadata.billing_cycle === 'monthly') {
            subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);
        } else if (metadata.billing_cycle === 'quarterly') {
            subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 3);
        } else if (metadata.billing_cycle === 'yearly') {
            subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
        }

        await db.query(
            `UPDATE clinics 
             SET plan_name = $1, billing_cycle = $2, subscription_status = $3,
                 subscription_starts_at = NOW(), subscription_ends_at = $4,
                 trial_ends_at = $5
             WHERE id = $6`,
            [
                metadata.plan_name, metadata.billing_cycle, 'active',
                subscriptionEndsAt, trialEndsAt, clinicId
            ]
        );

        // Get clinic details for email
        const clinicResult = await db.query(
            'SELECT clinic_name, email FROM clinics WHERE id = $1',
            [clinicId]
        );

        if (clinicResult.rows.length > 0) {
            const clinic = clinicResult.rows[0];

            // Send invoice email asynchronously
            emailService.sendInvoiceEmail(
                clinic.email,
                clinic.clinic_name,
                {
                    invoiceNumber,
                    amount,
                    currency: paymentIntent.currency.toUpperCase(),
                    planName: metadata.plan_name,
                    billingCycle: metadata.billing_cycle,
                    issuedAt: invoice.issued_at
                }
            ).catch(err => console.error('Error sending invoice email:', err));
        }

        res.json({
            success: true,
            message: 'Payment confirmed successfully',
            data: {
                payment,
                invoice
            }
        });

    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error confirming payment'
        });
    }
};

/**
 * Handle Stripe webhook events
 */
const handleWebhook = async (req, res) => {
    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.warn('Stripe webhook secret not configured');
            return res.status(400).json({ error: 'Webhook secret not configured' });
        }

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const sig = req.headers['stripe-signature'];
        
        let event;
        
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log('PaymentIntent succeeded:', paymentIntent.id);
                
                // Update payment status in database
                await db.query(
                    `UPDATE subscription_payments 
                     SET status = 'completed', paid_at = NOW()
                     WHERE stripe_payment_intent_id = $1`,
                    [paymentIntent.id]
                );
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                console.log('PaymentIntent failed:', paymentIntent.id);
                
                await db.query(
                    `UPDATE subscription_payments 
                     SET status = 'failed'
                     WHERE stripe_payment_intent_id = $1`,
                    [paymentIntent.id]
                );
                break;
            }

            case 'charge.refunded': {
                const charge = event.data.object;
                console.log('Charge refunded:', charge.id);
                
                await db.query(
                    `UPDATE subscription_payments 
                     SET status = 'refunded'
                     WHERE stripe_payment_id = $1`,
                    [charge.payment_intent]
                );
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook handler error' });
    }
};

/**
 * Get invoice by ID
 */
const getInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const clinicId = req.user?.clinic_id; // Optional - public access or authenticated

        let query = 'SELECT * FROM subscription_invoices WHERE id = $1';
        const params = [invoiceId];

        if (clinicId) {
            query += ' AND clinic_id = $2';
            params.push(clinicId);
        }

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Invoice not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({
            success: false,
            error: 'Error retrieving invoice'
        });
    }
};

/**
 * Get subscription plans
 */
const getPlans = async (req, res) => {
    try {
        res.json({
            success: true,
            data: SUBSCRIPTION_PLANS
        });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({
            success: false,
            error: 'Error retrieving plans'
        });
    }
};

module.exports = {
    createCheckoutSession,
    confirmPayment,
    handleWebhook,
    getInvoice,
    getPlans,
    SUBSCRIPTION_PLANS
};

// subscription.controller.js

/**
 * Subscription Management Controller
 * Handles subscription plans, modules, and clinic subscription operations
 */

const db = require('../config/database');
const subscriptionPlans = require('../../config/subscription.config');

/**
 * Get available subscription plans
 */
exports.getPlans = async (req, res) => {
    try {
        res.json({
            success: true,
            data: subscriptionPlans
        });
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        res.status(500).json({ success: false, error: 'Error fetching subscription plans' });
    }
};

/**
 * Create a new subscription for a clinic
 */
exports.createSubscription = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { planType, billingCycle } = req.body;

        if (!planType) {
            return res.status(400).json({ 
                success: false, 
                error: 'Plan type is required' 
            });
        }

        const plan = subscriptionPlans[planType];
        if (!plan) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid plan type. Choose from: basic, standard, premium' 
            });
        }

        // Calculate subscription end date based on billing cycle
        const startDate = new Date();
        const endDate = new Date();
        const cycle = billingCycle || plan.billingCycle;
        
        if (cycle === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (cycle === 'quarterly') {
            endDate.setMonth(endDate.getMonth() + 3);
        } else if (cycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Update clinic with subscription info
        const result = await db.query(
            `UPDATE clinics 
             SET subscription_plan = $1, 
                 subscription_status = 'active',
                 subscription_starts_at = $2,
                 subscription_ends_at = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING id, subdomain, clinic_name, subscription_plan, subscription_status, subscription_starts_at, subscription_ends_at`,
            [planType, startDate, endDate, clinicId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Clinic not found' });
        }

        // Log audit
        await db.query(
            `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [clinicId, req.user.id, 'clinic_staff', 'SUBSCRIPTION_CREATED', 'clinics', clinicId]
        );

        res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: {
                clinic: result.rows[0],
                plan: {
                    type: planType,
                    ...plan,
                    billingCycle: cycle
                }
            }
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ success: false, error: 'Error creating subscription' });
    }
};

/**
 * Get subscription details for a clinic
 */
exports.getSubscriptionDetails = async (req, res) => {
    try {
        const clinicId = req.params.clinicId || req.user.clinic_id;

        const result = await db.query(
            `SELECT id, subdomain, clinic_name, subscription_plan, subscription_status, 
                    subscription_starts_at, subscription_ends_at, is_active
             FROM clinics 
             WHERE id = $1`,
            [clinicId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Clinic not found' });
        }

        const clinic = result.rows[0];
        const plan = subscriptionPlans[clinic.subscription_plan] || subscriptionPlans.basic;

        res.json({
            success: true,
            data: {
                clinic: {
                    id: clinic.id,
                    subdomain: clinic.subdomain,
                    name: clinic.clinic_name
                },
                subscription: {
                    plan: clinic.subscription_plan,
                    status: clinic.subscription_status,
                    startsAt: clinic.subscription_starts_at,
                    endsAt: clinic.subscription_ends_at,
                    isActive: clinic.is_active
                },
                planDetails: plan
            }
        });
    } catch (error) {
        console.error('Error fetching subscription details:', error);
        res.status(500).json({ success: false, error: 'Error fetching subscription details' });
    }
};

/**
 * Update subscription plan
 */
exports.updateSubscription = async (req, res) => {
    try {
        const clinicId = req.params.clinicId || req.user.clinic_id;
        const { planType, billingCycle } = req.body;

        if (!planType) {
            return res.status(400).json({ 
                success: false, 
                error: 'Plan type is required' 
            });
        }

        const plan = subscriptionPlans[planType];
        if (!plan) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid plan type. Choose from: basic, standard, premium' 
            });
        }

        // Calculate new subscription end date
        const endDate = new Date();
        const cycle = billingCycle || plan.billingCycle;
        
        if (cycle === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (cycle === 'quarterly') {
            endDate.setMonth(endDate.getMonth() + 3);
        } else if (cycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const result = await db.query(
            `UPDATE clinics 
             SET subscription_plan = $1,
                 subscription_ends_at = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id, subdomain, clinic_name, subscription_plan, subscription_status, subscription_starts_at, subscription_ends_at`,
            [planType, endDate, clinicId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Clinic not found' });
        }

        // Log audit
        await db.query(
            `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [clinicId, req.user.id, 'clinic_staff', 'SUBSCRIPTION_UPDATED', 'clinics', clinicId]
        );

        res.json({
            success: true,
            message: 'Subscription updated successfully',
            data: {
                clinic: result.rows[0],
                plan: {
                    type: planType,
                    ...plan,
                    billingCycle: cycle
                }
            }
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ success: false, error: 'Error updating subscription' });
    }
};

/**
 * Cancel subscription
 */
exports.cancelSubscription = async (req, res) => {
    try {
        const clinicId = req.params.clinicId || req.user.clinic_id;

        const result = await db.query(
            `UPDATE clinics 
             SET subscription_status = 'cancelled',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, subdomain, clinic_name, subscription_plan, subscription_status`,
            [clinicId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Clinic not found' });
        }

        // Log audit
        await db.query(
            `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [clinicId, req.user.id, 'clinic_staff', 'SUBSCRIPTION_CANCELLED', 'clinics', clinicId]
        );

        res.json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ success: false, error: 'Error cancelling subscription' });
    }
};

/**
 * Get available modules for the clinic's subscription
 */
exports.getModules = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;

        // Get clinic's current subscription plan
        const clinicResult = await db.query(
            'SELECT subscription_plan FROM clinics WHERE id = $1',
            [clinicId]
        );

        if (clinicResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Clinic not found' });
        }

        const planType = clinicResult.rows[0].subscription_plan || 'basic';
        const plan = subscriptionPlans[planType] || subscriptionPlans.basic;

        res.json({
            success: true,
            data: {
                planType,
                modules: plan.modules,
                tiers: plan.tiers
            }
        });
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ success: false, error: 'Error fetching modules' });
    }
};

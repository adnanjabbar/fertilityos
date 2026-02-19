/**
 * Clinic Overview Controller
 * 
 * Provides birds-eye view dashboard for clinic owners/admins
 * Shows usage statistics, patient counts, financial summary, and system metrics
 */

const db = require('../config/database');

/**
 * Get comprehensive clinic overview for owner dashboard
 */
const getClinicOverview = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { period = 'month' } = req.query;

        // Calculate date range based on period
        let dateFilter;
        switch (period) {
            case 'today':
                dateFilter = "CURRENT_DATE";
                break;
            case 'week':
                dateFilter = "DATE_TRUNC('week', CURRENT_DATE)";
                break;
            case 'year':
                dateFilter = "DATE_TRUNC('year', CURRENT_DATE)";
                break;
            case 'all':
                dateFilter = "'1970-01-01'::date";
                break;
            default: // month
                dateFilter = "DATE_TRUNC('month', CURRENT_DATE)";
        }

        // Get clinic details
        const clinicResult = await db.query(
            `SELECT id, clinic_name, subdomain, email, phone, city, 
                    subscription_plan, subscription_status, 
                    subscription_starts_at, subscription_ends_at,
                    created_at
             FROM clinics WHERE id = $1`,
            [clinicId]
        );

        if (clinicResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Clinic not found' });
        }

        const clinic = clinicResult.rows[0];

        // Get patient statistics
        const patientStats = await db.query(
            `SELECT 
                COUNT(*) as total_patients,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_patients,
                COUNT(CASE WHEN created_at >= ${dateFilter} THEN 1 END) as new_patients_period
             FROM patients WHERE clinic_id = $1`,
            [clinicId]
        );

        // Get cycle statistics
        const cycleStats = await db.query(
            `SELECT 
                COUNT(*) as total_cycles,
                COUNT(CASE WHEN current_stage NOT IN ('completed', 'cancelled') THEN 1 END) as active_cycles,
                COUNT(CASE WHEN current_stage = 'completed' THEN 1 END) as completed_cycles,
                COUNT(CASE WHEN cycle_outcome = 'positive' THEN 1 END) as successful_cycles,
                COUNT(CASE WHEN start_date >= ${dateFilter} THEN 1 END) as new_cycles_period
             FROM ivf_cycles WHERE clinic_id = $1`,
            [clinicId]
        );

        // Get user statistics
        const userStats = await db.query(
            `SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
                COUNT(CASE WHEN role = 'owner' OR role = 'admin' THEN 1 END) as admin_users,
                COUNT(CASE WHEN role IN ('physician', 'ivf_specialist', 'nurse', 'nurse_coordinator') THEN 1 END) as clinical_staff,
                COUNT(CASE WHEN last_login >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as users_active_last_week
             FROM users WHERE clinic_id = $1`,
            [clinicId]
        );

        // Get financial summary (if tables exist)
        let financialSummary = {
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            pendingReceivables: 0
        };

        try {
            const revenueResult = await db.query(
                `SELECT COALESCE(SUM(net_amount), 0) as total 
                 FROM revenue_transactions 
                 WHERE clinic_id = $1 AND transaction_date >= ${dateFilter}`,
                [clinicId]
            );

            const expenseResult = await db.query(
                `SELECT COALESCE(SUM(total_amount), 0) as total 
                 FROM expenses 
                 WHERE clinic_id = $1 AND expense_date >= ${dateFilter}`,
                [clinicId]
            );

            const pendingResult = await db.query(
                `SELECT COALESCE(SUM(net_amount), 0) as total, COUNT(*) as count 
                 FROM revenue_transactions 
                 WHERE clinic_id = $1 AND payment_status = 'pending'`,
                [clinicId]
            );

            const totalRevenue = parseFloat(revenueResult.rows[0].total) || 0;
            const totalExpenses = parseFloat(expenseResult.rows[0].total) || 0;

            financialSummary = {
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                pendingReceivables: parseFloat(pendingResult.rows[0].total) || 0,
                pendingCount: parseInt(pendingResult.rows[0].count) || 0
            };
        } catch (err) {
            // Tables may not exist yet
            console.log('Financial tables not available:', err.message);
        }

        // Get lab statistics
        let labStats = {
            pendingLabTests: 0,
            completedLabTests: 0,
            embryosInCulture: 0,
            frozenEmbryos: 0
        };

        try {
            const embryoStats = await db.query(
                `SELECT 
                    COUNT(CASE WHEN status = 'developing' THEN 1 END) as developing,
                    COUNT(CASE WHEN status = 'frozen' THEN 1 END) as frozen,
                    COUNT(CASE WHEN status = 'transferred' THEN 1 END) as transferred
                 FROM embryos 
                 WHERE cycle_id IN (SELECT id FROM ivf_cycles WHERE clinic_id = $1)`,
                [clinicId]
            );

            labStats = {
                embryosInCulture: parseInt(embryoStats.rows[0].developing) || 0,
                frozenEmbryos: parseInt(embryoStats.rows[0].frozen) || 0,
                transferredEmbryos: parseInt(embryoStats.rows[0].transferred) || 0
            };
        } catch (err) {
            console.log('Lab tables not available:', err.message);
        }

        // Get recent activity
        const recentActivity = await db.query(
            `SELECT action, table_name, created_at, user_id
             FROM audit_logs 
             WHERE clinic_id = $1 
             ORDER BY created_at DESC 
             LIMIT 10`,
            [clinicId]
        );

        // Get cryopreservation summary
        let cryoStats = {
            totalStoredSpecimens: 0,
            embryosStored: 0,
            eggsStored: 0,
            spermStored: 0
        };

        try {
            const cryoResult = await db.query(
                `SELECT 
                    specimen_type,
                    SUM(number_of_specimens) as count
                 FROM cryopreservation 
                 WHERE clinic_id = $1 AND status = 'stored'
                 GROUP BY specimen_type`,
                [clinicId]
            );

            let total = 0;
            for (const row of cryoResult.rows) {
                total += parseInt(row.count) || 0;
                if (row.specimen_type === 'embryo') cryoStats.embryosStored = parseInt(row.count);
                if (row.specimen_type === 'egg') cryoStats.eggsStored = parseInt(row.count);
                if (row.specimen_type === 'sperm') cryoStats.spermStored = parseInt(row.count);
            }
            cryoStats.totalStoredSpecimens = total;
        } catch (err) {
            console.log('Cryo tables not available:', err.message);
        }

        // Calculate success rates
        const totalCycles = parseInt(cycleStats.rows[0].total_cycles) || 0;
        const successfulCycles = parseInt(cycleStats.rows[0].successful_cycles) || 0;
        const successRate = totalCycles > 0 ? ((successfulCycles / totalCycles) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                clinic: {
                    id: clinic.id,
                    name: clinic.clinic_name,
                    subdomain: clinic.subdomain,
                    email: clinic.email,
                    phone: clinic.phone,
                    city: clinic.city,
                    memberSince: clinic.created_at
                },
                subscription: {
                    plan: clinic.subscription_plan,
                    status: clinic.subscription_status,
                    startsAt: clinic.subscription_starts_at,
                    endsAt: clinic.subscription_ends_at,
                    daysRemaining: clinic.subscription_ends_at 
                        ? Math.ceil((new Date(clinic.subscription_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
                        : null
                },
                patients: {
                    total: parseInt(patientStats.rows[0].total_patients) || 0,
                    active: parseInt(patientStats.rows[0].active_patients) || 0,
                    newThisPeriod: parseInt(patientStats.rows[0].new_patients_period) || 0
                },
                cycles: {
                    total: totalCycles,
                    active: parseInt(cycleStats.rows[0].active_cycles) || 0,
                    completed: parseInt(cycleStats.rows[0].completed_cycles) || 0,
                    successful: successfulCycles,
                    newThisPeriod: parseInt(cycleStats.rows[0].new_cycles_period) || 0,
                    successRate: parseFloat(successRate)
                },
                users: {
                    total: parseInt(userStats.rows[0].total_users) || 0,
                    active: parseInt(userStats.rows[0].active_users) || 0,
                    admins: parseInt(userStats.rows[0].admin_users) || 0,
                    clinicalStaff: parseInt(userStats.rows[0].clinical_staff) || 0,
                    activeLastWeek: parseInt(userStats.rows[0].users_active_last_week) || 0
                },
                financial: financialSummary,
                lab: labStats,
                cryopreservation: cryoStats,
                recentActivity: recentActivity.rows,
                period
            }
        });

    } catch (error) {
        console.error('Get clinic overview error:', error);
        res.status(500).json({ success: false, error: 'Error fetching clinic overview' });
    }
};

/**
 * Get usage statistics for the clinic
 */
const getUsageStatistics = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const monthsParam = req.query.months;
        
        // Validate and sanitize months parameter (only allow 1-24)
        const months = Math.min(Math.max(parseInt(monthsParam) || 6, 1), 24);

        // Get monthly patient registrations
        const patientTrend = await db.query(
            `SELECT 
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as count
             FROM patients 
             WHERE clinic_id = $1 
                AND created_at >= CURRENT_DATE - ($2 || ' months')::INTERVAL
             GROUP BY DATE_TRUNC('month', created_at)
             ORDER BY month`,
            [clinicId, months.toString()]
        );

        // Get monthly cycle starts
        const cycleTrend = await db.query(
            `SELECT 
                DATE_TRUNC('month', start_date) as month,
                COUNT(*) as count,
                COUNT(CASE WHEN cycle_outcome = 'positive' THEN 1 END) as successful
             FROM ivf_cycles 
             WHERE clinic_id = $1 
                AND start_date >= CURRENT_DATE - ($2 || ' months')::INTERVAL
             GROUP BY DATE_TRUNC('month', start_date)
             ORDER BY month`,
            [clinicId, months.toString()]
        );

        // Get user activity (logins per day - last 30 days)
        const userActivity = await db.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as logins
             FROM audit_logs 
             WHERE clinic_id = $1 
                AND action = 'USER_LOGIN'
                AND created_at >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY DATE(created_at)
             ORDER BY date`,
            [clinicId]
        );

        // Get module usage
        const moduleUsage = await db.query(
            `SELECT 
                table_name as module,
                COUNT(*) as actions
             FROM audit_logs 
             WHERE clinic_id = $1 
                AND created_at >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY table_name
             ORDER BY actions DESC
             LIMIT 10`,
            [clinicId]
        );

        // Get top users by activity
        const topUsers = await db.query(
            `SELECT 
                u.full_name,
                u.role,
                COUNT(a.id) as actions
             FROM audit_logs a
             JOIN users u ON a.user_id = u.id
             WHERE a.clinic_id = $1 
                AND a.created_at >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY u.id, u.full_name, u.role
             ORDER BY actions DESC
             LIMIT 5`,
            [clinicId]
        );

        res.json({
            success: true,
            data: {
                patientTrend: patientTrend.rows,
                cycleTrend: cycleTrend.rows,
                userActivity: userActivity.rows,
                moduleUsage: moduleUsage.rows,
                topUsers: topUsers.rows
            }
        });

    } catch (error) {
        console.error('Get usage statistics error:', error);
        res.status(500).json({ success: false, error: 'Error fetching usage statistics' });
    }
};

/**
 * Get all available roles for user management
 */
const getAvailableRoles = async (req, res) => {
    try {
        const { getAllRoles } = require('../config/roles.config');
        const roles = getAllRoles();

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        console.error('Get available roles error:', error);
        res.status(500).json({ success: false, error: 'Error fetching roles' });
    }
};

/**
 * Get user's permissions for the current session
 */
const getUserPermissions = async (req, res) => {
    try {
        const { ROLE_PERMISSIONS, getModulesForRole } = require('../config/roles.config');
        const userRole = req.user.role;
        
        const roleConfig = ROLE_PERMISSIONS[userRole];
        if (!roleConfig) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user role' 
            });
        }

        res.json({
            success: true,
            data: {
                role: userRole,
                displayName: roleConfig.displayName,
                description: roleConfig.description,
                modules: getModulesForRole(userRole)
            }
        });
    } catch (error) {
        console.error('Get user permissions error:', error);
        res.status(500).json({ success: false, error: 'Error fetching permissions' });
    }
};

module.exports = {
    getClinicOverview,
    getUsageStatistics,
    getAvailableRoles,
    getUserPermissions
};

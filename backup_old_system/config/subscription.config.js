/**
 * FertilityOS Subscription Plans Configuration
 * Defines available subscription tiers, pricing, and included modules
 */

const subscriptionPlans = {
    basic: {
        name: 'Basic',
        description: 'Essential features for small clinics',
        price: 99,
        currency: 'USD',
        modules: [
            'Patient Management',
            'Basic Scheduling',
            'Document Storage (5GB)',
            'Email Support'
        ],
        billingCycle: 'monthly',
        maxUsers: 5,
        maxPatients: 100,
        tiers: [
            { 
                name: 'Core Features', 
                features: ['Patient Registration', 'Appointment Booking', 'Basic Reports'] 
            }
        ]
    },
    standard: {
        name: 'Standard',
        description: 'Comprehensive features for growing clinics',
        price: 249,
        currency: 'USD',
        modules: [
            'Patient Management',
            'Advanced Scheduling',
            'IVF Cycle Tracking',
            'Lab Management',
            'Document Storage (25GB)',
            'Email & Phone Support',
            'Basic Analytics'
        ],
        billingCycle: 'monthly',
        maxUsers: 15,
        maxPatients: 500,
        tiers: [
            { 
                name: 'Core Features', 
                features: ['Patient Registration', 'Appointment Booking', 'Basic Reports'] 
            },
            { 
                name: 'Clinical Features', 
                features: ['IVF Cycle Management', 'Embryo Tracking', 'Lab Results', 'Medication Management'] 
            }
        ]
    },
    premium: {
        name: 'Premium',
        description: 'Full-featured solution for established fertility centers',
        price: 499,
        currency: 'USD',
        modules: [
            'Patient Management',
            'Advanced Scheduling',
            'IVF Cycle Tracking',
            'Lab Management',
            'Embryo Tracking',
            'Financial Management',
            'Inventory Management',
            'Document Storage (100GB)',
            'Priority Support',
            'Advanced Analytics',
            'Custom Reports',
            'API Access'
        ],
        billingCycle: 'monthly',
        maxUsers: -1, // Unlimited
        maxPatients: -1, // Unlimited
        tiers: [
            { 
                name: 'Core Features', 
                features: ['Patient Registration', 'Appointment Booking', 'Basic Reports'] 
            },
            { 
                name: 'Clinical Features', 
                features: ['IVF Cycle Management', 'Embryo Tracking', 'Lab Results', 'Medication Management'] 
            },
            { 
                name: 'Business Features', 
                features: ['Financial Reports', 'Revenue Analytics', 'Inventory Control', 'Custom Integrations'] 
            }
        ]
    },
    enterprise: {
        name: 'Enterprise',
        description: 'Custom solution for multi-location fertility networks',
        price: null, // Contact for pricing
        currency: 'USD',
        modules: [
            'All Premium Features',
            'Multi-location Support',
            'White-label Option',
            'Dedicated Account Manager',
            'Custom Development',
            'SLA Guarantee',
            'On-premise Option',
            'Compliance Support',
            'Training & Onboarding'
        ],
        billingCycle: 'yearly',
        maxUsers: -1,
        maxPatients: -1,
        tiers: [
            { 
                name: 'Everything in Premium', 
                features: ['All Premium Features'] 
            },
            { 
                name: 'Enterprise Features', 
                features: ['Multi-clinic Dashboard', 'Centralized Reporting', 'Role-based Access', 'Audit Trails'] 
            }
        ]
    }
};

module.exports = subscriptionPlans;
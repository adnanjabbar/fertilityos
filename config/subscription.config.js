const subscriptionPlans = {
    basic: {
        price: 10,
        modules: ['Basic Support', 'Access to Documentation'],
        billingCycle: 'monthly',
        tiers: [
            { name: 'Basic Tier', features: ['Feature A', 'Feature B'] }
        ]
    },
    standard: {
        price: 25,
        modules: ['Standard Support', 'Access to Documentation', 'Community Forum'],
        billingCycle: 'monthly',
        tiers: [
            { name: 'Standard Tier', features: ['Feature A', 'Feature B', 'Feature C'] },
            { name: 'Advanced Tier', features: ['Feature D'] }
        ]
    },
    premium: {
        price: 50,
        modules: ['Premium Support', 'Access to Documentation', '1-on-1 Consultation'],
        billingCycle: 'quarterly',
        tiers: [
            { name: 'Premium Tier', features: ['Feature A', 'Feature B', 'Feature C', 'Feature D'] }
        ]
    }
};

module.exports = subscriptionPlans;
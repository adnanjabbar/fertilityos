// subscriptionConfig.js

const subscriptionPlans = [
    {
        id: 'basic',
        name: 'Basic Plan',
        modules: ['module1', 'module2'],
        billingCycles: ['monthly', 'yearly'],
        price: {
            monthly: 10,
            yearly: 100
        }
    },
    {
        id: 'premium',
        name: 'Premium Plan',
        modules: ['module1', 'module2', 'module3'],
        billingCycles: ['monthly', 'yearly'],
        price: {
            monthly: 20,
            yearly: 200
        }
    },
    {
        id: 'enterprise',
        name: 'Enterprise Plan',
        modules: ['module1', 'module2', 'module3', 'module4'],
        billingCycles: ['monthly', 'yearly'],
        price: {
            monthly: 30,
            yearly: 300
        }
    }
];

const paymentConstants = {
    taxRate: 0.2,
    currency: 'USD',
    paymentGateway: 'Stripe',
};

module.exports = {
    subscriptionPlans,
    paymentConstants
};
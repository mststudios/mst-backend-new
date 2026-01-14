// This file centralizes the pricing logic.
// It SHOULD match the frontend constants.tsx for validation.

const PRICING_RULES = {
    // Step 1: Goals (0 kr)
    goals: {
        leads: { price: 0, monthly: 0 },
        brand: { price: 0, monthly: 0 },
        sales: { price: 0, monthly: 0 } // "sales" ID confirmed from constants.tsx
    },
    // Step 2: Website Type
    type: {
        simple: { price: 7000, monthly: 0 },
        showcase: { price: 8000, monthly: 0 },
        ecommerce: { price: 10000, monthly: 0 }
    },
    // Step 3: Services
    services: {
        seo: { price: 2000, monthly: 0 },
        maintenance: { price: 0, monthly: 500 },
        hosting: { price: 0, monthly: 0 }
    }
};

/**
 * Calculates the total one-time price and monthly price based on selections.
 * @param {Object} selections - The user's selections { stepId: 'optionId' | ['opt1', 'opt2'] }
 * @returns {Object} { totalPrice, monthlyPrice, breakdown }
 */
function calculatePrice(selections) {
    let totalPrice = 0;
    let monthlyPrice = 0;
    const breakdown = [];

    // Iterate through our knowledge base of steps
    for (const [stepId, optionsMap] of Object.entries(PRICING_RULES)) {
        const userSelection = selections[stepId];

        if (!userSelection) continue;

        // Normalize to array (handle multi-select vs single select strings)
        const selectedIds = Array.isArray(userSelection) ? userSelection : [userSelection];

        selectedIds.forEach(id => {
            const rule = optionsMap[id];
            if (rule) {
                totalPrice += rule.price;
                monthlyPrice += rule.monthly;
                breakdown.push({
                    step: stepId,
                    option: id,
                    price: rule.price,
                    monthly: rule.monthly
                });
            }
        });
    }

    return { totalPrice, monthlyPrice, breakdown };
}

module.exports = { calculatePrice, PRICING_RULES };

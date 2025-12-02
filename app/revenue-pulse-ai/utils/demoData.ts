import { Transaction } from '../types';

export const generateDemoData = (): Transaction[] => {
  const data: Transaction[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 2); // 2 years of data

  // State to track active customers so we can generate realistic churn/expansion
  // Map<CustomerId, CurrentMRR>
  const activeCustomers = new Map<string, number>();
  
  // Simulate daily transactions over 730 days
  for (let d = 0; d < 730; d++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + d);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // 1. New Business (Acquisition)
    // Chance of new customers each day
    if (Math.random() > 0.6) {
        const count = Math.ceil(Math.random() * 3); // 1-3 new customers
        for(let k=0; k<count; k++) {
            const newId = `CUST-${d}-${k}`;
            const amount = 500 + Math.floor(Math.random() * 2000); // €500 - €2500
            
            data.push({
                id: `new-${d}-${k}`,
                date: dateStr,
                amount: amount,
                type: 'new',
                customerId: newId
            });
            activeCustomers.set(newId, amount);
        }
    }

    // Operations on existing customers
    const customerIds = Array.from(activeCustomers.keys());
    
    if (customerIds.length > 0) {
        // 2. Expansion (Upsell)
        // Small chance for existing customers to upgrade
        if (Math.random() > 0.90) {
            const targetId = customerIds[Math.floor(Math.random() * customerIds.length)];
            const currentAmount = activeCustomers.get(targetId) || 0;
            const expansionAmount = 200 + Math.floor(Math.random() * 500);

            data.push({
                id: `exp-${d}`,
                date: dateStr,
                amount: expansionAmount,
                type: 'expansion',
                customerId: targetId
            });
            activeCustomers.set(targetId, currentAmount + expansionAmount);
        }

        // 3. Contraction (Downgrade)
        if (Math.random() > 0.98) {
            const targetId = customerIds[Math.floor(Math.random() * customerIds.length)];
            const currentAmount = activeCustomers.get(targetId) || 0;
            // Can't contract more than current value
            const contractionAmount = Math.min(currentAmount, 100 + Math.floor(Math.random() * 400));
            
            if (currentAmount > contractionAmount) {
                data.push({
                    id: `contr-${d}`,
                    date: dateStr,
                    amount: contractionAmount,
                    type: 'contraction',
                    customerId: targetId
                });
                activeCustomers.set(targetId, currentAmount - contractionAmount);
            }
        }

        // 4. Churn (Cancellation)
        // ~0.5% daily churn chance implies high annual churn, adjusted to be realistic
        if (customerIds.length > 20 && Math.random() > 0.99) {
             const targetId = customerIds[Math.floor(Math.random() * customerIds.length)];
             const lostAmount = activeCustomers.get(targetId) || 0;

             data.push({
                id: `churn-${d}`,
                date: dateStr,
                amount: lostAmount,
                type: 'churn',
                customerId: targetId
            });
            activeCustomers.delete(targetId);
        }
    }
  }
  
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
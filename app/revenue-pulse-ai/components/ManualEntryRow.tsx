import React, { useState } from 'react';
import { Calculator, Save, Users, Coins, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface ManualMetric {
  id: string;
  value: number;
  trend: number;
}

interface ManualEntryRowProps {
  onUpdate: (metrics: ManualMetric[]) => void;
  initialValues: any;
}

export const ManualEntryRow: React.FC<ManualEntryRowProps> = ({ onUpdate }) => {
  const [step, setStep] = useState(1);
  
  const [inputs, setInputs] = useState({
    // Step 1: Customers
    startCustomers: 100,
    lostCustomers: 2,
    
    // Step 2: Start Revenue
    startMRR: 50000,
    
    // Step 3: Mutations
    newMRR: 2500,
    expansionMRR: 1000,
    contractionMRR: 500,
    churnMRR: 800, 
  });

  const handleChange = (field: keyof typeof inputs, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const calculateAndSubmit = () => {
    const { 
        startCustomers, lostCustomers,
        startMRR, newMRR, expansionMRR, contractionMRR, churnMRR 
    } = inputs;

    // Calculations
    const endMRR = startMRR + newMRR + expansionMRR - contractionMRR - churnMRR;
    const mrrTrend = startMRR > 0 ? ((endMRR - startMRR) / startMRR) * 100 : 0;
    const arrValue = endMRR * 12;
    const arrTrend = mrrTrend;
    const churnRate = startCustomers > 0 ? (lostCustomers / startCustomers) * 100 : 0;
    const churnTrend = 0; 
    const retainedRevenue = startMRR + expansionMRR - contractionMRR - churnMRR;
    const nrrValue = startMRR > 0 ? (retainedRevenue / startMRR) * 100 : 0;
    const nrrTrend = 0; 

    const metrics: ManualMetric[] = [
      { id: 'mrr', value: endMRR, trend: mrrTrend },
      { id: 'arr', value: arrValue, trend: arrTrend },
      { id: 'churn', value: churnRate, trend: churnTrend },
      { id: 'nrr', value: nrrValue, trend: nrrTrend },
    ];
    
    onUpdate(metrics);
  };

  // Trigger calculation whenever inputs change (real-time dashboard update)
  React.useEffect(() => {
      calculateAndSubmit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs]);

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // --- Step Renderers ---

  const renderStepIndicator = () => (
      <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border-2 transition-colors ${
                      step === num 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : step > num 
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-white text-slate-400 border-slate-200'
                  }`}>
                      {step > num ? <CheckCircle size={14} /> : num}
                  </div>
                  {num < 3 && (
                      <div className={`w-16 h-1 mx-2 rounded transition-colors ${step > num ? 'bg-green-500' : 'bg-slate-100'}`} />
                  )}
              </React.Fragment>
          ))}
      </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Calculator Wizard</h3>
          <p className="text-sm text-slate-500">Vul de gegevens in 3 stappen in.</p>
      </div>

      {renderStepIndicator()}

      <div className="max-w-2xl mx-auto min-h-[200px]">
        
        {/* STEP 1: Klanten */}
        {step === 1 && (
             <div className="animate-fadeIn">
                <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Users className="text-indigo-600" size={20} /> Stap 1: Klanten & Churn
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Aantal klanten (start)</label>
                        <input 
                            type="number" 
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={inputs.startCustomers}
                            onChange={(e) => handleChange('startCustomers', e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2 text-red-600">Aantal klanten vertrokken</label>
                        <input 
                            type="number" 
                            className="w-full px-4 py-2 border border-red-200 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            value={inputs.lostCustomers}
                            onChange={(e) => handleChange('lostCustomers', e.target.value)}
                        />
                     </div>
                </div>
                <div className="mt-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-600 flex justify-between items-center">
                    <span>Voorlopige Churn Rate:</span>
                    <span className="font-bold text-slate-900">
                        {(inputs.startCustomers > 0 ? (inputs.lostCustomers / inputs.startCustomers) * 100 : 0).toFixed(1)}%
                    </span>
                </div>
             </div>
        )}

        {/* STEP 2: Start Omzet */}
        {step === 2 && (
            <div className="animate-fadeIn">
                <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Coins className="text-indigo-600" size={20} /> Stap 2: Start Situatie
                </h4>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">MRR aan begin van de maand (Start MRR)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5 text-slate-400">€</span>
                        <input 
                            type="number" 
                            className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                            value={inputs.startMRR}
                            onChange={(e) => handleChange('startMRR', e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Dit is de terugkerende omzet uit abonnementen die je al had op dag 1.</p>
                </div>
            </div>
        )}

        {/* STEP 3: Mutaties */}
        {step === 3 && (
            <div className="animate-fadeIn">
                <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Calculator className="text-indigo-600" size={20} /> Stap 3: Omzet Mutaties
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-green-600 uppercase mb-1">Nieuwe Business (+)</label>
                        <input 
                            type="number" 
                            className="w-full px-3 py-2 border border-green-200 bg-green-50/30 rounded focus:ring-green-500 outline-none"
                            value={inputs.newMRR}
                            onChange={(e) => handleChange('newMRR', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-green-600 uppercase mb-1">Expansie / Upsell (+)</label>
                        <input 
                            type="number" 
                            className="w-full px-3 py-2 border border-green-200 bg-green-50/30 rounded focus:ring-green-500 outline-none"
                            value={inputs.expansionMRR}
                            onChange={(e) => handleChange('expansionMRR', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-orange-600 uppercase mb-1">Downgrade / Krimp (-)</label>
                        <input 
                            type="number" 
                            className="w-full px-3 py-2 border border-orange-200 bg-orange-50/30 rounded focus:ring-orange-500 outline-none"
                            value={inputs.contractionMRR}
                            onChange={(e) => handleChange('contractionMRR', e.target.value)}
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-red-600 uppercase mb-1">Churn / Vertrek (-)</label>
                        <input 
                            type="number" 
                            className="w-full px-3 py-2 border border-red-200 bg-red-50/30 rounded focus:ring-red-500 outline-none"
                            value={inputs.churnMRR}
                            onChange={(e) => handleChange('churnMRR', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 border-t border-slate-100 pt-6">
          <Button 
            variant="ghost" 
            onClick={prevStep} 
            disabled={step === 1}
            icon={<ArrowLeft size={16} />}
          >
            Vorige
          </Button>
          
          {step < 3 ? (
            <Button 
                variant="primary" 
                onClick={nextStep}
            >
                Volgende <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button 
                variant="primary" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => { /* Logic is already handled via effect, this just gives feedback */ }}
            >
                <CheckCircle size={16} className="mr-2" /> Dashboard is Bijgewerkt
            </Button>
          )}
      </div>
    </div>
  );
};
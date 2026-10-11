import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import Dashboard from './pages/Dashboard';
import PriceForecast from './pages/PriceForecast';
import DemandForecast from './pages/DemandForecast';
import ExplainableAI from './pages/ExplainableAI';
import RiskAnalysis from './pages/RiskAnalysis';
import Recommendations from './pages/Recommendations';
import ModelPerformance from './pages/ModelPerformance';
import About from './pages/About';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const pageTitles = {
    overview: {
      title: 'Agricultural Intelligence & Executive Overview',
      subtitle: 'Real-time telemetry from trained LSTM and XGBoost models'
    },
    price: {
      title: 'Commodity Price Forecasting (LSTM)',
      subtitle: 'Deep recurrent sequence prediction across AGMARKNET APMC mandis'
    },
    demand: {
      title: 'Destination Demand Forecasting (XGBoost)',
      subtitle: 'Standardized 20-feature gradient-boosted demand absorption index'
    },
    explainability: {
      title: 'Explainable AI & SHAP Attributions',
      subtitle: 'Cooperative game-theoretic feature and temporal memory decomposition'
    },
    risk: {
      title: 'Risk Analysis & Volatility Gauge',
      subtitle: 'Multi-factor normalized risk scoring for agricultural price movements'
    },
    recommendations: {
      title: 'Smart Decision Support System',
      subtitle: 'Deterministic SELL / STORE / WAIT policies with storage arbitrage economics'
    },
    performance: {
      title: 'Model Performance & Research Evaluation',
      subtitle: 'Authentic empirical test set metrics (RMSE, MAE, R², MAPE)'
    },
    about: {
      title: 'About AgriSense Architecture',
      subtitle: 'M.Tech final-year research framework and technical specifications'
    }
  };

  const [commodity, setCommodity] = useState('Onion');
  const [state, setState] = useState('Maharashtra');
  const [market, setMarket] = useState('All Markets (State Avg)');

  const currentInfo = pageTitles[activeTab] || pageTitles.overview;

  return (
    <div className="flex min-h-screen bg-[#F8FAF7]">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={currentInfo.title} 
          subtitle={currentInfo.subtitle}
          commodity={commodity}
          state={state}
          market={market}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <Dashboard 
              setActiveTab={setActiveTab} 
              sharedCommodity={commodity}
              sharedState={state}
              onContextChange={(c, s, m) => {
                if (c) setCommodity(c);
                if (s) setState(s);
                if (m) setMarket(m);
              }}
            />
          )}
          {activeTab === 'price' && (
            <PriceForecast 
              setActiveTab={setActiveTab}
              sharedCommodity={commodity}
              sharedState={state}
              sharedMarket={market}
              onContextChange={(c, s, m) => {
                if (c) setCommodity(c);
                if (s) setState(s);
                if (m) setMarket(m);
              }}
            />
          )}
          {activeTab === 'demand' && (
            <DemandForecast 
              setActiveTab={setActiveTab} 
              sharedCommodity={commodity}
              sharedState={state}
              sharedMarket={market}
            />
          )}
          {activeTab === 'explainability' && (
            <ExplainableAI 
              sharedCommodity={commodity}
              sharedState={state}
              sharedMarket={market}
            />
          )}
          {activeTab === 'risk' && (
            <RiskAnalysis 
              sharedCommodity={commodity}
              sharedState={state}
              sharedMarket={market}
              onContextChange={(c, s, m) => {
                if (c) setCommodity(c);
                if (s) setState(s);
                if (m) setMarket(m);
              }}
            />
          )}
          {activeTab === 'recommendations' && (
            <Recommendations 
              sharedCommodity={commodity}
              sharedState={state}
              sharedMarket={market}
              onContextChange={(c, s, m) => {
                if (c) setCommodity(c);
                if (s) setState(s);
                if (m) setMarket(m);
              }}
            />
          )}
          {activeTab === 'performance' && <ModelPerformance />}
          {activeTab === 'about' && <About />}
        </main>
      </div>
    </div>
  );
}

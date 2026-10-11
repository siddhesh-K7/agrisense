import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => (await api.get('/health')).data;

// Commodities & Hierarchy
export const getCommodities = async () => (await api.get('/commodities')).data;
export const getFullHierarchy = async () => (await api.get('/commodities/hierarchy')).data;
export const getCommodityStates = async (commodity) => (await api.get('/commodities/states', { params: { commodity } })).data;
export const getCommodityMarkets = async (commodity, state) => (await api.get('/commodities/markets', { params: { commodity, state } })).data;

// Price LSTM APIs
export const predictPrice = async (data) => (await api.post('/price/predict', data)).data;
export const getPriceHistory = async (params) => (await api.get('/price/history', { params })).data;
export const getPriceMarkets = async () => (await api.get('/price/markets')).data;

// Demand XGBoost APIs
export const predictDemand = async (data) => (await api.post('/demand/predict', data)).data;
export const getDemandHistory = async (params) => (await api.get('/demand/history', { params })).data;

// Explainability APIs
export const getPriceGlobalSHAP = async () => (await api.get('/explainability/price/global')).data;
export const getPriceLocalSHAP = async (data) => (await api.post('/explainability/price/local', data)).data;
export const getDemandGlobalSHAP = async () => (await api.get('/explainability/demand/global')).data;
export const getDemandLocalSHAP = async (data) => (await api.post('/explainability/demand/local', data)).data;

// Risk & Recommendations
export const analyzeRisk = async (data) => (await api.post('/risk/analyze', data)).data;
export const generateRecommendation = async (data) => (await api.post('/recommendations/generate', data)).data;

// Model Evaluation
export const getPriceMetrics = async () => (await api.get('/metrics/price')).data;
export const getDemandMetrics = async () => (await api.get('/metrics/demand')).data;

export default api;

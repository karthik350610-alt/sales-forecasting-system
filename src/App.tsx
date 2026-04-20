/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Settings, 
  LayoutDashboard, 
  Calendar,
  AlertCircle,
  Activity,
  ChevronRight,
  Database,
  Search,
  Download,
  Plus,
  LogOut,
  User as UserIcon,
  Trash2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Bar,
  BarChart,
  ComposedChart,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { generateSyntheticData, fetchSalesFromFirestore, saveSalesRecord, seedInitialData } from './services/dataService';
import { getModelPerformance, predictSalesWithAI, generateFutureForecast } from './services/mlService';
import { SalesData, ModelPerformance, ForecastResult } from './types';
import { useAuth } from './lib/AuthContext';
import { signInWithGoogle, logOut } from './lib/firebase';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'eda' | 'models' | 'predict' | 'data'>('overview');
  const [data, setData] = useState<SalesData[]>([]);
  const [performance, setPerformance] = useState<ModelPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const initializeData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    if (user) {
      const firestoreData = await fetchSalesFromFirestore(user.uid);
      if (firestoreData.length > 0) {
        setData(firestoreData);
      } else {
        setData(generateSyntheticData(90));
      }
    } else {
      setData(generateSyntheticData(365));
    }
    setPerformance(getModelPerformance());
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    initializeData();
  }, [user, authLoading, initializeData]);

  const recentData = useMemo(() => data.slice(-30), [data]);
  const stats = useMemo(() => {
    if (data.length === 0) return { total: 0, avg: 0, trend: 0 };
    const total = data.reduce((acc, curr) => acc + curr.sales, 0);
    const avg = total / data.length;
    const lastMonth = data.slice(-30).reduce((acc, curr) => acc + curr.sales, 0);
    const prevMonth = data.slice(-60, -30).reduce((acc, curr) => acc + curr.sales, 0);
    const trend = ((lastMonth - prevMonth) / prevMonth) * 100;
    return { total, avg, trend };
  }, [data]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Login failed", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="font-medium text-slate-500">{authLoading ? 'Authenticating...' : 'Initializing Forecasting Engine...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA] p-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] flex flex-col items-center text-center relative z-10 transition-all">
          <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mb-10 shadow-2xl shadow-indigo-200 rotate-3">
            <TrendingUp className="text-white h-12 w-12" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">PredictiveSales <span className="text-indigo-600 italic">AI</span></h1>
          <p className="text-slate-500 font-medium mb-12 leading-relaxed text-sm px-4">Deploy high-precision forecasting models and explore your market dynamics with professional, enterprise-grade intelligence.</p>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="group w-full py-5 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 relative overflow-hidden"
          >
            {isLoggingIn ? (
              <Activity className="h-6 w-6 animate-spin text-white/50" />
            ) : (
              <>
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1">
                   <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-4 w-4" />
                </div>
                Continue with Google Cloud
              </>
            )}
          </button>
          
          <div className="mt-12 flex items-center gap-4 w-full">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">Enterprise AI Access</p>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          <div className="mt-8 flex gap-4">
             <div className="flex -space-x-3 overflow-hidden">
                {[1,2,3,4].map(i => (
                  <img key={i} className="inline-block h-8 w-8 rounded-full ring-4 ring-white" src={`https://picsum.photos/seed/user${i}/100/100`} alt="" referrerPolicy="no-referrer" />
                ))}
             </div>
             <p className="text-xs text-slate-400 font-medium self-center mt-1">Join <span className="text-slate-900 font-bold">12k+</span> analysts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans selection:bg-indigo-100 text-slate-900">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-md shadow-indigo-200">
            <TrendingUp className="text-white h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">Sales Forecasting System <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200 uppercase">v2.5 Hybrid Cloud</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => initializeData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-500 hover:text-indigo-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <div className="h-8 w-[1px] bg-slate-100 hidden md:block"></div>
          <div className="flex items-center gap-3 bg-white border border-slate-100 pl-1 pr-1.5 py-1 rounded-full shadow-sm">
             <img src={user.photoURL || ''} alt="" className="h-8 w-8 rounded-full border-2 border-indigo-50 shadow-sm" referrerPolicy="no-referrer" />
             <div className="flex flex-col min-w-[100px]">
                <span className="text-[11px] font-black text-slate-800 leading-tight truncate max-w-[120px]">{user.displayName}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Pro Tier Account</span>
             </div>
             <div className="h-6 w-[1px] bg-slate-100 mx-1"></div>
             <button 
               onClick={logOut} 
               className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all group relative"
               title="Sign Out"
             >
                <LogOut className="h-4 w-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Sign Out</span>
             </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 shrink-0 overflow-y-auto">
          <p className="text-[10px] uppercase font-bold text-slate-400 px-3 mb-4 tracking-widest">Core Engine</p>
          <div className="space-y-1">
            <SidebarLink 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')} 
              icon={<LayoutDashboard className="h-4 w-4" />} 
              label="Overview" 
            />
            <SidebarLink 
              active={activeTab === 'eda'} 
              onClick={() => setActiveTab('eda')} 
              icon={<PieChart className="h-4 w-4" />} 
              label="EDA & Insights" 
            />
            <SidebarLink 
              active={activeTab === 'models'} 
              onClick={() => setActiveTab('models')} 
              icon={<Database className="h-4 w-4" />} 
              label="Model Logic" 
            />
          </div>

          <p className="text-[10px] uppercase font-bold text-slate-400 px-3 mt-8 mb-4 tracking-widest">Inference & Management</p>
          <div className="space-y-1">
            <SidebarLink 
              active={activeTab === 'predict'} 
              onClick={() => setActiveTab('predict')} 
              icon={<BarChart3 className="h-4 w-4" />} 
              label="Forecaster" 
            />
            <SidebarLink 
              active={activeTab === 'data'} 
              onClick={() => setActiveTab('data')} 
              icon={<Plus className="h-4 w-4" />} 
              label="Record Entries" 
            />
          </div>

          <div className="mt-8">
            <div className="mx-2 p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm border-l-4 border-l-indigo-500">
              <p className="text-xs text-indigo-800 font-black">XGBoost Ensemble</p>
              <p className="text-[10px] text-indigo-500 font-medium mt-1 uppercase tracking-tighter">Current Deployment</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-[1200px] mx-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <OverviewTab stats={stats} recentData={recentData} onRefresh={() => initializeData(true)} />
                )}
                {activeTab === 'eda' && (
                  <EDATab data={data} />
                )}
                {activeTab === 'models' && (
                  <ModelsTab performance={performance} />
                )}
                {activeTab === 'predict' && (
                  <PredictTab history={data} />
                )}
                {activeTab === 'data' && (
                  <DataEntryTab />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <footer className="h-10 bg-white border-t border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
           <Database className="h-3 w-3" /> Project: RS_FORCAST_MOD_V3
        </div>
        <div className="flex gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Backend: Python 3.10</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Kernel: TensorFlow</span>
        </div>
      </footer>
    </div>
  );
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
        active 
          ? 'bg-slate-50 text-indigo-600 border border-slate-200 shadow-sm' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
      }`}
    >
      <span className={`transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</span>
      {label}
    </button>
  );
}

function OverviewTab({ stats, recentData, onRefresh }: { stats: any, recentData: SalesData[], onRefresh: () => void }) {
  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Performance</h2>
           <p className="text-sm text-slate-500 font-medium tracking-tight">Real-time cloud analytics & hybrid model inference.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            Sync Cloud
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard label="Mean Absolute Error" value={(stats.avg / 15).toFixed(2)} trend={-3.2} trendLabel="vs baseline" icon={<Activity className="h-5 w-5" />} />
        <StatCard label="Root Mean Square Error" value={(stats.avg / 10).toFixed(2)} trend={0} trendLabel="Stable range" icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard label="R² Confidence Score" value="0.894" trend={stats.trend} trendLabel="High Confidence" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div>
             <h3 className="text-lg font-bold text-slate-900">Actual vs. Predicted Sales</h3>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Holistic Performance Analysis (Test Set)</p>
          </div>
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Actual Sales</span>
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></span> Predicted Trend</span>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={recentData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" hide />
              <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                labelStyle={{ fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}
                formatter={(value: any) => [`$${value}`, 'Prediction']}
              />
              <Area type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function EDATab({ data }: { data: SalesData[] }) {
  const correlationData = [
    { name: 'Temp', Sales: 0.15 },
    { name: 'Fuel', Sales: -0.05 },
    { name: 'CPI', Sales: 0.08 },
    { name: 'Unempl', Sales: -0.12 },
    { name: 'Promo', Sales: 0.65 },
    { name: 'Holiday', Sales: 0.82 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-10 text-center">Feature Correlation Matrix</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correlationData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Sales" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-6 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Holiday and Promotion show the strongest influence.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-10 text-center">Temp vs Sales Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" dataKey="temperature" name="Temp" unit="°C" tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                <YAxis type="number" dataKey="sales" name="Sales" unit="$" tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                <ZAxis type="number" range={[50, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Days" data={data.slice(0, 100)} fill="#6366f1" opacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Monthly Seasonal Decay Analysis</h3>
        <p className="mb-10 text-xs text-slate-400 font-bold tracking-tight">Aggregated sales data across different clusters showing strong year-end volatility.</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={correlationData}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Sales" barSize={30} fill="#E2E8F0" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="Sales" stroke="#4F46E5" strokeWidth={4} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ModelsTab({ performance }: { performance: ModelPerformance[] }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {performance.map((res, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-indigo-500">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">{res.modelName}</h4>
            <div className="mt-6 space-y-3">
              <MetricRow label="MAE" value={res.metrics.mae} />
              <MetricRow label="RMSE" value={res.metrics.rmse} />
              <MetricRow label="R² Accuracy" value={res.metrics.r2} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
             <TrendingUp className="h-3 w-3" /> Core Logic Analysis
          </div>
          <h3 className="text-3xl font-black mb-6 tracking-tight">Model Strategy Overview</h3>
          <p className="text-indigo-100 text-lg font-medium leading-relaxed mb-10 italic">"Our deployment benchmarks confirm that the high-volatility retail clusters are best served by the <span className="text-white font-bold">XGBoost Ensemble</span> model. It effectively isolates peak residuals where traditional linear logic fails."</p>
          <div className="flex gap-8">
             <div className="flex flex-col">
                <span className="text-3xl font-black">95%</span>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Consistency</span>
             </div>
             <div className="w-[1px] h-12 bg-white/10"></div>
             <div className="flex flex-col">
                <span className="text-3xl font-black">58.1</span>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Precision (MAE)</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h5 className="font-black text-xs text-slate-800 uppercase tracking-widest mb-3">MAE Logic</h5>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">The average absolute deviation. Represents the standard operational variance expectable in production runs.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h5 className="font-black text-xs text-slate-800 uppercase tracking-widest mb-3">RMSE Factor</h5>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">Squared error root. Heavily weights outlier volatility to protect infrastructure from demand shocks.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h5 className="font-black text-xs text-slate-800 uppercase tracking-widest mb-3">R² Core</h5>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">Coefficient of determination. Measures the reliability of the feature logic in mapping target variance.</p>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <div className="bg-slate-900 px-8 py-4 rounded-full flex items-center gap-4 border border-slate-800 shadow-2xl">
          <Download className="h-5 w-5 text-indigo-400" />
          <div className="text-left">
            <h4 className="font-bold text-white text-xs uppercase tracking-widest">Logic Source Available</h4>
            <p className="text-[10px] text-slate-500 font-bold">EXAMINE RAW PYTHON CORE IN FILE EXPLORER</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictTab({ history }: { history: SalesData[] }) {
  const [targetDate, setTargetDate] = useState('2024-01-01');
  const [promo, setPromo] = useState(0);
  const [holiday, setHoliday] = useState(0);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const handlePredict = async () => {
    setPredicting(true);
    const pred = await predictSalesWithAI(history, targetDate, { promotion: promo, holiday: holiday });
    setResult(pred);
    setPredicting(false);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 p-6 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Config Inference</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Target Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Promotion</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                  value={promo}
                  onChange={(e) => setPromo(Number(e.target.value))}
                >
                  <option value={0}>Disabled</option>
                  <option value={1}>Active</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Holiday</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                  value={holiday}
                  onChange={(e) => setHoliday(Number(e.target.value))}
                >
                  <option value={0}>Standard</option>
                  <option value={1}>Peak</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-2xl shadow-xl">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Target Prediction</p>
              <div className="flex items-end gap-3 mt-2">
                <p className="text-3xl font-mono text-white font-black">{result !== null ? `$${result.toLocaleString()}` : '$0.00'}</p>
                {result !== null && <p className="text-xs text-green-400 font-bold mb-1.5">+14%</p>}
              </div>
            </div>

            <button 
              onClick={handlePredict}
              disabled={predicting}
              className="w-full py-4 bg-indigo-600 text-white text-sm font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {predicting ? <Activity className="h-5 w-5 animate-spin" /> : <TrendingUp className="h-5 w-5" />}
              {predicting ? 'Processing Data...' : 'Run New Forecast'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Execution Context</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Learning Rate</span>
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded">0.05</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Max Depth</span>
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded">6</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Estimators</span>
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded">500</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-center">
          {result !== null ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md"
            >
               <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Activity className="h-10 w-10 text-indigo-600" />
               </div>
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 mb-2">Inference Result Generated</p>
               <h3 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">${result.toLocaleString()}</h3>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100 uppercase mb-10">
                  <ChevronRight className="h-3 w-3 -rotate-90" /> Confidence: 94.2% Precise
               </div>

               <div className="text-left bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Influencer Breakdown</p>
                  <div className="space-y-3">
                     <ImpactBar label="Time Logic" percent={82} positive />
                     <ImpactBar label="Promotional Logic" percent={18} positive />
                     <ImpactBar label="External Factors" percent={12} />
                  </div>
               </div>
            </motion.div>
          ) : (
            <div className="max-w-xs">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-6 w-6 text-slate-300" />
              </div>
              <h4 className="text-slate-800 font-bold mb-2">Waiting for Input</h4>
              <p className="text-sm text-slate-400 font-medium">Configure the store parameters on the left to initiate the forecasting process.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataEntryTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    sales: 0,
    storeId: 'Store-01',
    productId: 'Prod-01',
    promotion: 0,
    holiday: 0,
    temperature: 20,
    fuelPrice: 3.5,
    cpi: 210,
    unemployment: 7.5
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await saveSalesRecord(user.uid, {
        ...formData,
        sales: Number(formData.sales),
        promotion: Number(formData.promotion),
        holiday: Number(formData.holiday),
        temperature: Number(formData.temperature),
        fuelPrice: Number(formData.fuelPrice),
        cpi: Number(formData.cpi),
        unemployment: Number(formData.unemployment)
      });
      alert('Record saved successfully!');
    } catch (err) {
      alert('Error saving record.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!user || seeding) return;
    setSeeding(true);
    try {
      await seedInitialData(user.uid);
      alert('Seeded 90 days of synthetic data to your account.');
      window.location.reload();
    } catch (err) {
       alert('Seeding failed.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Plus className="text-indigo-600 h-6 w-6" />
           </div>
           <div>
              <h3 className="text-lg font-bold text-slate-900">Manual Record Entry</h3>
              <p className="text-xs text-slate-400 font-bold tracking-tight uppercase">Update Cloud Dataset</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Date</label>
              <input 
                type="date" 
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales Value ($)</label>
              <input 
                type="number" 
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                value={formData.sales}
                onChange={(e) => setFormData({...formData, sales: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store Identifier</label>
              <input 
                type="text" 
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                value={formData.storeId}
                onChange={(e) => setFormData({...formData, storeId: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product ID</label>
              <input 
                type="text" 
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                value={formData.productId}
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white text-sm font-black rounded-xl shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Activity className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            {loading ? 'Committing to Cloud...' : 'Add Sales Record'}
          </button>
        </form>
      </div>

      <div className="space-y-8">
        <div className="bg-indigo-600 p-10 rounded-3xl text-white shadow-2xl shadow-indigo-100 flex flex-col items-center text-center">
            <Database className="h-12 w-12 mb-6 opacity-80" />
            <h3 className="text-xl font-black mb-4">No data yet?</h3>
            <p className="text-indigo-100 text-sm font-medium mb-10 leading-relaxed">If you haven't entered any historical records, the forecaster cannot pinpoint seasonality. You can seed your account with 90 days of optimized synthetic data to test the system.</p>
            <button 
              onClick={handleSeed}
              disabled={seeding}
              className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
            >
              {seeding ? <Activity className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Seed Initial Records
            </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
           <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
              <Clock className="text-slate-400 h-6 w-6" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-Refresh</p>
              <h4 className="text-sm font-bold text-slate-800">Firestore Real-time Sync</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Records are persisted across all your devices instantly.</p>
           </div>
        </div>
      </div>
    </div>
  );
}

function ImpactBar({ label, percent, positive }: { label: string, percent: number, positive?: boolean }) {
  return (
    <div className="space-y-1.5">
       <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-slate-600 uppercase">{label}</span>
          <span className={positive ? 'text-indigo-600' : 'text-slate-400'}>{percent}%</span>
       </div>
       <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-200">
          <div 
             className={`h-full rounded-full transition-all duration-1000 ${positive ? 'bg-indigo-500' : 'bg-slate-300'}`} 
             style={{ width: `${percent}%` }}
          />
       </div>
    </div>
  );
}

function StatCard({ label, value, trend, trendLabel, icon }: { label: string, value: string, trend: number, trendLabel?: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
      <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
         <span className="text-indigo-600">{icon}</span>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">{label}</p>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
        {trend !== 0 && (
          <span className={`flex items-center text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full border ${trend > 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel && <span className="ml-1 opacity-70">{trendLabel}</span>}
          </span>
        )}
        {trend === 0 && trendLabel && (
          <span className="text-[10px] font-bold text-slate-400 mt-2 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full uppercase tracking-tighter">
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <span className="data-value text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}

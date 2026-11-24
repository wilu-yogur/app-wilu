import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  Plus,
  CheckCircle2,
  Clock,
  Milk,
  Package,
  Cherry,
  TrendingUp,
  Users,
  ChefHat,
  ShoppingBag,
  Trash2,
  Share2,
  RotateCcw,
  Award,
  Settings,
  X,
  MessageCircle,
  Cloud,
  CloudOff,
  Calendar,
} from 'lucide-react';

const firebaseConfig = {
  apiKey: 'AIzaSyBa81-lwNDemOxu8UrBFZvJLKP8hAQIhAs',
  authDomain: 'yogurt-wilu.firebaseapp.com',
  projectId: 'yogurt-wilu',
  storageBucket: 'yogurt-wilu.firebasestorage.app',
  messagingSenderId: '952624749318',
  appId: '1:952624749318:web:f6181257d02a68b2231c87',
};

let db = null;
try {
  const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
} catch (err) {
  console.error('Error inicializando Firebase:', err);
}

const DEFAULT_PRICES = {
  bebible_1000: 15000,
  bebible_1800: 20000,
  griego_800: 18000,
};

const PRODUCTS = [
  {
    id: 'bebible_1000',
    name: 'Yogur Bebible',
    size: '1 Litro',
    unitType: 'Garrafa 1L',
    litersPerUnit: 1.0,
    isGreek: false,
    milkFactor: 1.0,
  },
  {
    id: 'bebible_1800',
    name: 'Yogur Bebible',
    size: '1.8 Litros',
    unitType: 'Garrafa 1.8L',
    litersPerUnit: 1.8,
    isGreek: false,
    milkFactor: 1.8,
  },
  {
    id: 'griego_800',
    name: 'Yogur Griego',
    size: '800 gr',
    unitType: 'Pote 800gr',
    litersPerUnit: 0.8,
    isGreek: true,
    milkFactor: 2.2,
  },
];

const FRUIT_FLAVORS = [
  'Mora',
  'Fresa',
  'Melocotón',
  'Frutos rojos',
  'Maracuyá',
];

const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);

const WiluLogo = () => (
  <div className="flex items-center gap-2.5">
    <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2E4B9E] to-[#1e3578] shadow-md border border-blue-300/30">
      <span className="text-white font-black text-xl tracking-tight leading-none">
        W<span className="text-emerald-300">ü</span>
      </span>
      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
        ✓
      </span>
    </div>
    <div>
      <div className="flex items-baseline gap-1.5">
        <h1 className="text-xl font-black tracking-tight text-[#2E4B9E] leading-none">
          Wilü
        </h1>
        <span className="text-xs font-semibold text-slate-500 tracking-wide">
          yogur
        </span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mt-0.5">
        Hecho en casa • @Yogurt_wilu
      </p>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('pedidos');
  const [syncStatus, setSyncStatus] = useState('connecting');
  const [showPriceModal, setShowPriceModal] = useState(false);

  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [archivedBatches, setArchivedBatches] = useState([]);

  const [orderFilter, setOrderFilter] = useState('todos');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [productId, setProductId] = useState('bebible_1000');
  const [flavor, setFlavor] = useState('Mora');
  const [qty, setQty] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  const [purchaseCat, setPurchaseCat] = useState('leche');
  const [purchaseDesc, setPurchaseDesc] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseUnit, setPurchaseUnit] = useState('Litros');
  const [purchaseCost, setPurchaseCost] = useState('');

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const cloudDocRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'wilu_yogur_app', 'produccion_principal');
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('wilu_cloud_cache_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.prices) setPrices(parsed.prices);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.purchases) setPurchases(parsed.purchases);
        if (parsed.archivedBatches) setArchivedBatches(parsed.archivedBatches);
      }
    } catch (e) {
      console.error(e);
    }

    if (!cloudDocRef) {
      setSyncStatus('error');
      return;
    }

    const unsubscribe = onSnapshot(
      cloudDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.prices) setPrices(data.prices);
          if (Array.isArray(data.orders)) setOrders(data.orders);
          if (Array.isArray(data.purchases)) setPurchases(data.purchases);
          if (Array.isArray(data.archivedBatches))
            setArchivedBatches(data.archivedBatches);

          localStorage.setItem('wilu_cloud_cache_v1', JSON.stringify(data));
        } else {
          setDoc(cloudDocRef, {
            prices: DEFAULT_PRICES,
            orders: [],
            purchases: [],
            archivedBatches: [],
            updatedAt: new Date().toISOString(),
          });
        }
        setSyncStatus('synced');
      },
      (error) => {
        console.error('Error sincronizando con Firebase:', error);
        setSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, [cloudDocRef]);

  const persistState = async (nextState) => {
    const payload = {
      prices: nextState.prices ?? prices,
      orders: nextState.orders ?? orders,
      purchases: nextState.purchases ?? purchases,
      archivedBatches: nextState.archivedBatches ?? archivedBatches,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('wilu_cloud_cache_v1', JSON.stringify(payload));

    if (cloudDocRef) {
      try {
        setSyncStatus('saving');
        await setDoc(cloudDocRef, payload);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Error guardando en la nube:', err);
        setSyncStatus('error');
      }
    }
  };

  const selectedProduct = useMemo(
    () => PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0],
    [productId]
  );

  useEffect(() => {
    if (selectedProduct.isGreek) {
      setFlavor('Natural');
    } else if (flavor === 'Natural') {
      setFlavor('Mora');
    }
  }, [selectedProduct, flavor]);

  const standardOrderTotal = useMemo(() => {
    const unitPrice = prices[productId] || 0;
    return unitPrice * (Number(qty) || 1);
  }, [prices, productId, qty]);

  const calculatedOrderTotal = useMemo(() => {
    if (customPrice !== '' && !isNaN(Number(customPrice))) {
      return Number(customPrice);
    }
    return standardOrderTotal;
  }, [customPrice, standardOrderTotal]);

  const handleAddOrder = (e) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const isDiscounted = calculatedOrderTotal < standardOrderTotal;

    const newOrder = {
      id: Date.now().toString(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      productId: selectedProduct.id,
      productName: `${selectedProduct.name} ${selectedProduct.size}`,
      isGreek: selectedProduct.isGreek,
      litersPerUnit: selectedProduct.litersPerUnit,
      milkFactor: selectedProduct.milkFactor,
      flavor: selectedProduct.isGreek ? 'Natural' : flavor,
      qty: Number(qty) || 1,
      total: calculatedOrderTotal,
      isSpecialPrice: isDiscounted,
      paid: isPaid,
      createdAt: new Date().toISOString(),
      year: new Date().getFullYear(),
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    persistState({ orders: updatedOrders });

    setClientName('');
    setClientPhone('');
    setQty(1);
    setCustomPrice('');
    setIsPaid(false);
  };

  const togglePaid = (id) => {
    const updatedOrders = orders.map((o) =>
      o.id === id ? { ...o, paid: !o.paid } : o
    );

    const updatedArchived = archivedBatches.map((batch) => ({
      ...batch,
      orders: (batch.orders || []).map((o) =>
        o.id === id ? { ...o, paid: !o.paid } : o
      ),
    }));

    setOrders(updatedOrders);
    setArchivedBatches(updatedArchived);
    persistState({
      orders: updatedOrders,
      archivedBatches: updatedArchived,
    });
  };

  const deleteOrder = (id) => {
    const updatedOrders = orders.filter((o) => o.id !== id);
    setOrders(updatedOrders);
    persistState({ orders: updatedOrders });
  };

  const handleAddPurchase = (e) => {
    e.preventDefault();
    if (!purchaseQty || !purchaseCost) return;

    const defaultLabels = {
      leche: 'Leche fresca',
      potes: 'Potes / Garrafas',
      fruta: 'Fruta para mermelada',
    };

    const newPurchase = {
      id: Date.now().toString(),
      category: purchaseCat,
      description: purchaseDesc.trim() || defaultLabels[purchaseCat],
      qty: Number(purchaseQty),
      unit: purchaseUnit,
      cost: Number(purchaseCost),
      createdAt: new Date().toISOString(),
    };

    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    persistState({ purchases: updatedPurchases });

    setPurchaseDesc('');
    setPurchaseQty('');
    setPurchaseCost('');
  };

  const deletePurchase = (id) => {
    const updatedPurchases = purchases.filter((p) => p.id !== id);
    setPurchases(updatedPurchases);
    persistState({ purchases: updatedPurchases });
  };

  const handleSavePrices = (newPrices) => {
    setPrices(newPrices);
    persistState({ prices: newPrices });
    setShowPriceModal(false);
  };

  const handleCloseBatch = () => {
    if (orders.length === 0 && purchases.length === 0) return;

    const currentBatchOrders = orders.filter((o) => !o.isCarryOver);

    const batchRecord = {
      id: Date.now().toString(),
      closedAt: new Date().toISOString(),
      year: new Date().getFullYear(),
      orders: currentBatchOrders,
      purchases,
    };

    const unpaidCarryOver = orders
      .filter((o) => !o.paid)
      .map((o) => ({ ...o, isCarryOver: true }));

    const updatedArchived =
      currentBatchOrders.length > 0 || purchases.length > 0
        ? [batchRecord, ...archivedBatches]
        : archivedBatches;

    setArchivedBatches(updatedArchived);
    setOrders(unpaidCarryOver);
    setPurchases([]);

    persistState({
      archivedBatches: updatedArchived,
      orders: unpaidCarryOver,
      purchases: [],
    });
  };

    const deleteArchivedBatch = (batchId) => {
      const updatedArchived = archivedBatches.filter((b) => b.id !== batchId);
      setArchivedBatches(updatedArchived);
      persistState({ archivedBatches: updatedArchived });
    };

    const updatedArchived = [batchRecord, ...archivedBatches];
    setArchivedBatches(updatedArchived);
    setOrders([]);
    setPurchases([]);

    persistState({
      archivedBatches: updatedArchived,
      orders: [],
      purchases: [],
    });
  };

  const productionStats = useMemo(() => {
    let bebible1L = 0;
    let bebible18L = 0;
    let griego800 = 0;
    let estimatedMilkLiters = 0;
    const jamByFlavor = {};

    orders
      .filter((o) => !o.isCarryOver)
      .forEach((o) => {
        const q = Number(o.qty) || 0;
        if (o.productId === 'bebible_1000') bebible1L += q;
        if (o.productId === 'bebible_1800') bebible18L += q;
        if (o.productId === 'griego_800' || o.isGreek) griego800 += q;

        estimatedMilkLiters += q * (o.milkFactor || 1);

        if (!o.isGreek && o.flavor && o.flavor !== 'Natural') {
          const liters = q * (o.litersPerUnit || 1);
          jamByFlavor[o.flavor] = (jamByFlavor[o.flavor] || 0) + liters;
        }
      });

    return {
      bebible1L,
      bebible18L,
      griego800,
      estimatedMilkLiters: Math.ceil(estimatedMilkLiters * 10) / 10,
      jamByFlavor,
    };
  }, [orders]);

  const currentFinancials = useMemo(() => {
    const newOrders = orders.filter((o) => !o.isCarryOver);
    const totalSales = newOrders.reduce(
      (acc, o) => acc + (Number(o.total) || 0),
      0
    );
    const collected = newOrders
      .filter((o) => o.paid)
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const pending = orders
      .filter((o) => !o.paid)
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const totalExpenses = purchases.reduce(
      (acc, p) => acc + (Number(p.cost) || 0),
      0
    );
    const netProfit = totalSales - totalExpenses;

    return { totalSales, collected, pending, totalExpenses, netProfit };
  }, [orders, purchases]);

  const annualStats = useMemo(() => {
    const allOrders = [
      ...orders.map((o) => ({
        ...o,
        year: o.year || new Date(o.createdAt || Date.now()).getFullYear(),
      })),
      ...archivedBatches.flatMap((b) =>
        (b.orders || []).map((o) => ({
          ...o,
          year: o.year || b.year || new Date(b.closedAt).getFullYear(),
        }))
      ),
    ];

    const availableYears = Array.from(
      new Set([currentYear, ...allOrders.map((o) => o.year)])
    ).sort((a, b) => b - a);

    const yearOrders = allOrders.filter((o) => o.year === selectedYear);

    let bebibleLiters = 0;
    let griegoKg = 0;
    let griegoPotes = 0;
    let totalRevenue = 0;
    const clientMap = {};

    yearOrders.forEach((o) => {
      const q = Number(o.qty) || 0;
      const liters = q * (o.litersPerUnit || (o.isGreek ? 0.8 : 1));
      const rev = Number(o.total) || 0;

      if (o.isGreek) {
        griegoKg += liters;
        griegoPotes += q;
      } else {
        bebibleLiters += liters;
      }
      totalRevenue += rev;

      const key = o.clientName.trim().toLowerCase();
      if (!clientMap[key]) {
        clientMap[key] = {
          name: o.clientName.trim(),
          units: 0,
          liters: 0,
          totalSpent: 0,
        };
      }
      clientMap[key].units += q;
      clientMap[key].liters += liters;
      clientMap[key].totalSpent += rev;
    });

    const topClients = Object.values(clientMap).sort(
      (a, b) => b.totalSpent - a.totalSpent || b.units - a.units
    );

    return {
      availableYears,
      bebibleLiters: Math.round(bebibleLiters * 10) / 10,
      griegoKg: Math.round(griegoKg * 10) / 10,
      griegoPotes,
      totalVolume: Math.round((bebibleLiters + griegoKg) * 10) / 10,
      totalRevenue,
      topClients,
    };
  }, [orders, archivedBatches, selectedYear, currentYear]);

  const shareSummaryWhatsApp = () => {
    const lines = [
      `🥛 *WILÜ YOGUR - RESUMEN DE TANDA*`,
      `📦 *Producción requerida:*`,
      `• Yogur Bebible 1L: ${productionStats.bebible1L} unid.`,
      `• Yogur Bebible 1.8L: ${productionStats.bebible18L} unid.`,
      `• Yogur Griego 800gr (Natural): ${productionStats.griego800} potes`,
      `🐄 *Leche estimada:* ${productionStats.estimatedMilkLiters} Litros`,
      ``,
      `🍓 *Mermeladas (Bebible):*`,
      ...(Object.keys(productionStats.jamByFlavor).length > 0
        ? Object.entries(productionStats.jamByFlavor).map(
            ([f, l]) => `• ${f}: para ${l.toFixed(1)}L de yogur`
          )
        : ['• Sin pedidos de fruta aún']),
      ``,
      `💰 *Balance Tanda Actual:*`,
      `• Ventas: ${formatCOP(currentFinancials.totalSales)}`,
      `• Recaudado: ${formatCOP(currentFinancials.collected)}`,
      `• Por cobrar: ${formatCOP(currentFinancials.pending)}`,
      `• Gastos insumos: ${formatCOP(currentFinancials.totalExpenses)}`,
      `• Ganancia neta: ${formatCOP(currentFinancials.netProfit)}`,
    ];
    window.open(
      `https://wa.me/573183853189?text=${encodeURIComponent(lines.join('\n'))}`,
      '_blank'
    );
  };

  const sendClientWhatsApp = (order) => {
    const cleanPhone = order.clientPhone.replace(/\D/g, '');
    const phoneParam = cleanPhone
      ? cleanPhone.startsWith('57')
        ? cleanPhone
        : `57${cleanPhone}`
      : '';
    const statusText = order.paid
      ? '✅ *Pagado*'
      : `⏳ *Pendiente por pagar (${formatCOP(order.total)})*`;
    const msg = `Hola *${
      order.clientName
    }*! 👋 Gracias por pedir *Wilü yogur*.\n\nDetalle de tu pedido:\n• ${
      order.qty
    }x ${order.productName} (${order.flavor})\n• Total: ${formatCOP(
      order.total
    )}\n• Estado: ${statusText}`;
    window.open(
      `https://wa.me/${phoneParam}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'pendientes') return !o.paid;
    if (orderFilter === 'pagados') return o.paid;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-slate-800 pb-24 font-sans">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <WiluLogo />

          <div className="flex items-center gap-2">
            <div
              title={
                syncStatus === 'synced'
                  ? 'Conectado y sincronizado en la nube'
                  : syncStatus === 'error'
                  ? 'Error de conexión con Firebase'
                  : 'Sincronizando...'
              }
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
                syncStatus === 'synced'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : syncStatus === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {syncStatus === 'error' ? (
                <CloudOff className="w-3.5 h-3.5" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span>
                {syncStatus === 'synced'
                  ? 'Nube OK'
                  : syncStatus === 'error'
                  ? 'Sin red'
                  : 'Sync...'}
              </span>
            </div>

            <button
              onClick={() => setShowPriceModal(true)}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
            >
              <Settings className="w-3.5 h-3.5 text-[#2E4B9E]" />
              Precios
            </button>

            <button
              onClick={shareSummaryWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl shadow-sm transition"
              title="Enviar resumen por WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {activeTab === 'pedidos' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pagado
                </span>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {formatCOP(currentFinancials.collected)}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Por Cobrar
                </span>
                <p className="text-lg font-black text-amber-600 mt-1">
                  {formatCOP(currentFinancials.pending)}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleAddOrder}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-[#2E4B9E] uppercase tracking-wide">
                  + Registrar Pedido
                </h2>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Total: {formatCOP(calculatedOrderTotal)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Nombre del cliente *"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#2E4B9E]"
                  required
                />
                <input
                  type="tel"
                  placeholder="WhatsApp (opcional)"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#2E4B9E]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PRODUCTS.map((p) => {
                  const active = productId === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        setProductId(p.id);
                        setCustomPrice('');
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition ${
                        active
                          ? 'bg-[#2E4B9E] text-white border-[#2E4B9E] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px] font-bold leading-tight">
                        {p.isGreek ? 'Griego' : 'Bebible'}
                      </div>
                      <div className="text-xs font-black mt-0.5">{p.size}</div>
                      <div
                        className={`text-[10px] font-semibold mt-1 ${
                          active ? 'text-blue-200' : 'text-slate-500'
                        }`}
                      >
                        {formatCOP(prices[p.id])}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedProduct.isGreek ? (
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#2E4B9E] flex items-center justify-between">
                  <span>Sabor Yogur Griego:</span>
                  <span className="font-black bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                    Natural (Sin dulce)
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                    Sabor con trozos de fruta:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {FRUIT_FLAVORS.map((f) => (
                      <button
                        type="button"
                        key={f}
                        onClick={() => setFlavor(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                          flavor === f
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => {
                      setQty(e.target.value);
                      setCustomPrice('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Valor Total ($)
                  </label>
                  <input
                    type="number"
                    placeholder={standardOrderTotal.toString()}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Estado Pago
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPaid(!isPaid)}
                    className={`w-full py-2 px-2 rounded-xl text-xs font-black border transition ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isPaid ? '✓ Pagado' : '⏳ Debe'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#2E4B9E] hover:bg-[#243c80] text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Guardar Pedido
              </button>
            </form>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Pedidos de la Tanda ({filteredOrders.length})
                </h3>
                <div className="flex bg-slate-200/70 p-0.5 rounded-xl text-xs font-bold">
                  {['todos', 'pendientes', 'pagados'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setOrderFilter(f)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition ${
                        orderFilter === f
                          ? 'bg-white text-[#2E4B9E] shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300 text-slate-400 text-sm">
                  No hay pedidos en esta vista todavía.
                </div>
              ) : (
                filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 text-sm truncate">
                          {o.clientName}
                        </h4>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#2E4B9E]">
                          {o.qty}x
                        </span>

                        {o.isCarryOver && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            Saldo anterior
                          </span>
                        )}
                        {o.isSpecialPrice && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            Precio especial
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {o.productName} •{' '}
                        <span className="text-emerald-700 font-bold">
                          {o.flavor}
                        </span>
                      </p>
                      <p className="text-sm font-black text-slate-900 mt-1">
                        {formatCOP(o.total)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => togglePaid(o.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition ${
                          o.paid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.paid ? 'Pagado' : 'Cobrar'}
                      </button>
                      <button
                        onClick={() => sendClientWhatsApp(o)}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        title="Enviar recibo por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteOrder(o.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'produccion' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#2E4B9E] to-[#1e3578] text-white rounded-3xl p-5 shadow-md">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
                <Milk className="w-4 h-4" /> Leche cruda estimada a pedir
              </div>
              <div className="text-4xl font-black mt-1">
                {productionStats.estimatedMilkLiters}{' '}
                <span className="text-lg font-semibold text-blue-200">
                  Litros
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                Calculado automáticamente: 1L de leche por cada litro de bebible
                + ~2.2L de leche por cada pote de Yogur Griego (desuerado).
              </p>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-[#2E4B9E] uppercase tracking-wide flex items-center gap-2">
                <Package className="w-4 h-4" /> Envases / Potes Necesarios
              </h3>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                  <div className="text-2xl font-black text-slate-900">
                    {productionStats.bebible1L}
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                    Garrafa 1 Litro
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                  <div className="text-2xl font-black text-slate-900">
                    {productionStats.bebible18L}
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                    Garrafa 1.8L
                  </div>
                </div>
                <div className="bg-blue-50/70 rounded-2xl p-3 border border-blue-200">
                  <div className="text-2xl font-black text-[#2E4B9E]">
                    {productionStats.griego800}
                  </div>
                  <div className="text-[11px] font-bold text-[#2E4B9E] mt-0.5">
                    Pote Griego 800g
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-emerald-700 uppercase tracking-wide flex items-center gap-2">
                <Cherry className="w-4 h-4" /> Mermeladas de Fruta (Yogur
                Bebible)
              </h3>
              {Object.keys(productionStats.jamByFlavor).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Aún no hay pedidos de yogur bebible con fruta en esta tanda.
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(productionStats.jamByFlavor).map(
                    ([flv, liters]) => (
                      <div
                        key={flv}
                        className="flex items-center justify-between bg-emerald-50/60 border border-emerald-100 rounded-2xl px-3.5 py-2.5"
                      >
                        <span className="font-bold text-sm text-slate-800">
                          {flv}
                        </span>
                        <span className="text-xs font-black bg-emerald-600 text-white px-3 py-1 rounded-full">
                          Para {liters.toFixed(1)} L de yogur
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'compras' && (
          <div className="space-y-4">
            <form
              onSubmit={handleAddPurchase}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3"
            >
              <h2 className="text-sm font-black text-[#2E4B9E] uppercase tracking-wide">
                + Registrar Compra de Insumos
              </h2>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'leche', label: 'Leche', unit: 'Litros' },
                  { id: 'potes', label: 'Potes', unit: 'Unidades' },
                  { id: 'fruta', label: 'Fruta', unit: 'Kilos' },
                ].map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      setPurchaseCat(cat.id);
                      setPurchaseUnit(cat.unit);
                    }}
                    className={`py-2.5 rounded-2xl text-xs font-black border transition ${
                      purchaseCat === cat.id
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder={
                  purchaseCat === 'leche'
                    ? 'Ej. Leche finca Don Carlos'
                    : purchaseCat === 'potes'
                    ? 'Ej. Potes 800gr y garrafas 1L'
                    : 'Ej. Mora y fresa madura'
                }
                value={purchaseDesc}
                onChange={(e) => setPurchaseDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium"
              />

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Cant. *"
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  required
                />
                <input
                  type="text"
                  value={purchaseUnit}
                  onChange={(e) => setPurchaseUnit(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold"
                />
                <input
                  type="number"
                  placeholder="Costo $ *"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Guardar Compra
              </button>
            </form>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Insumos Comprados ({purchases.length})
                </h3>
                <span className="text-xs font-black text-rose-600">
                  Total: {formatCOP(currentFinancials.totalExpenses)}
                </span>
              </div>

              {purchases.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-300 text-slate-400 text-xs">
                  No has registrado compras de leche, potes o fruta en esta
                  tanda.
                </div>
              ) : (
                purchases.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {p.category}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">
                        {p.description}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {p.qty} {p.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-rose-600">
                        {formatCOP(p.cost)}
                      </span>
                      <button
                        onClick={() => deletePurchase(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <h2 className="text-sm font-black text-[#2E4B9E] uppercase tracking-wide">
                Balance de la Tanda Actual
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Ventas totales:</span>
                  <span className="font-black text-slate-900">
                    {formatCOP(currentFinancials.totalSales)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Gastos en insumos:</span>
                  <span className="font-black text-rose-600">
                    - {formatCOP(currentFinancials.totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-base">
                  <span className="font-black text-slate-800">
                    Ganancia Neta:
                  </span>
                  <span
                    className={`font-black ${
                      currentFinancials.netProfit >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatCOP(currentFinancials.netProfit)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCloseBatch}
                className="w-full mt-2 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Cerrar tanda y archivar en historial anual
              </button>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-3xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-100">
                  <Calendar className="w-4 h-4" /> Producción Vendida en el Año
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white/20 text-white text-xs font-black px-2.5 py-1 rounded-xl border border-white/30 focus:outline-none"
                >
                  {annualStats.availableYears.map((yr) => (
                    <option key={yr} value={yr} className="text-slate-900">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/15 rounded-2xl p-2.5">
                  <div className="text-xl font-black">
                    {annualStats.bebibleLiters} L
                  </div>
                  <div className="text-[10px] font-bold text-emerald-100 mt-0.5">
                    Yogur Bebible
                  </div>
                </div>
                <div className="bg-white/15 rounded-2xl p-2.5">
                  <div className="text-xl font-black">
                    {annualStats.griegoKg} kg
                  </div>
                  <div className="text-[10px] font-bold text-emerald-100 mt-0.5">
                    Griego ({annualStats.griegoPotes} potes)
                  </div>
                </div>
                <div className="bg-white/25 rounded-2xl p-2.5">
                  <div className="text-xl font-black">
                    {annualStats.totalVolume}
                  </div>
                  <div className="text-[10px] font-bold text-white mt-0.5">
                    Total L / Kg
                  </div>
                </div>
              </div>

              <div className="text-xs text-emerald-100 flex justify-between pt-1 border-t border-white/20">
                <span>Facturación acumulada {selectedYear}:</span>
                <span className="font-black text-white">
                  {formatCOP(annualStats.totalRevenue)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-[#2E4B9E] uppercase tracking-wide flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Top Clientes (
                {selectedYear})
              </h3>

              {annualStats.topClients.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Aún no hay clientes registrados en {selectedYear}.
                </p>
              ) : (
                <div className="space-y-2">
                  {annualStats.topClients.map((c, idx) => (
                    <div
                      key={c.name}
                      className={`flex items-center justify-between p-3 rounded-2xl border ${
                        idx === 0
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-black text-sm text-slate-900">
                            {c.name}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500">
                            {c.units} yogures • {c.liters.toFixed(1)} L/kg
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-black text-sm text-[#2E4B9E]">
                        {formatCOP(c.totalSpent)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-[#2E4B9E] uppercase tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" /> Tandas
                Archivadas ({selectedYear})
              </h3>

              {archivedBatches.filter(
                (b) =>
                  (b.year || new Date(b.closedAt).getFullYear()) ===
                  selectedYear
              ).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No hay tandas archivadas en {selectedYear}.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {archivedBatches
                    .filter(
                      (b) =>
                        (b.year || new Date(b.closedAt).getFullYear()) ===
                        selectedYear
                    )
                    .map((batch) => {
                      const batchTotal = (batch.orders || []).reduce(
                        (sum, o) => sum + (Number(o.total) || 0),
                        0
                      );
                      const batchDate = new Date(
                        batch.closedAt
                      ).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });

                      return (
                        <details
                          key={batch.id}
                          className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 group"
                        >
                          <summary className="flex items-center justify-between cursor-pointer list-none">
                            <div>
                              <div className="font-black text-sm text-slate-900">
                                Tanda {batchDate}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-500">
                                {(batch.orders || []).length} pedidos •{' '}
                                {formatCOP(batchTotal)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#2E4B9E] underline">
                                Ver detalle
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  deleteArchivedBatch(batch.id);
                                }}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Eliminar tanda archivada"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </summary>

                          <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1.5">
                            {(batch.orders || []).map((o) => (
                              <div
                                key={o.id}
                                className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-100"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">
                                    {o.clientName}
                                  </span>{' '}
                                  <span className="text-slate-500">
                                    ({o.qty}x {o.productName} - {o.flavor})
                                  </span>
                                </div>
                                <span className="font-black text-slate-900">
                                  {formatCOP(o.total)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showPriceModal && (
        <PriceEditorModal
          prices={prices}
          onSave={handleSavePrices}
          onClose={() => setShowPriceModal(false)}
        />
      )}

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-2 py-2 shadow-lg">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-1">
          {[
            { id: 'pedidos', label: 'Pedidos', icon: Users },
            { id: 'produccion', label: 'Producción', icon: ChefHat },
            { id: 'compras', label: 'Insumos', icon: ShoppingBag },
            { id: 'balance', label: 'Balance', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition ${
                  active
                    ? 'bg-[#2E4B9E] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-extrabold mt-1">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function PriceEditorModal({ prices, onSave, onClose }) {
  const [draft, setDraft] = useState(prices);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-[#2E4B9E]">
            Ajustar Precios Wilü
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {PRODUCTS.map((p) => (
            <div key={p.id}>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {p.name} ({p.size})
              </label>
              <input
                type="number"
                value={draft[p.id]}
                onChange={(e) =>
                  setDraft({ ...draft, [p.id]: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => onSave(draft)}
          className="w-full py-3 rounded-2xl bg-[#2E4B9E] text-white font-black text-sm shadow-md"
        >
          Guardar Precios en la Nube
        </button>
      </div>
    </div>
  );
}

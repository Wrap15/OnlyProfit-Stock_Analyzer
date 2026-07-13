import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { isIndianMarketOpen } from './marketHours';

// Helper to wrap a promise with a timeout
function withTimeout<T>(promise: Promise<T>, ms = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), ms)
    )
  ]);
}

export interface SimulatorOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'SL';
  productType: 'CNC' | 'MIS'; // CNC = Delivery, MIS = Intraday
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  status: 'PENDING' | 'EXECUTED' | 'REJECTED' | 'CANCELLED';
  timestamp: number;
  rejectionReason?: string;
  executionPrice?: number;
  brokerage: number;
  taxes: number;
}

export interface SimulatorHolding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  totalInvested: number;
}

export interface SimulatorPosition {
  symbol: string;
  quantity: number; // Positive = Long, Negative = Short, 0 = Squared Off
  avgPrice: number;
  totalInvested: number;
  realizedPnL: number;
}

export interface SimulatorState {
  cash: number;
  holdings: SimulatorHolding[];
  positions: SimulatorPosition[];
  orders: SimulatorOrder[];
  history: SimulatorOrder[];
}

const DEFAULT_BALANCE = 1000000; // ₹10,00,000

// Helper to load state from LocalStorage
function getLocalState(userId: string | null): SimulatorState {
  if (typeof window === 'undefined') {
    return { cash: DEFAULT_BALANCE, holdings: [], positions: [], orders: [], history: [] };
  }
  const key = userId ? `onlyprofit_simulator_user_${userId}` : 'onlyprofit_simulator_guest';
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  const newState = { cash: DEFAULT_BALANCE, holdings: [], positions: [], orders: [], history: [] };
  localStorage.setItem(key, JSON.stringify(newState));
  return newState;
}

function saveLocalState(userId: string | null, state: SimulatorState) {
  if (typeof window !== 'undefined') {
    const key = userId ? `onlyprofit_simulator_user_${userId}` : 'onlyprofit_simulator_guest';
    localStorage.setItem(key, JSON.stringify(state));
  }
}

// Calculate simulated brokerage and taxes
export function calculateFees(price: number, quantity: number) {
  const turnover = price * quantity;
  // Brokerage: Flat ₹20 or 0.03% (whichever is lower)
  const brokerage = Math.min(20, parseFloat((turnover * 0.0003).toFixed(2)));
  // Taxes:
  const stt = parseFloat((turnover * 0.001).toFixed(2)); // Securities Transaction Tax (0.1% for delivery/MIS)
  const gst = parseFloat((brokerage * 0.18).toFixed(2)); // GST (18% on brokerage)
  const stampDuty = parseFloat((turnover * 0.00015).toFixed(2)); // Stamp Duty (0.015%)
  const sebiCharges = parseFloat((turnover * 0.000001).toFixed(2)); // SEBI turnover fees
  const taxes = parseFloat((stt + gst + stampDuty + sebiCharges).toFixed(2));
  
  return {
    brokerage,
    taxes,
    total: parseFloat((brokerage + taxes).toFixed(2))
  };
}

export async function getSimulatorState(userId: string | null): Promise<SimulatorState> {
  if (!userId) {
    return getLocalState(null);
  }

  try {
    return await withTimeout((async () => {
      // 1. Fetch Cash Balance
      const walletRef = doc(db, 'users', userId, 'simulator', 'wallet');
      const walletSnap = await getDoc(walletRef);
      let cash = DEFAULT_BALANCE;
      if (walletSnap.exists()) {
        cash = walletSnap.data().cash ?? DEFAULT_BALANCE;
      } else {
        await setDoc(walletRef, { cash: DEFAULT_BALANCE });
      }

      // 2. Fetch Holdings
      const holdingsSnap = await getDocs(collection(db, 'users', userId, 'simulator_holdings'));
      const holdings: SimulatorHolding[] = [];
      holdingsSnap.forEach(docSnap => {
        holdings.push(docSnap.data() as SimulatorHolding);
      });

      // 3. Fetch Positions
      const positionsSnap = await getDocs(collection(db, 'users', userId, 'simulator_positions'));
      const positions: SimulatorPosition[] = [];
      positionsSnap.forEach(docSnap => {
        positions.push(docSnap.data() as SimulatorPosition);
      });

      // 4. Fetch Orders & History
      const ordersSnap = await getDocs(collection(db, 'users', userId, 'simulator_orders'));
      const orders: SimulatorOrder[] = [];
      const history: SimulatorOrder[] = [];
      ordersSnap.forEach(docSnap => {
        const order = { id: docSnap.id, ...docSnap.data() } as SimulatorOrder;
        if (order.status === 'PENDING') {
          orders.push(order);
        } else {
          history.push(order);
        }
      });

      // Sort history by newest first
      history.sort((a, b) => b.timestamp - a.timestamp);

      // Keep local state in sync as a hot fallback copy
      const localState = { cash, holdings, positions, orders, history };
      saveLocalState(userId, localState);

      return localState;
    })(), 1500);
  } catch (err) {
    console.error('Failed to load Firestore simulator state, falling back to LocalStorage:', err);
    return getLocalState(userId);
  }
}

// Save wallet balance
export async function saveCashBalance(userId: string | null, cash: number) {
  // Always update local cache copy immediately
  const state = getLocalState(userId);
  state.cash = cash;
  saveLocalState(userId, state);

  if (!userId) {
    return;
  }
  try {
    const walletRef = doc(db, 'users', userId, 'simulator', 'wallet');
    await withTimeout(setDoc(walletRef, { cash }, { merge: true }), 1500);
  } catch (err) {
    console.warn('saveCashBalance Firestore write failed/timed out, saved locally:', err);
  }
}

// Place Order
export async function placeOrder(
  userId: string | null,
  orderParams: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'SL';
    productType: 'CNC' | 'MIS';
    quantity: number;
    limitPrice?: number;
    stopPrice?: number;
  },
  livePrice: number
): Promise<{ success: boolean; reason?: string; order: SimulatorOrder }> {
  
  const timestamp = Date.now();
  const quantity = Math.max(1, Math.floor(orderParams.quantity));
  const activePrice = orderParams.type === 'LIMIT' ? orderParams.limitPrice || livePrice : livePrice;
  
  // Calculate fees
  const { brokerage, taxes } = calculateFees(activePrice, quantity);
  const tradeValue = activePrice * quantity;
  const estimatedCost = orderParams.side === 'BUY' ? tradeValue + brokerage + taxes : tradeValue - brokerage - taxes;

  const newOrder: SimulatorOrder = {
    id: userId ? '' : `local-order-${timestamp}`,
    symbol: orderParams.symbol,
    side: orderParams.side,
    type: orderParams.type,
    productType: orderParams.productType,
    quantity,
    limitPrice: orderParams.limitPrice,
    stopPrice: orderParams.stopPrice,
    status: 'PENDING',
    timestamp,
    brokerage,
    taxes,
  };

  // Fetch current state for validations
  const state = await getSimulatorState(userId);
  const isOpen = isIndianMarketOpen();

  // 1. Validate quantity
  if (quantity < 1) {
    newOrder.status = 'REJECTED';
    newOrder.rejectionReason = 'Quantity must be greater than or equal to 1';
    await recordOrderInDB(userId, newOrder);
    return { success: false, reason: newOrder.rejectionReason, order: newOrder };
  }

  // 2. Circuit Limits Validation (±10%)
  if (orderParams.type === 'LIMIT' && orderParams.limitPrice) {
    const diff = Math.abs(orderParams.limitPrice - livePrice) / livePrice;
    if (diff > 0.1) {
      newOrder.status = 'REJECTED';
      newOrder.rejectionReason = `Limit price is outside the circuit limit of 10% (Live: ₹${livePrice.toFixed(2)})`;
      await recordOrderInDB(userId, newOrder);
      return { success: false, reason: newOrder.rejectionReason, order: newOrder };
    }
  }

  // 3. Validate sufficient funds for BUY
  if (orderParams.side === 'BUY' && state.cash < estimatedCost) {
    newOrder.status = 'REJECTED';
    newOrder.rejectionReason = `Insufficient funds. Required: ₹${estimatedCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}, Available: ₹${state.cash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    await recordOrderInDB(userId, newOrder);
    return { success: false, reason: newOrder.rejectionReason, order: newOrder };
  }

  // 4. Validate sufficient holdings/positions for SELL
  if (orderParams.side === 'SELL') {
    if (orderParams.productType === 'CNC') {
      const holding = state.holdings.find(h => h.symbol === orderParams.symbol);
      if (!holding || holding.quantity < quantity) {
        newOrder.status = 'REJECTED';
        newOrder.rejectionReason = `Insufficient holdings. Available: ${holding?.quantity || 0} shares`;
        await recordOrderInDB(userId, newOrder);
        return { success: false, reason: newOrder.rejectionReason, order: newOrder };
      }
    } else {
      // MIS shorting is allowed if market is open! If squaring off, validate active position size
      const position = state.positions.find(p => p.symbol === orderParams.symbol);
      const activeQty = position ? position.quantity : 0;
      if (activeQty > 0 && activeQty < quantity) {
        newOrder.status = 'REJECTED';
        newOrder.rejectionReason = `Cannot sell more than your active long position size of ${activeQty} shares`;
        await recordOrderInDB(userId, newOrder);
        return { success: false, reason: newOrder.rejectionReason, order: newOrder };
      }
    }
  }

  // 5. Market Closed validations
  if (!isOpen) {
    if (orderParams.type === 'MARKET') {
      newOrder.status = 'REJECTED';
      newOrder.rejectionReason = 'Indian Stock Market is closed (Trading is active 9:15 AM - 3:30 PM IST)';
      await recordOrderInDB(userId, newOrder);
      return { success: false, reason: newOrder.rejectionReason, order: newOrder };
    } else {
      // Limit order: allowed to sit in pending state for market open
      newOrder.status = 'PENDING';
      const createdOrder = await recordOrderInDB(userId, newOrder);
      return { success: true, order: createdOrder };
    }
  }

  // 6. Execution path for market orders when market is open
  if (orderParams.type === 'MARKET') {
    newOrder.status = 'EXECUTED';
    newOrder.executionPrice = livePrice;
    
    // Process trade updates
    await executeTradeTransaction(userId, state, newOrder);
    return { success: true, order: newOrder };
  } else {
    // Limit order (market open): check if immediate trigger, otherwise push pending
    const matchesLimit = orderParams.side === 'BUY' 
      ? (orderParams.limitPrice && livePrice <= orderParams.limitPrice)
      : (orderParams.limitPrice && livePrice >= orderParams.limitPrice);

    if (matchesLimit) {
      newOrder.status = 'EXECUTED';
      newOrder.executionPrice = orderParams.limitPrice;
      await executeTradeTransaction(userId, state, newOrder);
      return { success: true, order: newOrder };
    } else {
      newOrder.status = 'PENDING';
      const createdOrder = await recordOrderInDB(userId, newOrder);
      return { success: true, order: createdOrder };
    }
  }
}

// Record order into database
async function recordOrderInDB(userId: string | null, order: SimulatorOrder): Promise<SimulatorOrder> {
  // Always update local cache copy immediately
  const state = getLocalState(userId);
  if (!order.id) {
    order.id = `local-order-${order.timestamp}`;
  }
  
  if (order.status === 'PENDING') {
    const existingIdx = state.orders.findIndex(o => o.id === order.id || (o.timestamp === order.timestamp && o.symbol === order.symbol));
    if (existingIdx >= 0) {
      state.orders[existingIdx] = order;
    } else {
      state.orders.push(order);
    }
    // Remove from history if present
    state.history = state.history.filter(o => o.id !== order.id && !(o.timestamp === order.timestamp && o.symbol === order.symbol));
  } else {
    const existingIdx = state.history.findIndex(o => o.id === order.id || (o.timestamp === order.timestamp && o.symbol === order.symbol));
    if (existingIdx >= 0) {
      state.history[existingIdx] = order;
    } else {
      state.history.push(order);
    }
    // Remove from pending orders list
    state.orders = state.orders.filter(o => o.id !== order.id && !(o.timestamp === order.timestamp && o.symbol === order.symbol));
  }

  // Sort history by newest first
  state.history.sort((a, b) => b.timestamp - a.timestamp);
  saveLocalState(userId, state);

  if (!userId) {
    return order;
  }

  try {
    const orderCollection = collection(db, 'users', userId, 'simulator_orders');
    const docRef = await withTimeout(addDoc(orderCollection, {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      productType: order.productType,
      quantity: order.quantity,
      limitPrice: order.limitPrice ?? null,
      stopPrice: order.stopPrice ?? null,
      status: order.status,
      timestamp: order.timestamp,
      brokerage: order.brokerage,
      taxes: order.taxes,
      rejectionReason: order.rejectionReason ?? null,
      executionPrice: order.executionPrice ?? null,
    }), 1500);

    order.id = docRef.id;
    // Update local cache with firestore document ID
    const freshState = getLocalState(userId);
    const localOrder = freshState.orders.find(o => o.timestamp === order.timestamp && o.symbol === order.symbol);
    if (localOrder) {
      localOrder.id = docRef.id;
      saveLocalState(userId, freshState);
    }
    return order;
  } catch (err) {
    console.warn('recordOrderInDB Firestore write failed/timed out, saved locally:', err);
    return order;
  }
}

// Cancel Order
export async function cancelOrder(userId: string | null, orderId: string): Promise<boolean> {
  // Always cancel locally first as a fallback copy
  const state = getLocalState(userId);
  const orderIdx = state.orders.findIndex(o => o.id === orderId);
  if (orderIdx >= 0) {
    const order = state.orders[orderIdx];
    order.status = 'CANCELLED';
    state.history.push(order);
    state.orders.splice(orderIdx, 1);
    state.history.sort((a, b) => b.timestamp - a.timestamp);
    saveLocalState(userId, state);
  }

  if (!userId) {
    const localOrder = state.orders.find(o => o.id === orderId);
    return !!localOrder;
  }

  try {
    const orderRef = doc(db, 'users', userId, 'simulator_orders', orderId);
    await withTimeout(updateDoc(orderRef, { status: 'CANCELLED' }), 1500);
    return true;
  } catch (err) {
    console.warn('Failed to cancel order in Firestore, local cache is primary:', err);
    return true; // Return true because it was successfully cancelled locally
  }
}

// Square off MIS Position
export async function squareOffPosition(userId: string | null, symbol: string, livePrice: number): Promise<boolean> {
  const state = await getSimulatorState(userId);
  const position = state.positions.find(p => p.symbol === symbol);
  if (!position || position.quantity === 0) return false;

  const side = position.quantity > 0 ? 'SELL' : 'BUY';
  const qty = Math.abs(position.quantity);

  const res = await placeOrder(userId, {
    symbol,
    side,
    type: 'MARKET',
    productType: 'MIS',
    quantity: qty
  }, livePrice);

  return res.success;
}

// Execute transaction
async function executeTradeTransaction(
  userId: string | null,
  state: SimulatorState,
  order: SimulatorOrder
): Promise<SimulatorState> {
  const execPrice = order.executionPrice || order.limitPrice || 0;
  const cost = execPrice * order.quantity;
  const fees = order.brokerage + order.taxes;

  // 1. Update wallet balance
  if (order.side === 'BUY') {
    state.cash = parseFloat((state.cash - (cost + fees)).toFixed(2));
  } else {
    state.cash = parseFloat((state.cash + (cost - fees)).toFixed(2));
  }
  await saveCashBalance(userId, state.cash);

  // 2. Update Holdings (CNC) vs Positions (MIS)
  if (order.productType === 'CNC') {
    await updateHoldings(userId, state, order, execPrice);
  } else {
    await updatePositions(userId, state, order, execPrice);
  }

  // 3. Write executed order to database/history
  await recordOrderInDB(userId, order);

  return state;
}

// Update CNC holdings
async function updateHoldings(userId: string | null, state: SimulatorState, order: SimulatorOrder, price: number) {
  const holdingIndex = state.holdings.findIndex(h => h.symbol === order.symbol);
  
  if (order.side === 'BUY') {
    if (holdingIndex >= 0) {
      const h = state.holdings[holdingIndex];
      const newQty = h.quantity + order.quantity;
      const newInvested = h.totalInvested + (price * order.quantity);
      const newAvg = parseFloat((newInvested / newQty).toFixed(2));
      
      h.quantity = newQty;
      h.avgBuyPrice = newAvg;
      h.totalInvested = parseFloat(newInvested.toFixed(2));
      
      await saveHoldingInDB(userId, h);
    } else {
      const newHolding: SimulatorHolding = {
        symbol: order.symbol,
        quantity: order.quantity,
        avgBuyPrice: price,
        totalInvested: parseFloat((price * order.quantity).toFixed(2))
      };
      state.holdings.push(newHolding);
      await saveHoldingInDB(userId, newHolding);
    }
  } else {
    // SELL holding
    if (holdingIndex >= 0) {
      const h = state.holdings[holdingIndex];
      const newQty = h.quantity - order.quantity;
      if (newQty <= 0) {
        state.holdings.splice(holdingIndex, 1);
        await deleteHoldingInDB(userId, order.symbol);
      } else {
        // Average buy price does NOT change on sell (standard FIFO/Weighted average rule)
        h.quantity = newQty;
        h.totalInvested = parseFloat((h.avgBuyPrice * newQty).toFixed(2));
        await saveHoldingInDB(userId, h);
      }
    }
  }

  // Always update local cache copy as write-through fallback
  saveLocalState(userId, state);
}

async function saveHoldingInDB(userId: string | null, holding: SimulatorHolding) {
  if (!userId) return;
  try {
    const holdingRef = doc(db, 'users', userId, 'simulator_holdings', holding.symbol);
    await withTimeout(setDoc(holdingRef, holding), 1500);
  } catch (err) {
    console.warn(`saveHoldingInDB Firestore write failed/timed out for ${holding.symbol}:`, err);
  }
}

async function deleteHoldingInDB(userId: string | null, symbol: string) {
  if (!userId) return;
  try {
    const holdingRef = doc(db, 'users', userId, 'simulator_holdings', symbol);
    await withTimeout(deleteDoc(holdingRef), 1500);
  } catch (err) {
    console.warn(`deleteHoldingInDB Firestore write failed/timed out for ${symbol}:`, err);
  }
}

// Update MIS positions
async function updatePositions(userId: string | null, state: SimulatorState, order: SimulatorOrder, price: number) {
  const posIndex = state.positions.findIndex(p => p.symbol === order.symbol);
  
  if (posIndex >= 0) {
    const p = state.positions[posIndex];
    const prevQty = p.quantity;
    const orderQty = order.side === 'BUY' ? order.quantity : -order.quantity;
    const newQty = prevQty + orderQty;

    let realizedPnL = p.realizedPnL;
    let avgPrice = p.avgPrice;
    let totalInvested = p.totalInvested;

    // Check if we are reversing or squaring off positions
    const isClosing = (prevQty > 0 && order.side === 'SELL') || (prevQty < 0 && order.side === 'BUY');
    
    if (isClosing) {
      const squaredQty = Math.min(Math.abs(prevQty), order.quantity);
      // Realized profit calculation
      const buyPrice = prevQty > 0 ? p.avgPrice : price;
      const sellPrice = prevQty > 0 ? price : p.avgPrice;
      const pnl = (sellPrice - buyPrice) * squaredQty;
      realizedPnL = parseFloat((realizedPnL + pnl).toFixed(2));

      const remainingQty = prevQty + orderQty;
      if (remainingQty === 0) {
        avgPrice = 0;
        totalInvested = 0;
      } else {
        // Average price remains same for remaining parts
        totalInvested = parseFloat((avgPrice * Math.abs(remainingQty)).toFixed(2));
      }
    } else {
      // Adding to position (averaging up/down)
      const newInvested = p.totalInvested + (price * order.quantity);
      const absQty = Math.abs(newQty);
      avgPrice = parseFloat((newInvested / absQty).toFixed(2));
      totalInvested = parseFloat(newInvested.toFixed(2));
    }

    p.quantity = newQty;
    p.avgPrice = avgPrice;
    p.totalInvested = totalInvested;
    p.realizedPnL = realizedPnL;

    await savePositionInDB(userId, p);
  } else {
    // Initial position
    const qty = order.side === 'BUY' ? order.quantity : -order.quantity;
    const newPosition: SimulatorPosition = {
      symbol: order.symbol,
      quantity: qty,
      avgPrice: price,
      totalInvested: parseFloat((price * order.quantity).toFixed(2)),
      realizedPnL: 0
    };
    state.positions.push(newPosition);
    await savePositionInDB(userId, newPosition);
  }

  // Always update local cache copy as write-through fallback
  saveLocalState(userId, state);
}

async function savePositionInDB(userId: string | null, position: SimulatorPosition) {
  if (!userId) return;
  try {
    const positionRef = doc(db, 'users', userId, 'simulator_positions', position.symbol);
    await withTimeout(setDoc(positionRef, position), 1500);
  } catch (err) {
    console.warn(`savePositionInDB Firestore write failed/timed out for ${position.symbol}:`, err);
  }
}

// Poll Limit Orders and trigger executions
export async function pollLimitOrders(userId: string | null, livePrices: Record<string, number>): Promise<boolean> {
  const state = await getSimulatorState(userId);
  const pendingOrders = state.orders.filter(o => o.status === 'PENDING');
  if (pendingOrders.length === 0) return false;

  let stateChanged = false;

  for (const order of pendingOrders) {
    const livePrice = livePrices[order.symbol];
    if (!livePrice) continue;

    let trigger = false;
    let execPrice = livePrice;

    if (order.type === 'LIMIT' && order.limitPrice) {
      if (order.side === 'BUY' && livePrice <= order.limitPrice) {
        trigger = true;
        execPrice = order.limitPrice; // Filled at limit price
      } else if (order.side === 'SELL' && livePrice >= order.limitPrice) {
        trigger = true;
        execPrice = order.limitPrice;
      }
    } else if (order.type === 'SL' && order.stopPrice) {
      if (order.side === 'BUY' && livePrice >= order.stopPrice) {
        trigger = true;
        execPrice = livePrice; // Filled at market price after trigger
      } else if (order.side === 'SELL' && livePrice <= order.stopPrice) {
        trigger = true;
        execPrice = livePrice;
      }
    }

    if (trigger) {
      order.status = 'EXECUTED';
      order.executionPrice = execPrice;
      
      // Update order fees based on actual execution price
      const { brokerage, taxes } = calculateFees(execPrice, order.quantity);
      order.brokerage = brokerage;
      order.taxes = taxes;

      // Update state
      await executeTradeTransaction(userId, state, order);
      
      // Clear pending document if Firestore
      if (userId) {
        try {
          const orderRef = doc(db, 'users', userId, 'simulator_orders', order.id);
          await withTimeout(updateDoc(orderRef, {
            status: 'EXECUTED',
            executionPrice: execPrice,
            brokerage,
            taxes
          }), 1500);
        } catch (err) {
          console.warn('Failed to update executed order in Firestore, local cache is primary:', err);
        }
      }
      stateChanged = true;
    }
  }

  return stateChanged;
}

// Auto Square Off MIS at Market Close (e.g. past 3:20 PM IST)
export async function checkAutoSquareOff(userId: string | null, livePrices: Record<string, number>): Promise<boolean> {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const formattedParts = formatter.formatToParts(now);
  const hour = parseInt(formattedParts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(formattedParts.find(p => p.type === 'minute')?.value || '0', 10);
  
  const timeInMinutes = hour * 60 + minute;
  const squareOffMinutes = 15 * 60 + 20; // 3:20 PM IST
  const closeMinutes = 15 * 60 + 30; // 3:30 PM IST

  // Only run square off between 3:20 PM and 3:30 PM
  if (timeInMinutes < squareOffMinutes || timeInMinutes >= closeMinutes) {
    return false;
  }

  const state = await getSimulatorState(userId);
  const activeMIS = state.positions.filter(p => p.quantity !== 0);
  if (activeMIS.length === 0) return false;

  console.log(`[Auto-Square-Off] Triggered for ${activeMIS.length} intraday positions at ${hour}:${minute} IST.`);

  for (const pos of activeMIS) {
    const livePrice = livePrices[pos.symbol] || pos.avgPrice;
    await squareOffPosition(userId, pos.symbol, livePrice);
  }

  return true;
}

// Sync local guest simulator data to user Firestore database on sign in
export async function syncLocalDataToFirestore(userId: string): Promise<void> {
  const localState = getLocalState(null);
  
  // If the local state is just the default empty state, do nothing
  if (localState.cash === DEFAULT_BALANCE && 
      localState.holdings.length === 0 && 
      localState.positions.length === 0 && 
      localState.orders.length === 0 && 
      localState.history.length === 0) {
    return;
  }

  try {
    await withTimeout((async () => {
      // 1. Sync wallet/cash if it differs from default
      if (localState.cash !== DEFAULT_BALANCE) {
        const walletRef = doc(db, 'users', userId, 'simulator', 'wallet');
        await setDoc(walletRef, { cash: localState.cash }, { merge: true });
      }

      // 2. Sync holdings
      for (const holding of localState.holdings) {
        const holdingRef = doc(db, 'users', userId, 'simulator_holdings', holding.symbol);
        await setDoc(holdingRef, holding, { merge: true });
      }

      // 3. Sync positions
      for (const position of localState.positions) {
        const positionRef = doc(db, 'users', userId, 'simulator_positions', position.symbol);
        await setDoc(positionRef, position, { merge: true });
      }

      // 4. Sync orders & history
      for (const order of [...localState.orders, ...localState.history]) {
        const orderRef = doc(db, 'users', userId, 'simulator_orders', order.id);
        await setDoc(orderRef, order, { merge: true });
      }

      // After syncing, reset/clear guest local state to default so it doesn't trigger sync again
      const clearedState = { cash: DEFAULT_BALANCE, holdings: [], positions: [], orders: [], history: [] };
      saveLocalState(null, clearedState);
      
      console.log('Successfully synced guest simulator data to user Firestore database.');
    })(), 3000);
  } catch (err) {
    console.error('Failed to sync guest simulator data to Firestore:', err);
  }
}

export async function resetSimulatorState(userId: string | null): Promise<boolean> {
  const defaultState: SimulatorState = { cash: DEFAULT_BALANCE, holdings: [], positions: [], orders: [], history: [] };
  
  if (!userId) {
    saveLocalState(null, defaultState);
    return true;
  }

  try {
    return await withTimeout((async () => {
      // 1. Reset Cash Balance
      const walletRef = doc(db, 'users', userId, 'simulator', 'wallet');
      await setDoc(walletRef, { cash: DEFAULT_BALANCE });

      // 2. Clear Holdings collection
      const holdingsSnap = await getDocs(collection(db, 'users', userId, 'simulator_holdings'));
      for (const d of holdingsSnap.docs) {
        await deleteDoc(doc(db, 'users', userId, 'simulator_holdings', d.id));
      }

      // 3. Clear Positions collection
      const positionsSnap = await getDocs(collection(db, 'users', userId, 'simulator_positions'));
      for (const d of positionsSnap.docs) {
        await deleteDoc(doc(db, 'users', userId, 'simulator_positions', d.id));
      }

      // 4. Clear Orders collection
      const ordersSnap = await getDocs(collection(db, 'users', userId, 'simulator_orders'));
      for (const d of ordersSnap.docs) {
        await deleteDoc(doc(db, 'users', userId, 'simulator_orders', d.id));
      }

      // Also reset local storage backup just in case
      saveLocalState(userId, defaultState);
      return true;
    })(), 4000);
  } catch (err) {
    console.error('Failed to reset simulator state on Firestore:', err);
    return false;
  }
}

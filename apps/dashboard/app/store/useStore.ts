'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

export interface Balance { currency: string; amount: number; change24h: number; changePercent: number; }
export interface Transaction {
  id: string; fromAccount: string; toAccount: string;
  amount: number; currency: string; description: string;
  timestamp: string; status: 'pending' | 'completed' | 'failed';
  type: 'transfer' | 'payment' | 'withdrawal';
}
export interface Account { id: string; name: string; type: 'checking' | 'savings' | 'investment'; balance: number; currency: string; status: 'active' | 'suspended' | 'closed'; }
export interface IntegrationStatus { name: string; status: 'active' | 'inactive' | 'error'; lastCheck: string; responseTime: number; errorCount: number; }

// Interfaces para Ethereum
export interface EthereumConversion {
  originalAmount: number;
  originalCurrency: string;
  ETH: number;
  BTC: number;
  ETHRate: number;
  BTCRate: number;
  timestamp: string;
  source: string;
  valid: boolean;
}

export interface EthereumTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  blockNumber: number;
  status: string;
  originalCurrency: string;
  originalAmount: number;
}

export interface EthereumSwap {
  id: string;
  fromCurrency: string;
  fromAmount: number;
  toCurrency: string;
  toAmount: number;
  exchangeRate: number;
  gasFee: number;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  walletAddress: string;
}

export interface EthereumData {
  conversions: EthereumConversion[];
  transactions: EthereumTransaction[];
  swaps: EthereumSwap[];
  realTimeRates: {
    ETH: { EUR: number; USD: number; GBP: number };
    BTC: { EUR: number; USD: number; GBP: number };
  };
}

export interface DashboardState {
  balances: Balance[]; transactions: Transaction[]; accounts: Account[]; integrations: IntegrationStatus[];
  isLoading: boolean; error: string | null; selectedCurrency: string; dateRange: { start: string; end: string; };
  filters: { transactionType: string[]; accountId: string[]; minAmount: number; maxAmount: number; };
  ethereumData: EthereumData;
  setBalances: (balances: Balance[]) => void; setTransactions: (transactions: Transaction[]) => void; setAccounts: (accounts: Account[]) => void;
  setIntegrations: (integrations: IntegrationStatus[]) => void; setLoading: (loading: boolean) => void; setError: (error: string | null) => void;
  setSelectedCurrency: (currency: string) => void; setDateRange: (range: { start: string; end: string }) => void;
  setFilters: (filters: Partial<DashboardState['filters']>) => void;
  setEthereumData: (ethereumData: EthereumData) => void;
  refreshData: () => Promise<void>; addTransaction: (t: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  updateAccount: (accountId: string, updates: Partial<Account>) => Promise<void>;
  getTotalBalance: () => number; getFilteredTransactions: () => Transaction[]; getAccountById: (id: string) => Account | undefined;
  convertToEthereum: (amount: number, currency: string) => Promise<EthereumConversion | null>;
  executeSwap: (fromCurrency: string, fromAmount: number, walletAddress: string, gasPrice: number) => Promise<EthereumSwap | null>;
}

export const useStore = create<DashboardState>()(
  devtools(
    persist(
      (set, get) => ({
        balances: [], transactions: [], accounts: [], integrations: [],
        isLoading: false, error: null, selectedCurrency: 'EUR',
        dateRange: { start: new Date(Date.now() - 30*24*60*60*1000).toISOString(), end: new Date().toISOString() },
        filters: { transactionType: [], accountId: [], minAmount: 0, maxAmount: Infinity },
        ethereumData: {
          conversions: [],
          transactions: [],
          swaps: [],
          realTimeRates: {
            ETH: { EUR: 0, USD: 0, GBP: 0 },
            BTC: { EUR: 0, USD: 0, GBP: 0 }
          }
        },

        setBalances: (balances) => set({ balances }),
        setTransactions: (transactions) => set({ transactions }),
        setAccounts: (accounts) => set({ accounts }),
        setIntegrations: (integrations) => set({ integrations }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setSelectedCurrency: (selectedCurrency) => set({ selectedCurrency }),
        setDateRange: (dateRange) => set({ dateRange }),
        setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
        setEthereumData: (ethereumData) => set({ ethereumData }),

        refreshData: async () => {
          set({ isLoading: true, error: null });
          try {
            const [ledgerBalancesRes, consolidatedRes, transactionsRes, accountsRes, integrationsRes] = await Promise.all([
              fetch(`${API_BASE}/api/v1/ledger/balances`),
              fetch(`${API_BASE}/api/v1/ledger/consolidated-eur`),
              fetch(`${API_BASE}/api/v1/ledger/transactions?limit=50`),
              fetch(`${API_BASE}/api/v1/accounts`),
              fetch(`${API_BASE}/api/v1/integrations/status`),
            ]);
            
            const [ledgerBalancesJson, consolidatedJson, transactionsJson, accountsJson, integrationsJson] = await Promise.all([
              ledgerBalancesRes.json(), consolidatedRes.json(), transactionsRes.json(), accountsRes.json(), integrationsRes.json(),
            ]);

            // Convertir balances del ledger a formato de Balance
            const normalizedBalances: Balance[] = (consolidatedJson.by_currency || []).map((b: any) => ({
              currency: b.currency,
              amount: parseFloat(b.balance_eur || b.balance || '0'),
              change24h: 0, // Los balances reales no tienen cambio 24h por defecto
              changePercent: 0,
            }));

            set({
              balances: normalizedBalances,
              transactions: transactionsJson.transactions || [],
              accounts: accountsJson.accounts || [],
              integrations: integrationsJson.integrations || [],
              isLoading: false,
            });
          } catch (error: any) {
            set({ error: error?.message || 'Error desconocido', isLoading: false });
          }
        },

        addTransaction: async (transactionData) => {
          try {
            const response = await fetch(`${API_BASE}/api/v1/transfers`, {
              method: 'POST', 
              headers: { 
                'Content-Type': 'application/json',
                'Idempotency-Key': crypto.randomUUID(),
              }, 
              body: JSON.stringify({
                fromAccount: transactionData.fromAccount,
                toAccount: transactionData.toAccount,
                amount: transactionData.amount,
                currency: transactionData.currency || 'EUR',
                reference: transactionData.description,
              }),
            });
            if (!response.ok) throw new Error('Error al crear transacción');
            const newTransaction = await response.json();
            // No agregar a la lista local ya que se recarga desde el ledger
            // set((state) => ({ transactions: [newTransaction, ...state.transactions] }));
          } catch (error: any) {
            set({ error: error?.message || 'Error al crear transacción' });
          }
        },

        updateAccount: async (accountId, updates) => {
          // Placeholder si luego añades PATCH real en API
          set((state) => ({ accounts: state.accounts.map(a => a.id === accountId ? { ...a, ...updates } : a) }));
        },

        getTotalBalance: () => get().balances.reduce((acc, b) => acc + (b.amount || 0), 0),

        getFilteredTransactions: () => {
          const state = get();
          return state.transactions.filter((t) => {
            const f = state.filters;
            if (f.transactionType.length > 0 && !f.transactionType.includes(t.type)) return false;
            if (f.accountId.length > 0 && !f.accountId.includes(t.fromAccount) && !f.accountId.includes(t.toAccount)) return false;
            if (t.amount < f.minAmount || t.amount > f.maxAmount) return false;
            return true;
          });
        },

        getAccountById: (id) => get().accounts.find((a) => a.id === id),

        convertToEthereum: async (amount: number, currency: string) => {
          try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=' + currency.toLowerCase());
            const rates = await response.json();
            
            const ethRate = rates.ethereum[currency.toLowerCase()];
            const btcRate = rates.bitcoin[currency.toLowerCase()];
            
            if (ethRate && btcRate) {
              const conversion: EthereumConversion = {
                originalAmount: amount,
                originalCurrency: currency,
                ETH: amount / ethRate,
                BTC: amount / btcRate,
                ETHRate: ethRate,
                BTCRate: btcRate,
                timestamp: new Date().toISOString(),
                source: "Real Blockchain",
                valid: true
              };
              
              // Actualizar datos de Ethereum en el store
              set((state) => ({
                ethereumData: {
                  ...state.ethereumData,
                  conversions: [...state.ethereumData.conversions, conversion],
                  realTimeRates: {
                    ETH: { ...state.ethereumData.realTimeRates.ETH, [currency]: ethRate },
                    BTC: { ...state.ethereumData.realTimeRates.BTC, [currency]: btcRate }
                  }
                }
              }));
              
              return conversion;
            }
            return null;
          } catch (error) {
            console.error('Error converting to Ethereum:', error);
            return null;
          }
        },

        executeSwap: async (fromCurrency: string, fromAmount: number, walletAddress: string, gasPrice: number) => {
          try {
            // Obtener tasas actuales
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=' + fromCurrency.toLowerCase());
            const rates = await response.json();
            
            const ethRate = rates.ethereum[fromCurrency.toLowerCase()];
            if (!ethRate) {
              throw new Error('No se pudo obtener la tasa de cambio');
            }

            const ethAmount = fromAmount / ethRate;
            const gasFee = gasPrice * 0.000021; // Gas fee estimado
            const finalEthAmount = ethAmount - gasFee;

            const swapTransaction: EthereumSwap = {
              id: Math.random().toString(36).substr(2, 9),
              fromCurrency,
              fromAmount,
              toCurrency: 'ETH',
              toAmount: finalEthAmount,
              exchangeRate: ethRate,
              gasFee,
              transactionHash: '',
              status: 'pending',
              timestamp: new Date().toISOString(),
              walletAddress
            };

            // Ejecutar swap en blockchain
            const swapResponse = await fetch('/api/ethereum/execute-swap', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                swapTransaction,
                walletAddress,
                gasPrice
              }),
            });

            if (!swapResponse.ok) {
              throw new Error('Error ejecutando swap');
            }

            const result = await swapResponse.json();
            
            // Actualizar transacción con hash real
            swapTransaction.transactionHash = result.transactionHash;
            swapTransaction.status = 'confirmed';

            // Actualizar store con el swap
            set((state) => ({
              ethereumData: {
                ...state.ethereumData,
                swaps: [...state.ethereumData.swaps, swapTransaction]
              }
            }));

            return swapTransaction;
          } catch (error) {
            console.error('Error executing swap:', error);
            return null;
          }
        },
      }),
      { name: 'core-banking-dashboard', partialize: (state) => ({ selectedCurrency: state.selectedCurrency, dateRange: state.dateRange, filters: state.filters }) }
    )
  )
);

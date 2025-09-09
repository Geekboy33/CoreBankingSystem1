'use client';
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Database,
  BarChart3,
  Settings,
  Eye,
  DollarSign,
  Calendar,
  Hash
} from 'lucide-react';

interface DTC1BAccount {
  accountNumber: string;
  accountType: string;
  currency: string;
  balance: number;
  bankName?: string;
  iban?: string;
  swiftCode?: string;
  lastTransactionDate?: string;
}

interface DTC1BTransaction {
  transactionId: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  type: string;
  reference?: string;
}

interface FileAnalysis {
  fileName: string;
  fileSize: number;
  encoding: string;
  lines: number;
  fileType: string;
  accounts: DTC1BAccount[];
  transactions: DTC1BTransaction[];
  summary: {
    totalAccounts: number;
    totalBalance: number;
    currencies: string[];
    totalTransactions: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  preview: string[];
  rawData: any;
}

interface FileContent {
  type: 'json' | 'txt' | 'csv' | 'binary' | 'dtc1b';
  content: any;
  parsed: boolean;
  rawText: string;
}

export default function DTC1BReader() {
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSelectedFile(file);

    try {
      // Leer el contenido del archivo
      const content = await readFileContent(file);
      setFileContent(content);

      // Analizar el archivo real
      const analysisResult = await analyzeDTC1BFile(file, content);
      setAnalysis(analysisResult);

    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const readFileContent = async (file: File): Promise<FileContent> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let parsed: any = null;
          let type: 'json' | 'txt' | 'csv' | 'binary' | 'dtc1b' = 'txt';

          // Detectar tipo de archivo DTC1B
          if (file.name.toLowerCase().includes('dtc1b') || 
              content.includes('DTC1B') || 
              content.includes('account') && content.includes('balance')) {
            type = 'dtc1b';
            parsed = parseDTC1BFormat(content);
          }
          // Intentar parsear como JSON
          else if (file.name.endsWith('.json') || content.trim().startsWith('{')) {
            try {
              parsed = JSON.parse(content);
              type = 'json';
            } catch {
              type = 'txt';
            }
          }
          // Detectar CSV
          else if (content.includes(',') && content.includes('\n')) {
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length > 1 && lines[0].includes(',')) {
              type = 'csv';
              parsed = parseCSV(content);
            }
          }

          resolve({
            type,
            content: parsed || content,
            parsed: !!parsed,
            rawText: content
          });
        } catch (err) {
          reject(new Error('Error al leer el archivo'));
        }
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  };

  const parseDTC1BFormat = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const accounts: DTC1BAccount[] = [];
    const transactions: DTC1BTransaction[] = [];
    
    let currentAccount: Partial<DTC1BAccount> = {};
    let currentTransaction: Partial<DTC1BTransaction> = {};
    let inAccountSection = false;
    let inTransactionSection = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim().toUpperCase();
      
      // Detectar secciones
      if (trimmedLine.startsWith('ACCOUNT:')) {
        // Guardar cuenta anterior si existe
        if (currentAccount.accountNumber && currentAccount.balance) {
          accounts.push({
            accountNumber: currentAccount.accountNumber,
            accountType: currentAccount.accountType || 'Checking',
            currency: currentAccount.currency || 'EUR',
            balance: currentAccount.balance,
            bankName: currentAccount.bankName,
            iban: currentAccount.iban,
            swiftCode: currentAccount.swiftCode,
            lastTransactionDate: currentAccount.lastTransactionDate
          });
        }
        
        // Iniciar nueva cuenta
        currentAccount = {
          accountNumber: line.split(':')[1]?.trim() || ''
        };
        inAccountSection = true;
        inTransactionSection = false;
      }
      else if (trimmedLine.startsWith('TRANSACTION:')) {
        // Guardar transacción anterior si existe
        if (currentTransaction.transactionId && currentTransaction.amount) {
          transactions.push({
            transactionId: currentTransaction.transactionId,
            fromAccount: currentTransaction.fromAccount || 'UNKNOWN',
            toAccount: currentTransaction.toAccount || 'UNKNOWN',
            amount: currentTransaction.amount,
            currency: currentTransaction.currency || 'EUR',
            description: currentTransaction.description || '',
            date: currentTransaction.date || new Date().toISOString().split('T')[0],
            type: currentTransaction.type || 'transfer',
            reference: currentTransaction.reference
          });
        }
        
        // Iniciar nueva transacción
        currentTransaction = {
          transactionId: line.split(':')[1]?.trim() || `TXN-${Date.now()}-${index}`
        };
        inTransactionSection = true;
        inAccountSection = false;
      }
      else if (inAccountSection) {
        // Procesar líneas de cuenta
        if (trimmedLine.startsWith('BALANCE:')) {
          currentAccount.balance = parseFloat(line.split(':')[1]?.trim() || '0');
        }
        else if (trimmedLine.startsWith('CURRENCY:')) {
          currentAccount.currency = line.split(':')[1]?.trim() || 'EUR';
        }
        else if (trimmedLine.startsWith('BANK:')) {
          currentAccount.bankName = line.split(':')[1]?.trim();
        }
        else if (trimmedLine.startsWith('TYPE:')) {
          currentAccount.accountType = line.split(':')[1]?.trim();
        }
        else if (trimmedLine.startsWith('IBAN:')) {
          currentAccount.iban = line.split(':')[1]?.trim();
        }
      }
      else if (inTransactionSection) {
        // Procesar líneas de transacción
        if (trimmedLine.startsWith('FROM:')) {
          currentTransaction.fromAccount = line.split(':')[1]?.trim() || 'UNKNOWN';
        }
        else if (trimmedLine.startsWith('TO:')) {
          currentTransaction.toAccount = line.split(':')[1]?.trim() || 'UNKNOWN';
        }
        else if (trimmedLine.startsWith('AMOUNT:')) {
          currentTransaction.amount = parseFloat(line.split(':')[1]?.trim() || '0');
        }
        else if (trimmedLine.startsWith('CURRENCY:')) {
          currentTransaction.currency = line.split(':')[1]?.trim() || 'EUR';
        }
        else if (trimmedLine.startsWith('DATE:')) {
          currentTransaction.date = line.split(':')[1]?.trim();
        }
        else if (trimmedLine.startsWith('DESCRIPTION:')) {
          currentTransaction.description = line.split(':')[1]?.trim();
        }
        else if (trimmedLine.startsWith('TYPE:')) {
          currentTransaction.type = line.split(':')[1]?.trim() || 'transfer';
        }
      }
    });

    // Guardar última cuenta y transacción
    if (currentAccount.accountNumber && currentAccount.balance) {
      accounts.push({
        accountNumber: currentAccount.accountNumber,
        accountType: currentAccount.accountType || 'Checking',
        currency: currentAccount.currency || 'EUR',
        balance: currentAccount.balance,
        bankName: currentAccount.bankName,
        iban: currentAccount.iban,
        swiftCode: currentAccount.swiftCode,
        lastTransactionDate: currentAccount.lastTransactionDate
      });
    }

    if (currentTransaction.transactionId && currentTransaction.amount) {
      transactions.push({
        transactionId: currentTransaction.transactionId,
        fromAccount: currentTransaction.fromAccount || 'UNKNOWN',
        toAccount: currentTransaction.toAccount || 'UNKNOWN',
        amount: currentTransaction.amount,
        currency: currentTransaction.currency || 'EUR',
        description: currentTransaction.description || '',
        date: currentTransaction.date || new Date().toISOString().split('T')[0],
        type: currentTransaction.type || 'transfer',
        reference: currentTransaction.reference
      });
    }

    return { accounts, transactions, rawLines: lines };
  };

  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });

    return data;
  };

  const analyzeDTC1BFile = async (file: File, fileContent: FileContent): Promise<FileAnalysis> => {
    const lines = fileContent.rawText.split('\n').filter(line => line.trim());
    let accounts: DTC1BAccount[] = [];
    let transactions: DTC1BTransaction[] = [];
    let rawData: any = null;

    // Procesar según el tipo de archivo
    if (fileContent.type === 'dtc1b') {
      const parsed = fileContent.content;
      accounts = parsed.accounts || [];
      transactions = parsed.transactions || [];
      rawData = parsed;
    } else if (fileContent.type === 'json') {
      // Extraer datos reales de JSON
      const jsonData = fileContent.content;
      
      if (jsonData.bankAccounts) {
        accounts = jsonData.bankAccounts.map((acc: any) => ({
          accountNumber: acc.accountNumber || acc.account_id || acc.iban,
          accountType: acc.type || 'Checking',
          currency: acc.currency || 'EUR',
          balance: parseFloat(acc.balance) || 0,
          bankName: acc.bank,
          iban: acc.iban,
          swiftCode: acc.swiftCode,
          lastTransactionDate: acc.lastTransactionDate
        }));
      }
      
      if (jsonData.transactions) {
        transactions = jsonData.transactions.map((txn: any) => ({
          transactionId: txn.id || txn.transactionId,
          fromAccount: txn.fromAccount || txn.from,
          toAccount: txn.toAccount || txn.to,
          amount: parseFloat(txn.amount) || 0,
          currency: txn.currency || 'EUR',
          description: txn.description || txn.reference,
          date: txn.date || txn.timestamp,
          type: txn.type || 'transfer',
          reference: txn.reference
        }));
      }
      
      rawData = jsonData;
    } else if (fileContent.type === 'csv') {
      // Extraer datos de CSV
      const csvData = fileContent.content;
      
      csvData.forEach((row: any) => {
        if (row.account || row.accountNumber || row.iban) {
          accounts.push({
            accountNumber: row.account || row.accountNumber || row.iban,
            accountType: row.type || 'Checking',
            currency: row.currency || 'EUR',
            balance: parseFloat(row.balance) || 0,
            bankName: row.bank,
            iban: row.iban,
            swiftCode: row.swiftCode,
            lastTransactionDate: row.date
          });
        }
        
        if (row.amount || row.transactionAmount) {
          transactions.push({
            transactionId: row.id || `TXN-${Date.now()}`,
            fromAccount: row.fromAccount || row.from,
            toAccount: row.toAccount || row.to,
            amount: parseFloat(row.amount || row.transactionAmount) || 0,
            currency: row.currency || 'EUR',
            description: row.description || row.reference,
            date: row.date || row.timestamp,
            type: row.type || 'transfer',
            reference: row.reference
          });
        }
      });
      
      rawData = csvData;
    }

    // Calcular resumen real
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const currencies = [...new Set(accounts.map(acc => acc.currency))];
    const dates = transactions.map(txn => txn.date).filter(Boolean);
    const dateRange = dates.length > 0 ? {
      start: new Date(Math.min(...dates.map(d => new Date(d).getTime()))).toISOString().split('T')[0],
      end: new Date(Math.max(...dates.map(d => new Date(d).getTime()))).toISOString().split('T')[0]
    } : { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };

    return {
      fileName: file.name,
      fileSize: file.size,
      encoding: 'UTF-8',
      lines: lines.length,
      fileType: fileContent.type,
      accounts,
      transactions,
      summary: {
        totalAccounts: accounts.length,
        totalBalance,
        currencies,
        totalTransactions: transactions.length,
        dateRange
      },
      preview: lines.slice(0, 10),
      rawData
    };
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Lector Real DTC1B
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de carga */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isUploading 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-blue-600">Procesando archivo DTC1B...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-gray-600">
                Arrastra un archivo DTC1B aquí o{' '}
                <label htmlFor="file-upload" className="text-blue-500 cursor-pointer hover:underline">
                  selecciona uno
                </label>
              </p>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                accept=".json,.txt,.csv,.bin,.dtc1b"
              />
            </div>
          )}
        </div>

        {/* Errores */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Resultados del análisis */}
        {analysis && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="accounts">Cuentas ({analysis.accounts.length})</TabsTrigger>
              <TabsTrigger value="transactions">Transacciones ({analysis.transactions.length})</TabsTrigger>
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="raw">Datos Crudos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Archivo</p>
                  <p className="font-semibold">{analysis.fileName}</p>
                  <p className="text-xs text-blue-500">{analysis.fileType.toUpperCase()}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Tamaño</p>
                  <p className="font-semibold">{Math.round(analysis.fileSize / 1024)} KB</p>
                  <p className="text-xs text-green-500">{analysis.lines} líneas</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Cuentas</p>
                  <p className="font-semibold">{analysis.summary.totalAccounts}</p>
                  <p className="text-xs text-purple-500">{analysis.summary.currencies.join(', ')}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600">Balance Total</p>
                  <p className="font-semibold">{analysis.summary.totalBalance.toLocaleString()}</p>
                  <p className="text-xs text-orange-500">{analysis.transactions.length} transacciones</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Resumen Financiero Real</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Balance Total</p>
                      <p className="font-semibold">{analysis.summary.totalBalance.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Total Cuentas</p>
                      <p className="font-semibold">{analysis.summary.totalAccounts}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">Transacciones</p>
                      <p className="font-semibold">{analysis.summary.totalTransactions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-600">Rango Fechas</p>
                      <p className="font-semibold text-xs">{analysis.summary.dateRange.start} - {analysis.summary.dateRange.end}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4">
              {analysis.accounts.length > 0 ? (
                <div className="space-y-2">
                  {analysis.accounts.map((account: DTC1BAccount, index: number) => (
                    <div key={index} className="p-4 bg-white border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{account.accountNumber}</p>
                            <Badge variant="outline">{account.currency}</Badge>
                            {account.accountType && (
                              <Badge variant="secondary">{account.accountType}</Badge>
                            )}
                          </div>
                          {account.bankName && (
                            <p className="text-sm text-gray-600">{account.bankName}</p>
                          )}
                          {account.iban && (
                            <p className="text-xs text-gray-500">IBAN: {account.iban}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{account.balance.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{account.currency}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No se encontraron cuentas en el archivo</p>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              {analysis.transactions.length > 0 ? (
                <div className="space-y-2">
                  {analysis.transactions.map((transaction: DTC1BTransaction, index: number) => (
                    <div key={index} className="p-3 bg-white border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{transaction.transactionId}</p>
                            <Badge variant="outline">{transaction.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{transaction.description}</p>
                          <p className="text-xs text-gray-500">
                            {transaction.fromAccount} → {transaction.toAccount}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{transaction.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{transaction.currency}</p>
                          <p className="text-xs text-gray-400">{transaction.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No se encontraron transacciones en el archivo</p>
              )}
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Vista Previa del Archivo</h3>
                <div className="bg-white p-3 rounded border font-mono text-sm max-h-60 overflow-y-auto">
                  {analysis.preview.map((line, index) => (
                    <div key={index} className="text-gray-700 border-b border-gray-100 py-1">
                      <span className="text-gray-400 mr-2">{index + 1}:</span>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="raw" className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Datos Extraídos (JSON)</h3>
                <div className="bg-white p-3 rounded border font-mono text-sm max-h-60 overflow-y-auto">
                  <pre className="text-gray-700">
                    {JSON.stringify(analysis.rawData, null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

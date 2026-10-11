/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/common/AuthScreen';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ITAssetsView } from './components/it-assets/ITAssetsView';
import { CustodyMatrixView } from './components/custody/CustodyMatrixView';
import { StockOpnameView } from './components/stock-opname/StockOpnameView';

// Modals
import { BASTModal } from './components/common/BASTModal';
import { QRCodeModal } from './components/common/QRCodeModal';
import { AddAssetModal } from './components/common/AddAssetModal';
import { AssignAssetModal } from './components/common/AssignAssetModal';
import { ServiceRepairModal } from './components/common/ServiceRepairModal';
import { ITAsset, CustodyRecord } from './types/inventory';

function MainAppLayout() {
  const { activeTab, custodyRecords, isDatabaseReady, databaseError, retryDatabaseLoad } = useInventory();

  // Modal States
  const [activeBASTRecord, setActiveBASTRecord] = useState<CustodyRecord | null>(null);
  const [activeQRAsset, setActiveQRAsset] = useState<ITAsset | null>(null);
  const [activeAssignAsset, setActiveAssignAsset] = useState<ITAsset | null>(null);
  const [activeServiceAsset, setActiveServiceAsset] = useState<ITAsset | null>(null);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);

  // Trigger handlers
  const handleOpenBASTModal = (record: CustodyRecord) => {
    setActiveBASTRecord(record);
  };

  const handleOpenQRCodeModal = (asset: ITAsset) => {
    setActiveQRAsset(asset);
  };

  const handleOpenAssignModal = (asset: ITAsset) => {
    setActiveAssignAsset(asset);
  };

  const handleOpenServiceModal = (asset: ITAsset) => {
    setActiveServiceAsset(asset);
  };

  const handleAssignedSuccess = (recordId: string) => {
    setActiveAssignAsset(null);
    const newRecord = custodyRecords.find(r => r.id === recordId);
    if (newRecord) {
      setActiveBASTRecord(newRecord);
    }
  };

  return (
    !isDatabaseReady ? (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center shadow-lg">
          <h1 className="text-lg font-bold text-slate-900">
            {databaseError ? 'Database belum siap' : 'Menghubungkan ke database...'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {databaseError || 'Memuat data inventaris bersama dari MySQL.'}
          </p>
          {databaseError && (
            <button onClick={retryDatabaseLoad} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              Coba lagi
            </button>
          )}
        </div>
      </main>
    ) : (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header 
          onOpenAddAssetModal={() => setIsAddAssetModalOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView 
              onOpenAddAssetModal={() => setIsAddAssetModalOpen(true)}
              onOpenQRCodeModal={handleOpenQRCodeModal}
              onOpenServiceModal={handleOpenServiceModal}
            />
          )}

          {activeTab === 'it-assets' && (
            <ITAssetsView 
              onOpenAddModal={() => setIsAddAssetModalOpen(true)}
              onOpenQRCodeModal={handleOpenQRCodeModal}
              onOpenAssignModal={handleOpenAssignModal}
              onOpenServiceModal={handleOpenServiceModal}
            />
          )}

          {activeTab === 'custody' && (
            <CustodyMatrixView 
              onOpenBASTModal={handleOpenBASTModal}
              onOpenAssignModal={handleOpenAssignModal}
            />
          )}

          {activeTab === 'opname' && (
            <StockOpnameView />
          )}
        </main>
      </div>

      {/* Modals Container */}
      <BASTModal
        record={activeBASTRecord}
        onClose={() => setActiveBASTRecord(null)}
      />

      <QRCodeModal
        asset={activeQRAsset}
        onClose={() => setActiveQRAsset(null)}
      />

      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
      />

      <AssignAssetModal
        asset={activeAssignAsset}
        onClose={() => setActiveAssignAsset(null)}
        onAssignedSuccess={handleAssignedSuccess}
      />

      <ServiceRepairModal
        asset={activeServiceAsset}
        isOpen={activeServiceAsset !== null}
        onClose={() => setActiveServiceAsset(null)}
      />
    </div>
    )
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <main className="min-h-screen flex items-center justify-center text-sm text-slate-600">Memeriksa sesi masuk...</main>;
  }
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <InventoryProvider>
      <MainAppLayout />
    </InventoryProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

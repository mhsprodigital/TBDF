import React, { useState } from 'react';
import { PatientRecord, FieldDefinition } from './types';
import { parseCSV, generateCSV } from './services/csvService';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientForm from './components/PatientForm';
import DictionaryModal from './components/DictionaryModal';
import { FIELD_DICTIONARY } from './constants';

type ViewMode = 'dashboard' | 'list' | 'form';

function App() {
  const [data, setData] = useState<PatientRecord[]>([]);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | undefined>(undefined);
  const [showDictionary, setShowDictionary] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  // Editable Dictionary State
  const [dictionary, setDictionary] = useState<Record<string, FieldDefinition>>(FIELD_DICTIONARY);

  // Handle File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        setData(parsedData);
      };
      reader.readAsText(file);
    }
  };

  // Handle Export
  const handleExport = () => {
    const csvContent = generateCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'export_sinan_tb.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CRUD Operations
  const handleSavePatient = (patient: PatientRecord) => {
    const isNew = !data.some(p => p['NU_NOTIFIC'] === patient['NU_NOTIFIC']);
    
    if (isNew) {
      setData(prev => [...prev, patient]);
    } else {
      setData(prev => prev.map(p => p['NU_NOTIFIC'] === patient['NU_NOTIFIC'] ? patient : p));
    }
    setView('list');
    setSelectedPatient(undefined);
  };

  const handleDeletePatient = (id: string) => {
    setData(prev => prev.filter(p => p['NU_NOTIFIC'] !== id));
  };

  const startEdit = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setView('form');
  };

  const startNew = () => {
    setSelectedPatient(undefined);
    setView('form');
  };

  const handleUpdateDictionary = (updatedFields: Record<string, FieldDefinition>) => {
    setDictionary(updatedFields);
  };

  return (
    <div className="flex h-screen bg-background font-sans text-text overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-gray-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-black font-bold">
              TB
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">SGP Auditoria</h1>
          </div>
          <p className="text-xs text-secondary mt-1">Gestão de Tuberculose DF</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-gray-800 text-primary' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </button>
          <button 
            onClick={() => setView('list')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${view === 'list' ? 'bg-gray-800 text-primary' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Prontuários
          </button>
          <button 
             onClick={() => setShowDictionary(true)}
             className="flex items-center w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Dicionário
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="bg-card p-3 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Importar Dados (SINAN CSV)</p>
            <label className="block w-full cursor-pointer bg-gray-800 hover:bg-gray-700 text-center py-2 px-3 rounded text-sm text-gray-300 transition-colors">
              Carregar Arquivo
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            {fileName && <p className="text-[10px] text-primary mt-2 truncate">{fileName}</p>}
          </div>
          <button 
            onClick={handleExport}
            disabled={data.length === 0}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 rounded text-sm text-gray-300 bg-transparent border border-gray-700 hover:bg-gray-800 disabled:opacity-50"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             Exportar CSV
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-sidebar p-4 border-b border-gray-800 flex justify-between items-center">
            <span className="font-bold text-white">SGP Auditoria</span>
            <div className="flex gap-2">
              <button onClick={() => setView('dashboard')} className="p-2 text-gray-300">Dash</button>
              <button onClick={() => setView('list')} className="p-2 text-gray-300">Lista</button>
            </div>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-10 scroll-smooth">
          {view === 'dashboard' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white">Visão Geral</h2>
                <p className="text-secondary">Indicadores estratégicos do Programa de Controle da Tuberculose</p>
              </div>
              {data.length > 0 ? (
                <Dashboard data={data} />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-700 rounded-lg">
                  <p className="text-gray-400 mb-4">Nenhum dado carregado.</p>
                  <label className="cursor-pointer bg-primary text-black font-semibold py-2 px-6 rounded-full hover:opacity-90 transition">
                    Carregar CSV
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          )}

          {view === 'list' && (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-end mb-6">
                 <div>
                  <h2 className="text-3xl font-bold text-white">Pacientes</h2>
                  <p className="text-secondary">Gerencie os registros de notificação</p>
                 </div>
                 <button 
                  onClick={startNew}
                  className="bg-primary text-black font-semibold py-2 px-4 rounded-lg hover:bg-emerald-400 transition shadow-[0_0_15px_rgba(0,255,162,0.2)]"
                 >
                   + Nova Notificação
                 </button>
              </div>
              <PatientList data={data} dictionary={dictionary} onEdit={startEdit} onDelete={handleDeletePatient} />
            </div>
          )}

          {view === 'form' && (
            <div className="h-full">
              <PatientForm 
                initialData={selectedPatient} 
                dictionary={dictionary}
                onSave={handleSavePatient}
                onCancel={() => {
                  setSelectedPatient(undefined);
                  setView('list');
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showDictionary && (
        <DictionaryModal 
          dictionary={dictionary} 
          onUpdate={handleUpdateDictionary} 
          onClose={() => setShowDictionary(false)} 
        />
      )}
    </div>
  );
}

export default App;

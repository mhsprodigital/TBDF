import React, { useState } from 'react';
import { FieldDefinition } from '../types';

interface DictionaryModalProps {
  dictionary: Record<string, FieldDefinition>;
  onUpdate: (newDictionary: Record<string, FieldDefinition>) => void;
  onClose: () => void;
}

const DictionaryModal: React.FC<DictionaryModalProps> = ({ dictionary, onUpdate, onClose }) => {
  const [mode, setMode] = useState<'definitions' | 'codes'>('definitions');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempField, setTempField] = useState<FieldDefinition | null>(null);
  
  // For code editing
  const [selectedFieldForCodes, setSelectedFieldForCodes] = useState<string | null>(null);
  const [newCodeKey, setNewCodeKey] = useState('');
  const [newCodeValue, setNewCodeValue] = useState('');

  const fields = Object.values(dictionary);
  const fieldsWithCodes = fields.filter(f => f.optionsMap || f.options);

  // --- Field Definition Editing ---
  const handleEditField = (field: FieldDefinition) => {
    setEditingId(field.id);
    setTempField({ ...field });
  };

  const handleSaveField = () => {
    if (tempField && editingId) {
      onUpdate({
        ...dictionary,
        [editingId]: tempField
      });
      setEditingId(null);
      setTempField(null);
    }
  };

  const handleChangeTemp = (key: keyof FieldDefinition, value: string) => {
    if (tempField) {
      setTempField({ ...tempField, [key]: value });
    }
  };

  // --- Code Map Editing ---
  const handleAddCode = () => {
    if (!selectedFieldForCodes || !newCodeKey || !newCodeValue) return;
    
    const field = dictionary[selectedFieldForCodes];
    const newOptionsMap = { ...(field.optionsMap || {}), [newCodeKey]: newCodeValue };
    
    onUpdate({
      ...dictionary,
      [selectedFieldForCodes]: {
        ...field,
        optionsMap: newOptionsMap
      }
    });
    setNewCodeKey('');
    setNewCodeValue('');
  };

  const handleRemoveCode = (codeKey: string) => {
    if (!selectedFieldForCodes) return;
    const field = dictionary[selectedFieldForCodes];
    const newOptionsMap = { ...field.optionsMap };
    delete newOptionsMap[codeKey];
    
    onUpdate({
        ...dictionary,
        [selectedFieldForCodes]: {
          ...field,
          optionsMap: newOptionsMap
        }
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-6xl h-[90vh] rounded-lg shadow-2xl flex flex-col border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-sidebar">
          <div>
            <h2 className="text-xl font-bold text-white">Editor de Dicionário</h2>
            <p className="text-sm text-secondary">Edite rótulos, descrições e códigos.</p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={() => {
                    const blob = new Blob([JSON.stringify(dictionary, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'sinan_dictionary_config.json';
                    link.click();
                }}
                className="text-xs bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-600"
             >
                Baixar Configuração
             </button>
             <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>
        
        {/* Toggle Tabs */}
        <div className="flex border-b border-gray-700 bg-sidebar px-6">
          <button
            onClick={() => setMode('definitions')}
            className={`mr-6 py-3 text-sm font-medium border-b-2 transition-colors ${mode === 'definitions' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'}`}
          >
            Editar Campos (Rótulos/Descrições)
          </button>
          <button
            onClick={() => setMode('codes')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${mode === 'codes' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'}`}
          >
            Editar Códigos (Valores)
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-background custom-scrollbar">
          {mode === 'definitions' ? (
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase bg-sidebar text-gray-300 sticky top-0 shadow-sm z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 w-1/6">Campo (ID)</th>
                  <th scope="col" className="px-6 py-3 w-1/4">Rótulo (Título)</th>
                  <th scope="col" className="px-6 py-3 w-1/2">Descrição</th>
                  <th scope="col" className="px-6 py-3 w-1/12">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {fields.map((field) => (
                  <tr key={field.id} className="hover:bg-sidebar/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-primary font-medium">{field.id}</td>
                    
                    {editingId === field.id ? (
                        <>
                            <td className="px-6 py-3">
                                <input 
                                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full text-white"
                                    value={tempField?.label || ''}
                                    onChange={(e) => handleChangeTemp('label', e.target.value)}
                                />
                            </td>
                            <td className="px-6 py-3">
                                <input 
                                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full text-white"
                                    value={tempField?.description || ''}
                                    onChange={(e) => handleChangeTemp('description', e.target.value)}
                                />
                            </td>
                            <td className="px-6 py-3">
                                <button onClick={handleSaveField} className="text-green-400 hover:text-green-300 mr-2 font-bold">Salvar</button>
                                <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300">Cancelar</button>
                            </td>
                        </>
                    ) : (
                        <>
                            <td className="px-6 py-3 text-white">{field.label}</td>
                            <td className="px-6 py-3">{field.description}</td>
                            <td className="px-6 py-3">
                                <button onClick={() => handleEditField(field)} className="text-blue-400 hover:text-blue-300">Editar</button>
                            </td>
                        </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex h-full gap-6">
                {/* List of Fields with Codes */}
                <div className="w-1/3 border-r border-gray-800 pr-4 overflow-y-auto">
                    <h3 className="text-white font-bold mb-4 sticky top-0 bg-background py-2">Selecione o Campo:</h3>
                    {fieldsWithCodes.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSelectedFieldForCodes(f.id)}
                            className={`block w-full text-left px-4 py-3 rounded mb-1 transition-colors ${selectedFieldForCodes === f.id ? 'bg-primary text-black font-bold' : 'bg-card text-gray-300 hover:bg-gray-800'}`}
                        >
                            <span className="block text-xs opacity-70">{f.id}</span>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Code Editor for Selected Field */}
                <div className="flex-1 overflow-y-auto">
                    {selectedFieldForCodes ? (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold text-lg">
                                    Códigos para: <span className="text-primary">{selectedFieldForCodes}</span>
                                </h3>
                            </div>

                            {/* Add New Code */}
                            <div className="bg-gray-800 p-4 rounded mb-6 border border-gray-700">
                                <h4 className="text-xs uppercase text-gray-400 mb-2">Adicionar Novo Código</h4>
                                <div className="flex gap-2">
                                    <input 
                                        placeholder="Código (ex: 1)" 
                                        className="bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 w-1/4"
                                        value={newCodeKey}
                                        onChange={e => setNewCodeKey(e.target.value)}
                                    />
                                    <input 
                                        placeholder="Significado (ex: Positivo)" 
                                        className="bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 flex-1"
                                        value={newCodeValue}
                                        onChange={e => setNewCodeValue(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleAddCode}
                                        disabled={!newCodeKey || !newCodeValue}
                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </div>

                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase text-gray-500 bg-gray-900/50">
                                    <tr>
                                    <th className="px-4 py-2 text-left w-20">Código</th>
                                    <th className="px-4 py-2 text-left">Significado</th>
                                    <th className="px-4 py-2 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {dictionary[selectedFieldForCodes].optionsMap ? (
                                        Object.entries(dictionary[selectedFieldForCodes].optionsMap!).map(([code, meaning]) => (
                                        <tr key={code} className="hover:bg-white/5">
                                            <td className="px-4 py-3 font-mono text-white font-bold">{code}</td>
                                            <td className="px-4 py-3 text-gray-300">{meaning}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => handleRemoveCode(code)} className="text-red-400 hover:text-red-300 text-xs">Remover</button>
                                            </td>
                                        </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={3} className="p-4 text-center text-gray-500">Este campo usa uma lista simples, não um mapa de códigos. Edite a definição se necessário.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-500">
                            Selecione um campo à esquerda para editar seus códigos.
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DictionaryModal;

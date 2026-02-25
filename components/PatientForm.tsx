import React, { useState, useMemo, useEffect } from 'react';
import { PatientRecord, FieldDefinition } from '../types';
import { FIELD_GROUPS, DEFAULT_FIELD_DEF } from '../constants';
import { getGeoByCode, suggestGeoByAddress, GeoLocation } from '../sinan_geo';
import { toInputDate, fromInputDate } from '../services/csvService';
import { generateIndividualReport } from '../services/reportService';

interface PatientFormProps {
  initialData?: PatientRecord;
  dictionary: Record<string, FieldDefinition>;
  onSave: (data: PatientRecord) => void;
  onCancel: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ initialData, dictionary, onSave, onCancel }) => {
  const [formData, setFormData] = useState<PatientRecord>(initialData || {});
  const [activeTab, setActiveTab] = useState(0);
  const [geoInfo, setGeoInfo] = useState<GeoLocation | undefined>(undefined);
  const [geoSuggestion, setGeoSuggestion] = useState<GeoLocation | undefined>(undefined);

  // Identify all fields that are present in formData or Dictionary but NOT in groups
  const otherFields = useMemo(() => {
    const groupedFields = new Set(FIELD_GROUPS.flatMap(g => g.fields));
    // Also exclude the High Priority fields (Status, Mês, Observações) as they are handled separately
    groupedFields.add('Status');
    groupedFields.add('Mês');
    groupedFields.add('Observações');

    const allKeys = Object.keys(formData);
    const unmapped = allKeys.filter(key => !groupedFields.has(key));
    return unmapped;
  }, [formData]);

  // Effect to update Geo Info when ID_BAIRRO changes
  useEffect(() => {
    const code = formData['ID_BAIRRO'];
    const found = getGeoByCode(code);
    setGeoInfo(found);

    if (!found) {
      // Try to suggest
      const address = formData['NM_LOGRADO'] || '';
      const district = formData['NM_BAIRRO'] || '';
      if (address || district) {
        const suggestion = suggestGeoByAddress(address, district);
        setGeoSuggestion(suggestion);
      } else {
        setGeoSuggestion(undefined);
      }
    } else {
      setGeoSuggestion(undefined);
    }
  }, [formData['ID_BAIRRO'], formData['NM_LOGRADO'], formData['NM_BAIRRO']]);

  const handleChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (id: string, inputValue: string) => {
    // Input comes as YYYY-MM-DD, we save as DD/MM/YYYY for CSV consistency
    const csvDate = fromInputDate(inputValue);
    handleChange(id, csvDate);
  };

  const applySuggestion = () => {
    if (geoSuggestion) {
      setFormData(prev => ({ ...prev, 'ID_BAIRRO': geoSuggestion.id_bairro }));
    }
  };

  const getFieldDef = (id: string) => {
    return dictionary[id] || { ...DEFAULT_FIELD_DEF, id, label: id };
  };

  const renderField = (fieldId: string) => {
    const def = getFieldDef(fieldId);
    const value = formData[fieldId] || '';
    
    // Validation Colors
    let borderClass = 'border-gray-700';
    let bgClass = 'bg-sidebar';
    
    if (!value) {
      // Empty: Alert Red
      borderClass = 'border-red-500/50';
      bgClass = 'bg-red-900/10';
    } else if (def.optionsMap && !def.optionsMap[value] && !def.options?.includes(value)) {
       // Exists but not in dictionary map (Non-standard): Warning Yellow
       borderClass = 'border-yellow-500/70';
       bgClass = 'bg-yellow-900/10';
    } else if (value) {
       // Valid: Green tint
       borderClass = 'border-green-800';
    }

    return (
      <div key={fieldId} className="flex flex-col space-y-1 mb-4">
        {/* Hierarchy: Label -> Code -> Input -> Description */}
        
        {/* Row 1: Main Label */}
        <label className="text-sm font-bold text-white tracking-wide" htmlFor={fieldId}>
            {def.label}
        </label>
        
        {/* Row 2: SINAN Code (Secondary Title) */}
        <span className="text-[10px] font-mono text-primary/80 mb-1 block">
            {def.id}
        </span>

        {/* Row 3: Input Field */}
        {def.type === 'textarea' ? (
          <textarea
            id={fieldId}
            rows={4}
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value)}
            className={`${bgClass} ${borderClass} border text-white text-sm rounded-md focus:ring-1 focus:ring-primary focus:border-primary block w-full p-2.5 placeholder-gray-600 transition-colors`}
            placeholder="Digite aqui..."
          />
        ) : def.type === 'date' ? (
            <input
            type="date"
            id={fieldId}
            // Convert DD/MM/YYYY -> YYYY-MM-DD for the input view
            value={toInputDate(value)} 
            onChange={(e) => handleDateChange(fieldId, e.target.value)}
            className={`${bgClass} ${borderClass} border text-white text-sm rounded-md focus:ring-1 focus:ring-primary focus:border-primary block w-full p-2.5 placeholder-gray-600 transition-colors appearance-none`}
          />
        ) : def.optionsMap || def.options ? (
          <select
            id={fieldId}
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value)}
            // Ensure contrast on options with bg-sidebar text-white
            className={`${bgClass} ${borderClass} border text-white text-sm rounded-md focus:ring-1 focus:ring-primary focus:border-primary block w-full p-2.5 transition-colors`}
          >
            <option value="" className="bg-sidebar text-gray-400">Selecione...</option>
            
            {/* Handle Dictionary Map (Code -> Meaning) */}
            {def.optionsMap ? (
                Object.entries(def.optionsMap).map(([code, meaning]) => (
                    <option key={code} value={code} className="bg-sidebar text-white">
                        {code} - {meaning}
                    </option>
                ))
            ) : (
                /* Handle Simple List */
                def.options?.map(opt => (
                    <option key={opt} value={opt.split(' - ')[0]} className="bg-sidebar text-white">
                        {opt}
                    </option>
                ))
            )}
          </select>
        ) : (
          <input
            type="text"
            id={fieldId}
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value)}
            className={`${bgClass} ${borderClass} border text-white text-sm rounded-md focus:ring-1 focus:ring-primary focus:border-primary block w-full p-2.5 placeholder-gray-600 transition-colors`}
            placeholder="Vazio"
          />
        )}
        
        {/* Row 4: Description */}
        <p className="text-xs text-gray-400 leading-tight pt-1">{def.description}</p>
      </div>
    );
  };

  return (
    <div className="bg-card border border-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="bg-sidebar px-6 py-4 border-b border-gray-700 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">Prontuário Eletrônico</h2>
          <p className="text-sm text-secondary">
            {formData['NU_NOTIFIC'] ? `Notificação: ${formData['NU_NOTIFIC']}` : 'Novo Registro'}
          </p>
        </div>
        <div className="flex gap-3">
          {formData['NU_NOTIFIC'] && (
              <button 
                onClick={() => generateIndividualReport(formData, dictionary)}
                className="px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Imprimir Ficha Completa
              </button>
          )}
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Voltar
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-4 py-2 rounded-md bg-primary text-black font-semibold hover:bg-emerald-400 transition-colors shadow-[0_0_10px_rgba(0,255,162,0.3)]"
          >
            Salvar & Fechar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Priority Section: Management */}
        <div className="p-6 bg-gray-900/50 border-b border-gray-800">
          <h3 className="text-sm font-bold text-primary mb-4 flex items-center uppercase tracking-widest">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            Gestão de Caso (Prioridade)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
            {renderField('Status')}
            {renderField('Mês')}
          </div>
          <div className="w-full">
            {renderField('Observações')}
          </div>
        </div>

        {/* Geo Auto-Location Section */}
        <div className="p-6 bg-blue-900/10 border-b border-gray-800">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-blue-400 flex items-center uppercase tracking-widest">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Geolocalização Automática
              </h3>
              <span className="text-xs text-gray-500">Baseada no ID_BAIRRO</span>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                {renderField('ID_BAIRRO')}
                {geoSuggestion && (
                   <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-md">
                     <p className="text-xs text-yellow-500 mb-1">⚠️ ID_BAIRRO ausente. Sugestão encontrada:</p>
                     <p className="text-sm text-white font-bold">{geoSuggestion.bairro} ({geoSuggestion.id_bairro})</p>
                     <p className="text-[10px] text-gray-400 mt-1 mb-2 line-clamp-2">{geoSuggestion.descricao}</p>
                     <button 
                       onClick={applySuggestion}
                       className="text-xs bg-yellow-600 text-black px-2 py-1 rounded hover:bg-yellow-500 font-semibold w-full"
                     >
                       Aplicar ID {geoSuggestion.id_bairro}
                     </button>
                   </div>
                )}
              </div>
              
              <div className="lg:col-span-2 grid grid-cols-2 gap-4 bg-gray-900 p-4 rounded-md border border-gray-800">
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Região de Saúde</span>
                    <p className="text-white font-medium text-lg">{geoInfo?.regiao_saude || '---'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Região Administrativa</span>
                    <p className="text-white font-medium text-lg">{geoInfo?.ra || '---'}</p>
                  </div>
                  <div className="col-span-2">
                     <span className="text-xs text-gray-500 uppercase">Descrição do Bairro</span>
                     <p className="text-gray-300 text-sm mt-1">{geoInfo?.descricao || 'Sem informações'}</p>
                  </div>
              </div>
           </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-10 bg-sidebar border-b border-gray-700 flex overflow-x-auto px-2">
          {FIELD_GROUPS.map((group, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === index 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {group.title}
            </button>
          ))}
          {otherFields.length > 0 && (
            <button
              onClick={() => setActiveTab(FIELD_GROUPS.length)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === FIELD_GROUPS.length 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              Outros / Não Mapeados ({otherFields.length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTab < FIELD_GROUPS.length ? (
              FIELD_GROUPS[activeTab].fields.map((fieldId) => renderField(fieldId))
            ) : (
              otherFields.map((fieldId) => renderField(fieldId))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientForm;
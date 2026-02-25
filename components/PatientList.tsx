import React, { useState, useMemo } from 'react';
import { PatientRecord, FieldDefinition } from '../types';
import { getGeoByCode } from '../sinan_geo';
import { generateTeamReport } from '../services/reportService';

interface PatientListProps {
  data: PatientRecord[];
  dictionary: Record<string, FieldDefinition>;
  onEdit: (patient: PatientRecord) => void;
  onDelete: (id: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ data, dictionary, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterRA, setFilterRA] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Get Status Options from Dictionary
  const statusOptions = dictionary['Status']?.options || [];

  // Helper to extract MM/YYYY from DD/MM/YYYY
  const getNotificationMonth = (dateStr: string) => {
    if (!dateStr || dateStr.length < 10) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`; // MM/YYYY
    }
    return '';
  };

  // Derive geo options and month options from current data
  const filterOptions = useMemo(() => {
     const regions = new Set<string>();
     const ras = new Set<string>();
     const months = new Set<string>();

     data.forEach(p => {
        const geo = getGeoByCode(p['ID_BAIRRO']);
        if (geo) {
          regions.add(geo.regiao_saude);
          ras.add(geo.ra);
        }
        const month = getNotificationMonth(p['DT_NOTIFIC']);
        if (month) months.add(month);
     });

     // Sort months chronologically (MM/YYYY) is tricky to sort alphabetically, so we do custom sort
     const sortedMonths = Array.from(months).sort((a, b) => {
       const [ma, ya] = a.split('/').map(Number);
       const [mb, yb] = b.split('/').map(Number);
       return (ya * 12 + ma) - (yb * 12 + mb);
     });

     return { 
       regions: Array.from(regions).sort(), 
       ras: Array.from(ras).sort(),
       months: sortedMonths.reverse() // Newest first
     };
  }, [data]);

  const filteredData = data.filter(p => {
    const term = searchTerm.toLowerCase();
    const geo = getGeoByCode(p['ID_BAIRRO']);
    const notifMonth = getNotificationMonth(p['DT_NOTIFIC']);
    
    const matchesTerm = (
      (p['NM_PACIENT'] && p['NM_PACIENT'].toLowerCase().includes(term)) ||
      (p['NU_NOTIFIC'] && p['NU_NOTIFIC'].toLowerCase().includes(term))
    );

    const matchesRegion = filterRegion ? geo?.regiao_saude === filterRegion : true;
    const matchesRA = filterRA ? geo?.ra === filterRA : true;
    const matchesStatus = filterStatus ? p['Status'] === filterStatus : true;
    const matchesMonth = filterMonth ? notifMonth === filterMonth : true;

    return matchesTerm && matchesRegion && matchesRA && matchesStatus && matchesMonth;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-card p-4 rounded-lg border border-gray-800 flex flex-col gap-4">
         <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
             <h3 className="text-gray-400 text-sm font-semibold uppercase">Filtros de Lista</h3>
             <button 
                onClick={() => generateTeamReport(filteredData)}
                className="flex items-center gap-2 bg-blue-900/30 border border-blue-500 text-blue-400 px-3 py-1 rounded text-xs font-bold hover:bg-blue-500 hover:text-white transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Gerar Relatório de Equipe
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="relative w-full md:col-span-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
                type="text" 
                placeholder="Buscar..." 
                className="block w-full p-2.5 pl-10 text-sm text-white border border-gray-700 rounded-lg bg-gray-900 focus:ring-primary focus:border-primary placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
            </div>

            <select 
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
            >
            <option value="">Mês Notificação</option>
            {filterOptions.months.map(m => (
                <option key={m} value={m}>{m}</option>
            ))}
            </select>

            <select 
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
            >
            <option value="">Todos Status</option>
            {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
            </select>

            <select 
            value={filterRegion}
            onChange={(e) => { setFilterRegion(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
            >
            <option value="">Região Saúde</option>
            {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <select 
            value={filterRA}
            onChange={(e) => { setFilterRA(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
            >
            <option value="">Região Adm.</option>
            {filterOptions.ras.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>
      </div>
      
      <div className="flex justify-between text-sm text-secondary px-2">
        <span>Mostrando {paginatedData.length} de {filteredData.length} registros</span>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-800">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-sidebar">
            <tr>
              <th scope="col" className="px-6 py-3">Notificação</th>
              <th scope="col" className="px-6 py-3">Mês</th>
              <th scope="col" className="px-6 py-3">Paciente</th>
              <th scope="col" className="px-6 py-3">Localização</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((patient, index) => {
                const geo = getGeoByCode(patient['ID_BAIRRO']);
                const notifMonth = getNotificationMonth(patient['DT_NOTIFIC']);
                return (
                  <tr key={index} className="bg-card border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-primary">{patient['NU_NOTIFIC']}</td>
                    <td className="px-6 py-4 text-white">{notifMonth}</td>
                    <td className="px-6 py-4 font-medium text-white">
                      <div>{patient['NM_PACIENT'] || 'Não informado'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {geo ? (
                        <div>
                          <p className="text-white text-xs">{geo.ra}</p>
                          <p className="text-[10px] text-gray-500">{geo.regiao_saude}</p>
                        </div>
                      ) : (
                        <span className="text-gray-600 italic">Não identificado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                         {patient['Status'] ? (
                             <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-800">
                                {patient['Status']}
                             </span>
                         ) : (
                             <span className="text-gray-600">-</span>
                         )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => onEdit(patient)}
                        className="font-medium text-blue-400 hover:underline"
                      >
                        Abrir
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este registro?')) {
                            onDelete(patient['NU_NOTIFIC']);
                          }
                        }}
                        className="font-medium text-red-500 hover:underline"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 text-sm font-medium text-white bg-card border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-400">
          Página {page} de {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-card border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

export default PatientList;
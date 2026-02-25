import React, { useMemo, useState } from 'react';
import { PatientRecord } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { getGeoByCode } from '../sinan_geo';
import { SINAN_DICTIONARY } from '../sinan_data';
import { generateDashboardReport } from '../services/reportService';

interface DashboardProps {
  data: PatientRecord[];
}

const COLORS = ['#00ffa2', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const STATUS_COLORS = {
  success: '#00ffa2',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#64748b'
};

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // --- Global Filter State ---
  const [filterRegion, setFilterRegion] = useState('');
  const [filterRA, setFilterRA] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // --- Extract Filter Options ---
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
       // Extract MM/YYYY
       if (p['DT_NOTIFIC'] && p['DT_NOTIFIC'].length >= 10) {
         const parts = p['DT_NOTIFIC'].split('/');
         if (parts.length === 3) months.add(`${parts[1]}/${parts[2]}`);
       }
    });

    const sortedMonths = Array.from(months).sort((a, b) => {
      const [ma, ya] = a.split('/').map(Number);
      const [mb, yb] = b.split('/').map(Number);
      return (ya * 12 + ma) - (yb * 12 + mb);
    });

    return { 
      regions: Array.from(regions).sort(), 
      ras: Array.from(ras).sort(),
      months: sortedMonths.reverse() 
    };
  }, [data]);

  // --- Apply Filters ---
  const filteredData = useMemo(() => {
    return data.filter(p => {
      const geo = getGeoByCode(p['ID_BAIRRO']);
      const notifMonth = (p['DT_NOTIFIC'] && p['DT_NOTIFIC'].length >= 10) 
        ? `${p['DT_NOTIFIC'].split('/')[1]}/${p['DT_NOTIFIC'].split('/')[2]}` 
        : '';

      const matchRegion = filterRegion ? geo?.regiao_saude === filterRegion : true;
      const matchRA = filterRA ? geo?.ra === filterRA : true;
      const matchMonth = filterMonth ? notifMonth === filterMonth : true;

      return matchRegion && matchRA && matchMonth;
    });
  }, [data, filterRegion, filterRA, filterMonth]);


  // --- Helper Functions for Data Aggregation ---
  
  // Counts simple field values, maps codes to text if dictionary provided
  const countField = (field: string, dictionaryId?: string) => {
    const counts: Record<string, number> = {};
    filteredData.forEach(p => {
      let val = p[field] || 'Ignorado';
      
      // If dictionary mapping exists, use it
      if (dictionaryId && SINAN_DICTIONARY[dictionaryId]?.optionsMap) {
        val = SINAN_DICTIONARY[dictionaryId].optionsMap![val] || val;
      }

      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a, b) => b.value - a.value);
  };

  // Counts specific binary fields (Yes/No) where we only care about "Yes" (Code '1')
  const countYesFields = (fields: {key: string, label: string}[]) => {
    return fields.map(f => {
      const count = filteredData.filter(p => p[f.key] === '1').length;
      return { name: f.label, value: count };
    });
  };

  // Age Calculation logic
  const getAgeGroups = () => {
    const groups = { '0-14': 0, '15-24': 0, '25-44': 0, '45-64': 0, '65+': 0, 'Ignorado': 0 };
    filteredData.forEach(p => {
      const code = p['NU_IDADE_N'];
      let age = -1;
      
      if (code && code.length === 4) {
        const type = parseInt(code.charAt(0));
        const val = parseInt(code.substring(1));
        
        if (type === 4) age = val; // Years
        else if (type < 4) age = 0; // Days/Months -> < 1 year
      }

      if (age === -1) groups['Ignorado']++;
      else if (age <= 14) groups['0-14']++;
      else if (age <= 24) groups['15-24']++;
      else if (age <= 44) groups['25-44']++;
      else if (age <= 64) groups['45-64']++;
      else groups['65+']++;
    });
    return Object.keys(groups).map(k => ({ name: k, value: groups[k as keyof typeof groups] }));
  };

  // --- Compute Data for Sections ---

  // 1. Profile
  const ageData = getAgeGroups();
  const sexData = countField('CS_SEXO', 'CS_SEXO');
  const raceData = countField('CS_RACA', 'CS_RACA');
  
  // 2. Location
  const zoneData = countField('CS_ZONA', 'CS_ZONA');
  const topNeighborhoods = countField('NM_BAIRRO').slice(0, 5); // Top 5
  
  // 3. Clinical
  const entryTypeData = countField('TRATAMENTO', 'TRATAMENTO');
  const formData = countField('FORMA', 'FORMA');
  
  // 4. Comorbidities
  const comorbiditiesData = countYesFields([
    { key: 'AGRAVAIDS', label: 'HIV/AIDS' },
    { key: 'AGRAVDIABE', label: 'Diabetes' },
    { key: 'AGRAVALCOO', label: 'Álcool' },
    { key: 'AGRAVTABAC', label: 'Tabagismo' },
    { key: 'AGRAVDOENC', label: 'Doença Mental' }
  ]);

  // 5. Vulnerable Pops
  const vulnerableData = countYesFields([
    { key: 'POP_LIBER', label: 'Priv. Liberdade' },
    { key: 'POP_RUA', label: 'Pop. Rua' },
    { key: 'POP_IMIG', label: 'Imigrantes' },
    { key: 'POP_SAUDE', label: 'Prof. Saúde' },
    { key: 'BENEF_GOV', label: 'Benef. Gov.' }
  ]);

  // 6. Exams
  const molecularData = countField('TEST_MOLEC', 'TEST_MOLEC');
  const hivData = countField('HIV', 'HIV');
  
  // 7. Treatment
  const tdoData = countField('TRAT_SUPER', 'TRAT_SUPER');
  const basicSchemeCount = filteredData.filter(p => 
    p['RIFAMPICIN'] === '1' && p['ISONIAZIDA'] === '1' && p['PIRAZINAMI'] === '1' && p['ETAMBUTOL'] === '1'
  ).length;

  // 9. Outcomes
  const outcomeData = countField('SITUA_ENCE', 'SITUA_ENCE');

  // --- REPORT GENERATION HANDLER ---
  const handleDownloadPDF = () => {
    const kpiData = [
        { label: 'Total Notificações', value: filteredData.length },
        { label: 'Casos Novos', value: entryTypeData.find(d => d.name === 'Caso Novo')?.value || 0 },
        { label: 'Cura', value: outcomeData.find(d => d.name === 'Cura')?.value || 0 },
        { label: 'Óbitos TB', value: outcomeData.find(d => d.name === 'Óbito TB')?.value || 0 }
    ];

    const chartsData = [
        { title: 'Distribuição por Sexo', data: sexData },
        { title: 'Faixa Etária', data: ageData },
        { title: 'Raça / Cor', data: raceData },
        { title: 'Forma Clínica', data: formData },
        { title: 'Tipo de Entrada', data: entryTypeData },
        { title: 'Comorbidades', data: comorbiditiesData },
        { title: 'População Vulnerável', data: vulnerableData },
        { title: 'Situação de Encerramento', data: outcomeData }
    ];

    generateDashboardReport(filteredData.length, kpiData, chartsData);
  };


  // --- Reusable Chart Components ---

  const SimpleBarChart = ({ data, color, layout = 'horizontal' }: any) => (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout={layout} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        {layout === 'vertical' ? (
             <>
               <XAxis type="number" stroke="#9ca3af" />
               <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" style={{fontSize: '10px'}} />
             </>
        ) : (
             <>
                <XAxis dataKey="name" stroke="#9ca3af" style={{fontSize: '10px'}} />
                <YAxis stroke="#9ca3af" />
             </>
        )}
        <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const SimplePieChart = ({ data }: any) => (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
        <Legend wrapperStyle={{fontSize: '12px'}} />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* --- GLOBAL FILTERS --- */}
      <div className="bg-card p-4 rounded-lg border border-gray-800 shadow-md sticky top-0 z-20">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-secondary uppercase">Filtros Globais do Painel</h3>
            <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-primary/10 border border-primary text-primary px-3 py-1 rounded text-xs font-bold hover:bg-primary hover:text-black transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Baixar Relatório PDF
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <select 
             value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
             className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-primary block w-full p-2.5"
           >
             <option value="">Todas Regiões de Saúde</option>
             {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
           </select>
           
           <select 
             value={filterRA} onChange={e => setFilterRA(e.target.value)}
             className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-primary block w-full p-2.5"
           >
             <option value="">Todas Regiões Administrativas (RA)</option>
             {filterOptions.ras.map(r => <option key={r} value={r}>{r}</option>)}
           </select>

           <select 
             value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
             className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-primary block w-full p-2.5"
           >
             <option value="">Todo Período</option>
             {filterOptions.months.map(m => <option key={m} value={m}>{m}</option>)}
           </select>
        </div>
      </div>

      {/* --- KPI SUMMARY --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-card p-4 border border-gray-800 rounded-lg">
            <span className="text-secondary text-xs">Total Notificações</span>
            <p className="text-2xl font-bold text-white">{filteredData.length}</p>
         </div>
         <div className="bg-card p-4 border border-gray-800 rounded-lg">
            <span className="text-secondary text-xs">Casos Novos</span>
            <p className="text-2xl font-bold text-blue-400">
                {entryTypeData.find(d => d.name === 'Caso Novo')?.value || 0}
            </p>
         </div>
         <div className="bg-card p-4 border border-gray-800 rounded-lg">
            <span className="text-secondary text-xs">Cura</span>
            <p className="text-2xl font-bold text-green-400">
                {outcomeData.find(d => d.name === 'Cura')?.value || 0}
            </p>
         </div>
         <div className="bg-card p-4 border border-gray-800 rounded-lg">
            <span className="text-secondary text-xs">Óbitos TB</span>
            <p className="text-2xl font-bold text-red-500">
                {outcomeData.find(d => d.name === 'Óbito TB')?.value || 0}
            </p>
         </div>
      </div>

      {/* --- 1. PERFIL E IDENTIFICAÇÃO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm lg:col-span-1">
           <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Distribuição por Sexo</h4>
           <SimplePieChart data={sexData} />
        </div>
        <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm lg:col-span-2">
           <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Faixa Etária</h4>
           <SimpleBarChart data={ageData} color={COLORS[1]} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm">
           <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Raça / Cor</h4>
           <SimpleBarChart data={raceData} color={COLORS[2]} layout="vertical" />
         </div>
         <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm">
           <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Escolaridade</h4>
           <SimpleBarChart data={countField('CS_ESCOL_N', 'CS_ESCOL_N')} color={COLORS[4]} layout="vertical" />
         </div>
      </div>

      {/* --- 2. ENDEREÇO & 3. DADOS CLÍNICOS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm">
            <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Zona Residência</h4>
            <SimplePieChart data={zoneData} />
         </div>
         <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm">
            <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Forma Clínica</h4>
            <SimplePieChart data={formData} />
         </div>
         <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm">
            <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Tipo Entrada</h4>
            <SimpleBarChart data={entryTypeData} color={COLORS[0]} layout="vertical" />
         </div>
      </div>
      
      {/* --- 4. COMORBIDADES & 5. VULNERÁVEIS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm">
           <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Comorbidades (Prevalência)</h4>
           <SimpleBarChart data={comorbiditiesData} color="#ef4444" layout="vertical" />
         </div>
         <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm">
           <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Populações Vulneráveis</h4>
           <SimpleBarChart data={vulnerableData} color="#f59e0b" layout="vertical" />
         </div>
      </div>

      {/* --- 6. EXAMES & 7. TRATAMENTO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm">
            <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Teste Molecular (TRM-TB)</h4>
            <SimplePieChart data={molecularData} />
         </div>
         <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm">
            <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Situação HIV</h4>
            <SimplePieChart data={hivData} />
         </div>
         <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm flex flex-col justify-center gap-4">
             <h4 className="text-white font-semibold border-b border-gray-700 pb-2">Indicadores Tratamento</h4>
             <div className="flex justify-between items-center bg-gray-900 p-3 rounded">
                <span className="text-gray-400 text-sm">Uso Esquema Básico</span>
                <span className="text-primary font-bold">{basicSchemeCount}</span>
             </div>
             <div className="flex justify-between items-center bg-gray-900 p-3 rounded">
                <span className="text-gray-400 text-sm">TDO Realizado</span>
                <span className="text-blue-400 font-bold">{tdoData.find(d => d.name.includes('Sim'))?.value || 0}</span>
             </div>
             <div className="flex justify-between items-center bg-gray-900 p-3 rounded">
                <span className="text-gray-400 text-sm">Baciloscopia Diagnóstico (+)</span>
                <span className="text-red-400 font-bold">
                    {countField('BACILOSC_E', 'BACILOSC_E').find(d => d.name === 'Positiva')?.value || 0}
                </span>
             </div>
         </div>
      </div>

      {/* --- 9. ENCERRAMENTOS --- */}
      <div className="bg-card p-5 border border-gray-800 rounded-lg shadow-sm">
         <h4 className="text-white font-semibold mb-4 border-b border-gray-700 pb-2">Situação de Encerramento (Desfecho)</h4>
         <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                   {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.name.includes('Cura') ? STATUS_COLORS.success :
                        entry.name.includes('Abandono') ? STATUS_COLORS.danger :
                        entry.name.includes('Óbito') ? STATUS_COLORS.warning :
                        COLORS[index % COLORS.length]
                      } />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

    </div>
  );
};

export default Dashboard;
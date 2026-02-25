import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PatientRecord, FieldDefinition } from '../types';
import { getGeoByCode } from '../sinan_geo';
import { FIELD_GROUPS } from '../constants';

// --- Helpers ---
const formatDate = () => {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} às ${d.getHours()}:${d.getMinutes()}`;
};

const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  doc.setFillColor(26, 28, 35); // Dark Sidebar Color
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(0, 255, 162); // Primary Green
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SGP Auditoria - TB DF', 14, 10);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(title, 14, 18);
  
  if (subtitle) {
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text(subtitle, 14, 23);
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${formatDate()}`, 150, 10);
};

// --- 1. Dashboard Report ---
export const generateDashboardReport = (
  filteredCount: number, 
  kpiData: { label: string, value: number, color?: string }[],
  chartsData: { title: string, data: { name: string, value: number }[] }[]
) => {
  const doc = new jsPDF();
  addHeader(doc, 'Relatório Executivo - Dashboard', `Total de Registros no Filtro: ${filteredCount}`);

  let currentY = 35;

  // KPIs
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Indicadores Chave (KPIs)', 14, currentY);
  currentY += 5;

  const kpiRows = [kpiData.map(k => k.label), kpiData.map(k => k.value.toString())];
  
  autoTable(doc, {
    startY: currentY,
    head: [kpiRows[0]],
    body: [kpiRows[1]],
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
    styles: { halign: 'center', fontSize: 12, fontStyle: 'bold' }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Chart Summaries
  chartsData.forEach((chart, index) => {
    // Check for page break
    if (currentY > 250) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(chart.title, 14, currentY);
    currentY += 2;

    const bodyData = chart.data.map(d => [d.name, d.value]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Categoria', 'Quantidade']],
      body: bodyData,
      theme: 'striped',
      headStyles: { fillColor: [0, 150, 100] },
      margin: { left: 14, right: 120 }, // Keep it narrow
    });

    // Move Y depending on table height, but handle multi-column layout logic roughly
    // For simplicity in this text-based report, we stack them.
    currentY = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save('dashboard_report.pdf');
};

// --- 2. Team Action Report (Patient List) ---
export const generateTeamReport = (patients: PatientRecord[]) => {
  const doc = new jsPDF('l'); // Landscape
  addHeader(doc, 'Relatório de Monitoramento - Equipe', 'Lista de pacientes filtrada para ação das equipes de ponta.');

  const tableData = patients.map(p => {
     const geo = getGeoByCode(p['ID_BAIRRO']);
     const location = geo 
        ? `${geo.ra} - ${geo.bairro}\n(${geo.regiao_saude})` 
        : `ID: ${p['ID_BAIRRO'] || 'N/A'}`;

     return [
       p['NU_NOTIFIC'],
       p['NM_PACIENT'] || 'Não identificado',
       location,
       p['Status'] || 'Pendente',
       p['Observações'] || ''
     ];
  });

  autoTable(doc, {
    startY: 30,
    head: [['Notificação', 'Paciente', 'Localização / Região', 'Status Gestão', 'Observações / Pendências']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [26, 28, 35], textColor: [0, 255, 162] },
    columnStyles: {
        0: { cellWidth: 30 }, // Notif
        1: { cellWidth: 50, fontStyle: 'bold' }, // Nome
        2: { cellWidth: 60, fontSize: 8 }, // Local
        3: { cellWidth: 30, fontStyle: 'bold' }, // Status
        4: { cellWidth: 'auto' } // Obs
    },
    styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
  });

  doc.save('relatorio_equipe_pacientes.pdf');
};

// --- 3. Full Individual Patient Record ---
export const generateIndividualReport = (
    patient: PatientRecord, 
    dictionary: Record<string, FieldDefinition>
) => {
  const doc = new jsPDF();
  
  const notif = patient['NU_NOTIFIC'] || 'S/N';
  const name = patient['NM_PACIENT'] || 'Paciente';
  
  addHeader(doc, 'Ficha Completa do Paciente', `${name} - Notif: ${notif}`);

  let currentY = 30;

  // Process Groups
  FIELD_GROUPS.forEach(group => {
     // Check page break
     if (currentY > 270) {
         doc.addPage();
         currentY = 20;
     }

     doc.setFillColor(240, 240, 240);
     doc.rect(14, currentY, 182, 8, 'F');
     
     doc.setFontSize(10);
     doc.setFont('helvetica', 'bold');
     doc.setTextColor(0, 0, 0);
     doc.text(group.title.toUpperCase(), 16, currentY + 5.5);
     
     currentY += 10;

     // Prepare grid data for this group
     const groupData: any[][] = [];
     let currentRow: string[] = [];
     
     group.fields.forEach((fieldId, index) => {
        const def = dictionary[fieldId];
        const rawValue = patient[fieldId] || '';
        const label = def ? def.label : fieldId;
        
        // Try to decode value
        let displayValue = rawValue;
        if (def && def.optionsMap && def.optionsMap[rawValue]) {
            displayValue = `${rawValue} - ${def.optionsMap[rawValue]}`;
        }

        currentRow.push(`${label}:\n${displayValue || '--'}`);

        // 3 items per row
        if (currentRow.length === 3) {
            groupData.push(currentRow);
            currentRow = [];
        }
     });

     if (currentRow.length > 0) {
         while (currentRow.length < 3) currentRow.push(''); // fill empty
         groupData.push(currentRow);
     }

     autoTable(doc, {
        startY: currentY,
        body: groupData,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', valign: 'top' },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 60 },
            2: { cellWidth: 60 },
        },
        didParseCell: (data) => {
            // Style keys bold
            data.cell.styles.lineWidth = 0.1;
            data.cell.styles.lineColor = [200, 200, 200];
        }
     });

     currentY = (doc as any).lastAutoTable.finalY + 5;
  });

  // Observations Section at the end
  if (currentY > 250) {
      doc.addPage();
      currentY = 20;
  }
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVAÇÕES E GESTÃO', 14, currentY);
  currentY += 5;

  const obsData = [
      ['Status', patient['Status'] || 'Não informado'],
      ['Mês Ref.', patient['Mês'] || 'Não informado'],
      ['Anotações', patient['Observações'] || '']
  ];

  autoTable(doc, {
      startY: currentY,
      body: obsData,
      theme: 'grid',
      columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold', fillColor: [240, 240, 240] },
          1: { cellWidth: 'auto' }
      }
  });

  doc.save(`ficha_${notif}_${name.replace(/\s+/g, '_')}.pdf`);
};
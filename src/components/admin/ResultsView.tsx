import { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface VoteResult {
  option_id: string;
  text_pt: string;
  text_es: string;
  text_en: string;
  count: number;
}

type VoteRow = {
  vote_option_id: string;
  vote_options: {
    text_pt: string;
    text_es: string;
    text_en: string;
  };
};

export function ResultsView() {
  const { t } = useLanguage();
  const [results, setResults] = useState<VoteResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async (from?: string, to?: string) => {
    let query = supabase
      .from('votes')
      .select('vote_option_id, vote_options!inner(id, text_pt, text_es, text_en)');

    if (from) {
      query = query.gte('created_at', new Date(from).toISOString());
    }
    if (to) {
      query = query.lte('created_at', new Date(to + 'T23:59:59').toISOString());
    }

    const { data } = await query;

    if (data) {
      const typedData = data as VoteRow[];
      const grouped = typedData.reduce<Record<string, VoteResult>>((acc, vote) => {
        const optionId = vote.vote_option_id;
        if (!acc[optionId]) {
          acc[optionId] = {
            option_id: optionId,
            text_pt: vote.vote_options.text_pt,
            text_es: vote.vote_options.text_es,
            text_en: vote.vote_options.text_en,
            count: 0,
          };
        }
        acc[optionId].count++;
        return acc;
      }, {});

      const resultsArray = Object.values(grouped).sort((a, b) => b.count - a.count);
      setResults(resultsArray);
      setTotalVotes(data.length);
    }
  };

  const handleFilter = () => {
    loadResults(dateFrom, dateTo);
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF();

      // Colors
      const primaryBlue = [37, 99, 235]; // #2563eb
      const lightBlue = [219, 234, 254]; // #dbeafe
      const darkGray = [31, 41, 55]; // #1f2937
      // Header with branding
      doc.setFillColor(...primaryBlue);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Cellshop Duty Free', 105, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Relatório de Resultados da Votação', 105, 32, { align: 'center' });

      // Report metadata
      let yPos = 50;
      doc.setTextColor(...darkGray);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const reportDate = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Data de geração: ${reportDate}`, 20, yPos);
      yPos += 6;

      if (dateFrom || dateTo) {
        const filterText = `Período filtrado: ${dateFrom ? new Date(dateFrom).toLocaleDateString('pt-BR') : 'Início'} até ${dateTo ? new Date(dateTo).toLocaleDateString('pt-BR') : 'Hoje'}`;
        doc.text(filterText, 20, yPos);
        yPos += 6;
      }

      // Summary section
      yPos += 5;
      doc.setFillColor(...lightBlue);
      doc.roundedRect(20, yPos, 170, 25, 3, 3, 'F');

      yPos += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryBlue);
      doc.text('Resumo Geral', 25, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkGray);
      doc.text(`Total de Votos: ${totalVotes}`, 25, yPos);
      doc.text(`Opções Disponíveis: ${results.length}`, 120, yPos);

      yPos += 15;

      // Results table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryBlue);
      doc.text('Resultados Detalhados', 20, yPos);
      yPos += 5;

      const safeTotalVotes = totalVotes || 1;
      const tableData = results.map((r) => [
        r.text_pt,
        r.text_es,
        r.text_en,
        r.count.toString(),
        `${((r.count / safeTotalVotes) * 100).toFixed(1)}%`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Opção (PT)', 'Opção (ES)', 'Opção (EN)', 'Votos', '%']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryBlue,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: darkGray
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 50 },
          2: { cellWidth: 50 },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });

      yPos = (doc.lastAutoTable?.finalY ?? yPos) + 15;

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryBlue);
      doc.text('Gráfico de Distribuição', 20, yPos);
      yPos += 8;

      const maxCount = results.length > 0 ? Math.max(...results.map((r) => r.count)) : 1;
      const chartWidth = 150;
      const barHeight = 8;
      const barSpacing = 12;

      results.forEach((result) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const percentage = (result.count / safeTotalVotes) * 100;
        const barWidth = (result.count / maxCount) * chartWidth;

        // Option label
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        const labelText = result.text_pt.length > 40 ? `${result.text_pt.substring(0, 37)}...` : result.text_pt;
        doc.text(labelText, 20, yPos + 6);

        doc.setFillColor(...lightBlue);
        doc.roundedRect(20, yPos + 2, chartWidth, barHeight, 1, 1, 'F');

        doc.setFillColor(...primaryBlue);
        doc.roundedRect(20, yPos + 2, barWidth, barHeight, 1, 1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryBlue);
        doc.text(`${result.count} (${percentage.toFixed(1)}%)`, chartWidth + 25, yPos + 7);

        yPos += barSpacing;
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(...primaryBlue);
        doc.rect(0, 287, 210, 10, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Cellshop Duty Free - Sistema de Votação', 105, 293, { align: 'center' });
        doc.text(`Página ${i} de ${pageCount}`, 190, 293, { align: 'right' });
      }

      const fileName = `cellshop-resultados-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
    }
  };

  const maxCount = results.length > 0 ? Math.max(...results.map(r => r.count)) : 1;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.filterByDate}</h2>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.from}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.to}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <button
            onClick={handleFilter}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
          >
            <Calendar className="w-5 h-5" />
            {t.filter}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t.results}</h2>
            <p className="text-gray-600 mt-1">
              {t.totalVotes}: <span className="font-bold text-blue-600">{totalVotes}</span>
            </p>
          </div>

          <button
            onClick={exportToPDF}
            disabled={results.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t.noData}
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result) => {
              const percentage = (result.count / totalVotes) * 100;
              const barWidth = (result.count / maxCount) * 100;

              return (
                <div key={result.option_id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-gray-800">{result.text_pt}</div>
                    <div className="text-sm text-gray-600">
                      <span className="font-bold text-blue-600">{result.count}</span> votos
                      ({percentage.toFixed(1)}%)
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end px-3"
                      style={{ width: `${barWidth}%` }}
                    >
                      {barWidth > 15 && (
                        <span className="text-white font-bold text-sm">
                          {percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

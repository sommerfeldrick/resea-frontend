/**
 * Advanced Export Service
 * Exports research documents to various formats
 */

import type { AcademicSource } from '../types';

interface ExportData {
  title: string;
  content: string;
  sources: AcademicSource[];
  metadata: {
    author?: string;
    date: string;
    wordCount: number;
  };
}

// ==========================================
// MARKDOWN EXPORT
// ==========================================
export function exportToMarkdown(data: ExportData): void {
  let markdown = `# ${data.title}\n\n`;
  markdown += `**Autor:** ${data.metadata.author || 'Não especificado'}\n`;
  markdown += `**Data:** ${new Date(data.metadata.date).toLocaleDateString('pt-BR')}\n`;
  markdown += `**Palavras:** ${data.metadata.wordCount.toLocaleString()}\n\n`;
  markdown += `---\n\n`;
  markdown += data.content;
  markdown += `\n\n---\n\n## Referências\n\n`;

  data.sources.forEach((source, i) => {
    markdown += `${i + 1}. ${source.authors || 'Autor desconhecido'}. `;
    markdown += `**${source.title}**. `;
    if (source.year) markdown += `${source.year}. `;
    markdown += `Disponível em: ${source.uri}\n`;
  });

  downloadFile(markdown, `${data.title}.md`, 'text/markdown');
}

// ==========================================
// HTML EXPORT
// ==========================================
export function exportToHTML(data: ExportData): void {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #4f46e5; margin-top: 30px; }
        h3 { color: #6366f1; }
        .metadata { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
        .metadata p { margin: 5px 0; }
        .references { margin-top: 40px; }
        .references ol { padding-left: 20px; }
        .references li { margin-bottom: 10px; }
        @media print {
            body { margin: 0; padding: 20px; }
        }
    </style>
</head>
<body>
    <h1>${data.title}</h1>

    <div class="metadata">
        <p><strong>Autor:</strong> ${data.metadata.author || 'Não especificado'}</p>
        <p><strong>Data:</strong> ${new Date(data.metadata.date).toLocaleDateString('pt-BR')}</p>
        <p><strong>Palavras:</strong> ${data.metadata.wordCount.toLocaleString()}</p>
    </div>

    <div class="content">
        ${formatContentToHTML(data.content)}
    </div>

    <div class="references">
        <h2>Referências</h2>
        <ol>
            ${data.sources.map(source => `
                <li>
                    ${source.authors || 'Autor desconhecido'}.
                    <strong>${source.title}</strong>.
                    ${source.year ? source.year + '.' : ''}
                    Disponível em: <a href="${source.uri}" target="_blank">${source.uri}</a>
                </li>
            `).join('')}
        </ol>
    </div>

    <script>
        // Auto print on load (optional)
        // window.onload = () => window.print();
    </script>
</body>
</html>
  `;

  downloadFile(html, `${data.title}.html`, 'text/html');
}

// ==========================================
// LATEX EXPORT (para submissões acadêmicas)
// ==========================================
export function exportToLaTeX(data: ExportData): void {
  let latex = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[portuguese]{babel}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{cite}

\\title{${escapeLaTeX(data.title)}}
\\author{${escapeLaTeX(data.metadata.author || 'Autor')}}
\\date{${new Date(data.metadata.date).toLocaleDateString('pt-BR')}}

\\begin{document}

\\maketitle

\\begin{abstract}
% Adicione seu resumo aqui
\\end{abstract}

${formatContentToLaTeX(data.content)}

\\begin{thebibliography}{99}
`;

  data.sources.forEach((source, i) => {
    latex += `\\bibitem{ref${i + 1}} ${escapeLaTeX(source.authors || 'Autor desconhecido')}. `;
    latex += `\\textit{${escapeLaTeX(source.title)}}. `;
    if (source.year) latex += `${source.year}. `;
    latex += `\\url{${source.uri}}\n\n`;
  });

  latex += `\\end{thebibliography}

\\end{document}
`;

  downloadFile(latex, `${data.title}.tex`, 'text/x-tex');
}

// ==========================================
// PDF EXPORT (usando biblioteca html2pdf ou jsPDF)
// ==========================================
export async function exportToPDF(data: ExportData): Promise<void> {
  // Para implementar PDF, você precisaria instalar:
  // npm install jspdf html2pdf.js

  // Por enquanto, vamos gerar HTML e abrir janela de impressão
  const html = generatePrintableHTML(data);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Aguardar carregamento e imprimir
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

// ==========================================
// WORD EXPORT (DOCX)
// ==========================================
export async function exportToWord(data: ExportData): Promise<void> {
  // Para implementar DOCX real, você precisaria:
  // npm install docx file-saver

  // Por enquanto, vamos exportar como HTML que pode ser aberto no Word
  const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
  <meta charset='utf-8'>
  <title>${data.title}</title>
</head>
<body>
  <h1>${data.title}</h1>
  <p><b>Autor:</b> ${data.metadata.author || 'Não especificado'}</p>
  <p><b>Data:</b> ${new Date(data.metadata.date).toLocaleDateString('pt-BR')}</p>
  <p><b>Palavras:</b> ${data.metadata.wordCount.toLocaleString()}</p>
  <hr>
  ${formatContentToHTML(data.content)}
  <hr>
  <h2>Referências</h2>
  <ol>
    ${data.sources.map(source => `
      <li>${source.authors || 'Autor desconhecido'}. <b>${source.title}</b>. ${source.year || ''}. ${source.uri}</li>
    `).join('')}
  </ol>
</body>
</html>
  `;

  downloadFile(html, `${data.title}.doc`, 'application/msword');
}

// ==========================================
// ABNT FORMAT EXPORT (formatação ABNT completa)
// ==========================================
export function exportToABNT(data: ExportData): void {
  let abnt = `${data.title.toUpperCase()}\n\n`;
  abnt += `${data.metadata.author || 'AUTOR'}\n\n`;
  abnt += `Resumo: [Adicione seu resumo aqui]\n\n`;
  abnt += `Palavras-chave: [Adicione palavras-chave]\n\n`;
  abnt += `---\n\n`;
  abnt += formatContentToABNT(data.content);
  abnt += `\n\nREFERÊNCIAS\n\n`;

  // Formatação ABNT de referências
  data.sources
    .sort((a, b) => (a.authors || '').localeCompare(b.authors || ''))
    .forEach(source => {
      const authors = (source.authors || 'AUTOR DESCONHECIDO').toUpperCase();
      const title = source.title;
      const year = source.year || 's.d.';
      const url = source.uri;

      abnt += `${authors}. ${title}. ${year}. Disponível em: <${url}>. `;
      abnt += `Acesso em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')}.\n\n`;
    });

  downloadFile(abnt, `${data.title}_ABNT.txt`, 'text/plain');
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatContentToHTML(content: string): string {
  return content
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/# (.*)/g, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\[CITE:FONTE_(\d+)\]\s*\(([^)]+)\)/g, '<sup>[$2]</sup>');
}

function formatContentToLaTeX(content: string): string {
  return content
    .replace(/### (.*)/g, '\\subsubsection{$1}')
    .replace(/## (.*)/g, '\\subsection{$1}')
    .replace(/# (.*)/g, '\\section{$1}')
    .replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}')
    .replace(/\*(.*?)\*/g, '\\textit{$1}')
    .replace(/\[CITE:FONTE_(\d+)\]\s*\(([^)]+)\)/g, '\\cite{ref$1}');
}

function formatContentToABNT(content: string): string {
  return content
    .replace(/### (.*)/g, '\n$1\n')
    .replace(/## (.*)/g, '\n$1\n')
    .replace(/# (.*)/g, '\n$1\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[CITE:FONTE_(\d+)\]\s*\(([^)]+)\)/g, '($2)');
}

function escapeLaTeX(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, '\\$&')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

function generatePrintableHTML(data: ExportData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      margin: 0;
      padding: 20px;
    }
    h1 { font-size: 18pt; text-align: center; margin-bottom: 30px; }
    h2 { font-size: 16pt; margin-top: 20px; }
    h3 { font-size: 14pt; }
    .metadata { text-align: center; margin-bottom: 40px; }
    .references { page-break-before: always; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  <div class="metadata">
    <p>${data.metadata.author || 'Autor não especificado'}</p>
    <p>${new Date(data.metadata.date).toLocaleDateString('pt-BR')}</p>
  </div>
  ${formatContentToHTML(data.content)}
  <div class="references">
    <h2>Referências</h2>
    <ol>
      ${data.sources.map(s => `
        <li>${s.authors || 'Autor desconhecido'}. ${s.title}. ${s.year || ''}. ${s.uri}</li>
      `).join('')}
    </ol>
  </div>
</body>
</html>
  `;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==========================================
// EXPORT ALL
// ==========================================
export const advancedExportService = {
  exportToMarkdown,
  exportToHTML,
  exportToLaTeX,
  exportToPDF,
  exportToWord,
  exportToABNT
};

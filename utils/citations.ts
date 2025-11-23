// Citation formatting utilities

export interface Article {
  title: string;
  authors: string[];
  year: number;
  journalInfo?: string;
  doi?: string;
  url?: string;
}

export function formatABNT(article: Article): string {
  const authors = article.authors.slice(0, 3);
  let citation = '';
  
  if (authors.length > 0) {
    const lastName = authors[0].split(' ').pop()?.toUpperCase() || '';
    const initials = authors[0].split(' ').slice(0, -1).map(n => n[0]).join('. ');
    citation += `${lastName}, ${initials}.`;
    
    if (authors.length > 1) {
      citation += ' et al.';
    }
  }
  
  citation += ` ${article.title}. `;
  if (article.journalInfo) {
    citation += `${article.journalInfo}, `;
  }
  citation += `${article.year}.`;
  
  if (article.doi) {
    citation += ` DOI: ${article.doi}`;
  }
  
  return citation;
}

export function formatAPA(article: Article): string {
  const authors = article.authors.slice(0, 7);
  let citation = '';
  
  if (authors.length > 0) {
    authors.forEach((author, idx) => {
      const parts = author.split(' ');
      const lastName = parts.pop() || '';
      const initials = parts.map(n => n[0] + '.').join(' ');
      citation += `${lastName}, ${initials}`;
      
      if (idx < authors.length - 2) {
        citation += ', ';
      } else if (idx === authors.length - 2) {
        citation += ', & ';
      }
    });
    
    if (article.authors.length > 7) {
      citation += ', et al.';
    }
  }
  
  citation += ` (${article.year}). ${article.title}. `;
  if (article.journalInfo) {
    citation += `${article.journalInfo}. `;
  }
  
  if (article.doi) {
    citation += `https://doi.org/${article.doi}`;
  } else if (article.url) {
    citation += article.url;
  }
  
  return citation;
}

export function formatVancouver(article: Article, number: number): string {
  const authors = article.authors.slice(0, 6);
  let citation = `${number}. `;
  
  if (authors.length > 0) {
    authors.forEach((author, idx) => {
      const parts = author.split(' ');
      const lastName = parts.pop() || '';
      const initials = parts.map(n => n[0]).join('');
      citation += `${lastName} ${initials}`;
      
      if (idx < authors.length - 1) {
        citation += ', ';
      }
    });
    
    if (article.authors.length > 6) {
      citation += ', et al';
    }
  }
  
  citation += `. ${article.title}. `;
  if (article.journalInfo) {
    citation += `${article.journalInfo}. `;
  }
  citation += `${article.year}.`;
  
  return citation;
}

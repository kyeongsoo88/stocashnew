import Papa from 'papaparse';

export interface ParsedData {
  headers: string[];
  rows: string[][];
}

export const fetchAndParseCsv = async (filePath: string): Promise<ParsedData> => {
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();
  
  // 1. Try decoding as UTF-8 first
  const decoderUtf8 = new TextDecoder('utf-8');
  let csv = decoderUtf8.decode(arrayBuffer);

  // 2. Check for replacement characters () which indicate encoding issues
  // If found, try decoding as EUC-KR (common for Korean Excel CSVs)
  if (csv.includes('')) {
    const decoderEucKr = new TextDecoder('euc-kr');
    csv = decoderEucKr.decode(arrayBuffer);
  }

  return new Promise((resolve, reject) => {
    Papa.parse(csv, {
      header: false, 
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length > 0) {
          // Remove any BOM (Byte Order Mark) if present in the first cell
          if (data[0][0]) {
            data[0][0] = data[0][0].replace(/^\uFEFF/, '');
          }
          
          resolve({
            headers: data[0],
            rows: data.slice(1),
          });
        } else {
          resolve({ headers: [], rows: [] });
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};

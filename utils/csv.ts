import Papa from 'papaparse';

export interface ParsedData {
  headers: string[];
  rows: string[][];
}

export const fetchAndParseCsv = async (filePath: string): Promise<ParsedData> => {
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();
  
  let csv = '';

  try {
    // 1. Try decoding as UTF-8 with fatal: true
    // This will throw an error if the file contains invalid UTF-8 sequences (common in EUC-KR files)
    const decoderUtf8 = new TextDecoder('utf-8', { fatal: true });
    csv = decoderUtf8.decode(arrayBuffer);
  } catch (e) {
    // 2. If UTF-8 decoding fails, fallback to EUC-KR (Korean Windows standard)
    console.log(`UTF-8 decoding failed for ${filePath}, falling back to EUC-KR`);
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

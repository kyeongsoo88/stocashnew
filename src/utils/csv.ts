import Papa from 'papaparse';

export interface ParsedData {
  headers: string[];
  rows: string[][];
}

export const fetchAndParseCsv = async (filePath: string): Promise<ParsedData> => {
  const response = await fetch(filePath);
  const reader = response.body?.getReader();
  const result = await reader?.read();
  const decoder = new TextDecoder('utf-8');
  const csv = decoder.decode(result?.value);

  return new Promise((resolve, reject) => {
    Papa.parse(csv, {
      header: false, // We handle headers manually to preserve order/duplicates if any
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length > 0) {
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


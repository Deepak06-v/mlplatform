export function analyzeColumns(data) {
  if (!data || data.length === 0) return [];

  const columns = Object.keys(data[0]);
  const totalRows = data.length;

  return columns.map((col) => {
    let missing = 0;
    const values = data.map((row) => row[col]);

    values.forEach((val) => {
      if (val === null || val === undefined || val === "") {
        missing++;
      }
    });

    const uniqueValues = new Set(values).size;
    const missingPercent = (missing / totalRows) * 100;

    return {
      name: col,
      missingPercent: missingPercent.toFixed(2),
      uniqueValues,
    };
  });
}
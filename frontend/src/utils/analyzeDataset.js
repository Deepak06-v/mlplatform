export function analyzeDataset(data) {
  if (!data || data.length === 0) return null;

  const rows = data.length;
  const columnsList = Object.keys(data[0]);
  const columns = columnsList.length;

  let missing = 0;

  columnsList.forEach((col) => {
    data.forEach((row) => {
      if (
        row[col] === null ||
        row[col] === undefined ||
        row[col] === ""
      ) {
        missing++;
      }
    });
  });

  const totalValues = rows * columns;
  const missingPercentage = ((missing / totalValues) * 100).toFixed(2);

  return {
    rows,
    columns,
    missing,
    missingPercentage,
  };
}
import { ExcelExporter } from './excel.js';

const exporter = new ExcelExporter();

exporter
  .exportFromJsonFile('./data.json', './output.xlsx')
  .then(() => console.log('Excel 文件创建成功'))
  .catch((err) => console.error(err));

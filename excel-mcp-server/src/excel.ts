import pkg from 'exceljs';
const { Workbook } = pkg;
import * as fs from 'fs';

export class ExcelExporter {
  /**
   * 将 JSON 数据导出为 Excel 文件
   * @param jsonPath JSON 文件路径（如：./data.json）
   * @param outputPath 输出的 Excel 文件路径（如：./output.xlsx）
   */
  async exportFromJsonFile(jsonPath: string, outputPath: string): Promise<void> {
    try {
      const fileContent = fs.readFileSync(jsonPath, 'utf-8');
      const jsonData = JSON.parse(fileContent);

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('JSON 内容必须是非空数组');
      }

      const workbook = new Workbook();
      const sheet = workbook.addWorksheet('Sheet1');

      const headers = Object.keys(jsonData[0]);
      sheet.addRow(headers);

      for (const item of jsonData) {
        const row = headers.map((key) => item[key]);
        sheet.addRow(row);
      }

      await workbook.xlsx.writeFile(outputPath);
      console.log(`✅ Excel 文件已保存到: ${outputPath}`);
    } catch (err) {
      console.error('❌ 导出失败:', err);
      throw err;
    }
  }
}

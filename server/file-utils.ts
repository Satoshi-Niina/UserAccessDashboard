
import * as fs from 'fs';
import * as path from 'path';
import * as PizZip from 'pizzip';
import * as xml2js from 'xml2js';

// PowerPointファイルからコンテンツを抽出
export async function extractPptxContent(filePath: string, imagesDir: string, timestamp: number) {
  try {
    const content = fs.readFileSync(filePath);
    const zip = new PizZip(content);
    
    if (!zip.files || Object.keys(zip.files).length === 0) {
      throw new Error('PPTXファイルの解析に失敗しました');
    }
  
  // テキストデータを格納するオブジェクト
  const textData = {
    title: path.basename(filePath, '.pptx'),
    slides: [],
    metadata: {
      extractedAt: new Date().toISOString(),
      originalFileName: path.basename(filePath)
    }
  };
  
  let imageCount = 0;

  // スライドの内容を抽出
  const slideRegex = /ppt\/slides\/slide(\d+)\.xml/;
  const slideEntries = Object.keys(zip.files).filter(name => slideRegex.test(name));
  
  // スライド番号でソート
  slideEntries.sort((a, b) => {
    const numA = parseInt(a.match(slideRegex)[1]);
    const numB = parseInt(b.match(slideRegex)[1]);
    return numA - numB;
  });
  
  for (const slidePath of slideEntries) {
    const slideContent = zip.file(slidePath).asText();
    const slideNumber = parseInt(slidePath.match(slideRegex)[1]);
    
    // XMLからテキストを抽出
    const parser = new xml2js.Parser({ explicitArray: false });
    const slideXml = await parser.parseStringPromise(slideContent);
    
    const slideTexts = [];
    
    // テキストの抽出処理（簡略化）
    try {
      const textElements = slideXml['p:sld']['p:cSld']['p:spTree']['p:sp'];
      if (Array.isArray(textElements)) {
        for (const textElement of textElements) {
          if (textElement['p:txBody'] && textElement['p:txBody']['a:p']) {
            const paragraphs = Array.isArray(textElement['p:txBody']['a:p']) 
              ? textElement['p:txBody']['a:p'] 
              : [textElement['p:txBody']['a:p']];
            
            for (const paragraph of paragraphs) {
              if (paragraph['a:r']) {
                const runs = Array.isArray(paragraph['a:r']) ? paragraph['a:r'] : [paragraph['a:r']];
                for (const run of runs) {
                  if (run['a:t']) {
                    slideTexts.push(run['a:t']);
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`スライド${slideNumber}のテキスト抽出中にエラーが発生しました:`, error);
    }
    
    // スライドデータを追加
    textData.slides.push({
      slideNumber,
      text: slideTexts.join(' '),
    });
  }
  
  // 画像の抽出
  const imageRegex = /ppt\/media\/image\d+\.(png|jpeg|jpg|gif)/i;
  const imageEntries = Object.keys(zip.files).filter(name => imageRegex.test(name));
  
  for (const imagePath of imageEntries) {
    try {
      const imageExtension = path.extname(imagePath).toLowerCase();
      const imageBuffer = zip.file(imagePath).asNodeBuffer();
      const outputImageName = `image_${timestamp}_${imageCount + 1}.png`;
      const outputPath = path.join(imagesDir, outputImageName);
      
      fs.writeFileSync(outputPath, imageBuffer);
      
      // スライドデータに画像情報を追加
      textData.slides.forEach(slide => {
        if (!slide.images) slide.images = [];
        slide.images.push({
          fileName: outputImageName,
          originalPath: imagePath
        });
      });
      
      imageCount++;
    } catch (error) {
      console.warn(`画像${imagePath}の抽出中にエラーが発生しました:`, error);
    }
  }
  
  return { textData, imageCount };
}

// Excelファイルからコンテンツを抽出
export async function extractExcelContent(filePath: string, imagesDir: string, timestamp: number) {
  const content = fs.readFileSync(filePath);
  const zip = new PizZip(content);
  
  // テキストデータを格納するオブジェクト
  const textData = {
    title: path.basename(filePath, path.extname(filePath)),
    sheets: [],
    metadata: {
      extractedAt: new Date().toISOString(),
      originalFileName: path.basename(filePath)
    }
  };
  
  let imageCount = 0;
  
  // シート情報を取得
  const workbookPath = 'xl/workbook.xml';
  if (!zip.files[workbookPath]) {
    throw new Error('ワークブックデータが見つかりません');
  }
  
  const workbookContent = zip.file(workbookPath).asText();
  const parser = new xml2js.Parser({ explicitArray: false });
  const workbookXml = await parser.parseStringPromise(workbookContent);
  
  // シート名の取得
  const sheets = workbookXml['workbook']['sheets']['sheet'];
  const sheetList = Array.isArray(sheets) ? sheets : [sheets];
  
  // 文字列テーブルの読み込み
  let sharedStrings = [];
  if (zip.files['xl/sharedStrings.xml']) {
    const sharedStringsContent = zip.file('xl/sharedStrings.xml').asText();
    const sharedStringsXml = await parser.parseStringPromise(sharedStringsContent);
    
    if (sharedStringsXml['sst'] && sharedStringsXml['sst']['si']) {
      const stringItems = sharedStringsXml['sst']['si'];
      sharedStrings = Array.isArray(stringItems) ? stringItems.map(item => {
        if (item['t']) return item['t'];
        if (item['r']) {
          const runs = Array.isArray(item['r']) ? item['r'] : [item['r']];
          return runs.map(run => run['t'] || '').join('');
        }
        return '';
      }) : [stringItems['t'] || ''];
    }
  }
  
  // 各シートのデータを抽出
  for (const sheet of sheetList) {
    const sheetName = sheet['$']['name'];
    const sheetId = sheet['$']['sheetId'];
    const sheetPath = `xl/worksheets/sheet${sheetId}.xml`;
    
    if (!zip.files[sheetPath]) {
      console.warn(`シート「${sheetName}」のデータが見つかりません`);
      continue;
    }
    
    const sheetContent = zip.file(sheetPath).asText();
    const sheetXml = await parser.parseStringPromise(sheetContent);
    
    const rows = [];
    
    try {
      if (sheetXml['worksheet'] && sheetXml['worksheet']['sheetData'] && sheetXml['worksheet']['sheetData']['row']) {
        const rowElements = sheetXml['worksheet']['sheetData']['row'];
        const rowList = Array.isArray(rowElements) ? rowElements : [rowElements];
        
        for (const row of rowList) {
          if (!row['c']) continue;
          
          const cells = Array.isArray(row['c']) ? row['c'] : [row['c']];
          const rowData = {};
          
          for (const cell of cells) {
            const cellRef = cell['$'] && cell['$']['r'] ? cell['$']['r'] : '';
            const cellType = cell['$'] && cell['$']['t'] ? cell['$']['t'] : '';
            let cellValue = cell['v'] || '';
            
            // 共有文字列の場合、実際の値に変換
            if (cellType === 's' && sharedStrings[parseInt(cellValue)]) {
              cellValue = sharedStrings[parseInt(cellValue)];
            }
            
            // A1形式のセル参照から列名を抽出（例：A1 -> A）
            const colName = cellRef.replace(/[0-9]/g, '');
            rowData[colName] = cellValue;
          }
          
          rows.push(rowData);
        }
      }
    } catch (error) {
      console.warn(`シート「${sheetName}」のデータ抽出中にエラーが発生しました:`, error);
    }
    
    // シートデータを追加
    textData.sheets.push({
      name: sheetName,
      id: sheetId,
      rows: rows
    });
  }
  
  // 画像の抽出
  const drawingRegex = /xl\/drawings\/drawing\d+\.xml/;
  const drawingEntries = Object.keys(zip.files).filter(name => drawingRegex.test(name));
  
  for (const drawingPath of drawingEntries) {
    try {
      const drawingContent = zip.file(drawingPath).asText();
      const drawingXml = await parser.parseStringPromise(drawingContent);
      
      // 画像参照の検索
      if (drawingXml['xdr:wsDr'] && drawingXml['xdr:wsDr']['xdr:twoCellAnchor']) {
        const anchors = Array.isArray(drawingXml['xdr:wsDr']['xdr:twoCellAnchor']) 
          ? drawingXml['xdr:wsDr']['xdr:twoCellAnchor'] 
          : [drawingXml['xdr:wsDr']['xdr:twoCellAnchor']];
        
        for (const anchor of anchors) {
          if (anchor['xdr:pic'] && anchor['xdr:pic']['xdr:blipFill'] && 
              anchor['xdr:pic']['xdr:blipFill']['a:blip'] && 
              anchor['xdr:pic']['xdr:blipFill']['a:blip']['$'] && 
              anchor['xdr:pic']['xdr:blipFill']['a:blip']['$']['r:embed']) {
            
            const embedId = anchor['xdr:pic']['xdr:blipFill']['a:blip']['$']['r:embed'];
            const drawingNum = drawingPath.match(/drawing(\d+)\.xml/)[1];
            const relsPath = `xl/drawings/_rels/drawing${drawingNum}.xml.rels`;
            
            if (zip.files[relsPath]) {
              const relsContent = zip.file(relsPath).asText();
              const relsXml = await parser.parseStringPromise(relsContent);
              
              if (relsXml['Relationships'] && relsXml['Relationships']['Relationship']) {
                const relationships = Array.isArray(relsXml['Relationships']['Relationship']) 
                  ? relsXml['Relationships']['Relationship'] 
                  : [relsXml['Relationships']['Relationship']];
                
                for (const rel of relationships) {
                  if (rel['$'] && rel['$']['Id'] === embedId) {
                    const imagePath = 'xl/' + rel['$']['Target'].replace(/^\.\.\//, '');
                    
                    if (zip.files[imagePath]) {
                      const imageBuffer = zip.file(imagePath).asNodeBuffer();
                      const outputImageName = `image_${timestamp}_${imageCount + 1}.png`;
                      const outputPath = path.join(imagesDir, outputImageName);
                      
                      fs.writeFileSync(outputPath, imageBuffer);
                      imageCount++;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`図面ファイル${drawingPath}の処理中にエラーが発生しました:`, error);
    }
  }
  
  return { textData, imageCount };
}

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

interface HistoryItemForWorker {
  question: string;
  card?: {
    name: string;
    file: string;
  };
  response?: {
    interpretation: string;
    tips: string[];
  };
}


const splitText = (
  text: string,
  maxWidth: number,
  font: any,
  fontSize: number,
): string[] => {
  if (!text) return [''];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine === '' ? word : currentLine + ' ' + word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine !== '') {
      lines.push(currentLine.trim());
      currentLine = word; // Начинаем новую строку с текущего слова
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine.trim());
  }

  return lines;
};

// Главный обработчик сообщений воркера
self.onmessage = async (event: MessageEvent) => {
  if (event.data.type === 'generatePdf') {
    const { history, translations } = event.data as {
      history: HistoryItemForWorker[];
      translations: {
        historyTitle: string;
        historyQuestion: string;
        historyCard: string;
        noInterpretationText: string;
      };
    };

    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      const fontBytes = await fetch('/fonts/Roboto-Regular.ttf').then((res) =>
        res.arrayBuffer(),
      );
      const customFont = await pdfDoc.embedFont(fontBytes);

      const pageWidth = 595;
      const pageHeight = 842;
      const marginX = 50;
      const marginY = 50;
      const contentWidth = pageWidth - marginX * 2;

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.setFont(customFont);
      page.setFontColor(rgb(0, 0, 0));
      const LINE_HEIGHT_MULTIPLIER_TITLE = 1.4;
      const LINE_HEIGHT_MULTIPLIER_QUESTION = 1.3;
      const LINE_HEIGHT_MULTIPLIER_CARD = 1.3;
      const LINE_HEIGHT_MULTIPLIER_INTERPRETATION = 1.3;
      const LINE_HEIGHT_MULTIPLIER_TIP = 1.2;

      let cursorY = pageHeight - marginY;

      // ЗАГОЛОВОК PDF
      const titleFontSize = 24;
      page.setFontSize(titleFontSize);
      page.drawText(translations.historyTitle, {
        x: marginX,
        y: cursorY,
        color: rgb(0, 0, 0),
      });
      cursorY -= titleFontSize * LINE_HEIGHT_MULTIPLIER_TITLE;
      cursorY -= 20;

      // ИТЕРИРУЕМ ПО ИСТОРИИ ДЛЯ ДОБАВЛЕНИЯ СОДЕРЖИМОГО
      for (let idx = 0; idx < history.length; idx++) {
        const item = history[idx];

        // --- ПРЕДВАРИТЕЛЬНАЯ ОЦЕНКА ВЫСОТЫ ЭЛЕМЕНТА И ДОБАВЛЕНИЕ СТРАНИЦЫ ---
        let estimatedItemHeight = 0;

        // Вопрос
        const qText = `${idx + 1}. ${translations.historyQuestion}: ${item.question || ''}`;
        const qLines = splitText(qText, contentWidth, customFont, 12); 
        estimatedItemHeight +=
          qLines.length * 12 * LINE_HEIGHT_MULTIPLIER_QUESTION;
        estimatedItemHeight += 5;

        // Карта
        const cardTextEst = `${translations.historyCard}: ${item.card?.name || ''}`; 
        const cardLinesEst = splitText(
          cardTextEst,
          contentWidth - 20,
          customFont,
          12,
        );
        estimatedItemHeight +=
          cardLinesEst.length * 12 * LINE_HEIGHT_MULTIPLIER_CARD;
        estimatedItemHeight += 5;

        // Интерпретация
        const interpText =
          item.response?.interpretation || translations.noInterpretationText;
        const interpLines = splitText(
          interpText,
          contentWidth - 40,
          customFont,
          12,
        );
        estimatedItemHeight +=
          interpLines.length * 12 * LINE_HEIGHT_MULTIPLIER_INTERPRETATION;
        estimatedItemHeight += 5;

        // Советы
        if (item.response?.tips && item.response.tips.length > 0) {
          estimatedItemHeight += 6;
          item.response.tips.forEach((tip: string) => {
            const tipLines = splitText(
              `• ${tip}`,
              contentWidth - 50,
              customFont,
              12,
            );
            estimatedItemHeight +=
              tipLines.length * 12 * LINE_HEIGHT_MULTIPLIER_TIP;
          });
          estimatedItemHeight += 5;
        }
        estimatedItemHeight += 20;

        if (cursorY - estimatedItemHeight < marginY) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          page.setFont(customFont);
          page.setFontColor(rgb(0, 0, 0));
          cursorY = pageHeight - marginY;
        }

        // --- ВОПРОС ---
        const questionFontSize = 12;
        page.setFontSize(questionFontSize);
        const questionText = `${idx + 1}. ${translations.historyQuestion}: ${item.question || ''}`;
        const questionLines = splitText(
          questionText,
          contentWidth,
          customFont,
          questionFontSize,
        );
        questionLines.forEach((line) => {
          page.drawText(line, {
            x: marginX,
            y: cursorY,
            color: rgb(0, 0, 0),
          });
          cursorY -= questionFontSize * LINE_HEIGHT_MULTIPLIER_QUESTION;
        });
        cursorY -= 5;

        // --- КАРТА ---
        const cardFontSize = 11;
        page.setFontSize(cardFontSize);
        const cardText = `${translations.historyCard}: ${item.card?.name || ''}`;
        const cardLines = splitText(
          cardText,
          contentWidth - 20,
          customFont,
          cardFontSize,
        );
        cardLines.forEach((line) => {
          page.drawText(line, {
            x: marginX + 10,
            y: cursorY,
            color: rgb(0, 0, 0),
          });
          cursorY -= cardFontSize * LINE_HEIGHT_MULTIPLIER_CARD;
        });
        cursorY -= 5;

        // --- ИНТЕРПРЕТАЦИЯ ---
        const interpretationFontSize = 11;
        page.setFontSize(interpretationFontSize);
        const interpretationContent =
          item.response?.interpretation || translations.noInterpretationText;
        const interpretationParagraphs = interpretationContent
          .split(/\r?\n\s*\r?\n/)
          .filter((p) => p.trim() !== '');

        interpretationParagraphs.forEach((paragraph) => {
          const interpLines = splitText(
            paragraph.trim(),
            contentWidth - 20,
            customFont,
            interpretationFontSize,
          );
          interpLines.forEach((line) => {
            page.drawText(line, {
              x: marginX + 10,
              y: cursorY,
              color: rgb(0, 0, 0),
            });
            cursorY -=
              interpretationFontSize * LINE_HEIGHT_MULTIPLIER_INTERPRETATION;
          });
          cursorY -= 5;
        });
        cursorY -= 5;

        // --- СОВЕТЫ ---
        const tipFontSize = 11;
        if (item.response?.tips && item.response.tips.length > 0) {
          cursorY -= 10;
          page.setFontSize(tipFontSize);
          item.response.tips.forEach((tip: string) => {
            const tipLines = splitText(
              `• ${tip}`,
              contentWidth - 30,
              customFont,
              tipFontSize,
            );
            tipLines.forEach((line) => {
              page.drawText(line, {
                x: marginX + 20,
                y: cursorY,
                color: rgb(0, 0, 0),
              });
              cursorY -= tipFontSize * LINE_HEIGHT_MULTIPLIER_TIP;
            });
          });
          cursorY -= 5;
        }
        if (idx < history.length - 1) {
          cursorY -= 15;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      self.postMessage({ type: 'pdfGenerated', pdfBlob: blob });
    } catch (error: any) {
      console.error('Error in PDF worker:', error);
      self.postMessage({
        type: 'error',
        error: error.message || 'Unknown error',
      });
    }
  }
};

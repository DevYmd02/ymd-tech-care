/**
 * Converts a number to Thai Baht text representation.
 * Example: 1234.50 -> หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบสตางค์
 */
export function bahtText(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return 'ศูนย์บาทถ้วน';
  
  const numberVal = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numberVal)) return 'ศูนย์บาทถ้วน';

  // Round to 2 decimal places to handle currency values correctly
  const rounded = Math.round(numberVal * 100) / 100;
  if (rounded === 0) return 'ศูนย์บาทถ้วน';

  const negative = rounded < 0 ? 'ลบ' : '';
  const absNum = Math.abs(rounded);

  const parts = absNum.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] ? parts[1].substring(0, 2).padEnd(2, '0') : '00';

  const numberWords = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positionWords = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function convertSection(numStr: string): string {
    let result = '';
    const len = numStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(numStr[i]);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1) {
          result += 'เอ็ด';
        } else if (pos === 1 && digit === 1) {
          result += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          result += 'ยี่สิบ';
        } else {
          result += numberWords[digit] + positionWords[pos];
        }
      }
    }
    return result;
  }

  function convertInteger(numStr: string): string {
    if (numStr === '0') return '';
    let result = '';
    const len = numStr.length;
    // Chunk in groups of 6 digits (for "ล้าน")
    const chunks: string[] = [];
    for (let i = len; i > 0; i -= 6) {
      chunks.push(numStr.substring(Math.max(0, i - 6), i));
    }
    for (let i = 0; i < chunks.length; i++) {
      const sectionStr = chunks[i];
      const sectionText = convertSection(sectionStr);
      if (sectionText) {
        result = sectionText + (i > 0 ? 'ล้าน' : '') + result;
      }
    }
    return result;
  }

  let text = '';
  const integerVal = convertInteger(integerPart);
  if (integerVal) {
    text += integerVal + 'บาท';
  } else if (decimalPart !== '00') {
    text += 'ศูนย์บาท';
  }

  if (decimalPart === '00') {
    text += 'ถ้วน';
  } else {
    const decimalVal = convertSection(decimalPart);
    text += decimalVal + 'สตางค์';
  }

  return negative + text;
}

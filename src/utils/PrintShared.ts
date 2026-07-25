export const sharedPrintHeader = `
  <div style="width: 100%; text-align: center; margin-bottom: 24px; user-select: none;">
    <img src="https://i.postimg.cc/L63Ctd2m/HEEDER-4x.png" referrerpolicy="no-referrer" alt="Header" style="width: 100%; max-height: 120px; object-fit: contain;" />
  </div>
`;

export const sharedPrintFooter = `
  <div style="width: 100%; text-align: center; margin-top: auto; padding-top: 16px; user-select: none;">
    <img src="https://i.postimg.cc/ZqCwzC3n/tdyyl-4x.png" referrerpolicy="no-referrer" alt="Footer" style="width: 100%; max-height: 120px; object-fit: contain;" />
  </div>
`;

export const sharedPrintStyles = `
  @font-face { 
    font-family: 'EnglishNumbersOnly'; 
    unicode-range: U+0030-0039, U+002E, U+002F, U+002D, U+0025; 
    src: url('/fonts/Gotham-Pro.ttf') format('truetype'), local("Arial"); 
  }

  @font-face { font-family: 'GE SS Two'; src: url('/fonts/GE-SS-Two.ttf') format('truetype'); font-weight: normal; font-style: normal; }
    @font-face { font-family: 'Gotham Pro'; src: url('/fonts/Gotham-Pro.ttf') format('truetype'); font-weight: normal; font-style: normal; }
    @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 20mm; size: A4; }
  }
  body { font-family: 'EnglishNumbersOnly', 'Gotham Pro', 'GE SS', 'GE SS Two', sans-serif, system-ui !important; direction: rtl; }
  * { font-family: 'EnglishNumbersOnly', 'Gotham Pro', 'GE SS', 'GE SS Two', sans-serif !important; }
  .ql-align-center { text-align: center; }
  .ql-align-right { text-align: right; }
  .ql-align-left { text-align: left; }
  .ql-align-justify { text-align: justify; }
  .ql-font-tajawal { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif; }
  .ql-font-arial { font-family: 'Arial', 'Gotham Pro', sans-serif; }
  .ql-font-tahoma { font-family: 'Tahoma', 'Gotham Pro', sans-serif; }
  .ql-font-cairo { font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', 'Gotham Pro', sans-serif; }
  .ql-font-times-new-roman { font-family: 'Times New Roman', serif; }
  .ql-editor ul { padding-right: 20px; list-style-type: disc; }
  .ql-editor ol { padding-right: 20px; list-style-type: decimal; }
`;

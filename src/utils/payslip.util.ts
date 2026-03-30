import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Payslip } from '../Interfaces/payslip';
import { toWords } from 'number-to-words';
import moment from 'moment';

type SlipOptionalFields = '_id' | 'createdAt' | 'updatedAt';
export type PayslipData = Omit<Payslip, SlipOptionalFields> &
  Partial<Pick<Payslip, SlipOptionalFields>>;

export const generatePayslipPDFDefinition = (
  data: PayslipData
): TDocumentDefinitions => {
  const monthNames = monthNameList();
  const fileName = paySlipName(data);
  // Calculate Bonus Total
  const totalBonus =
    data.salaryStructure?.bonus?.reduce((sum, b) => sum + (b.amount || 0), 0) ||
    0;

  // Updated Gross Salary (Includes all interface fields)
  const grossSalary =
    (data.salaryStructure?.basicSalary || 0) +
    (data.salaryStructure?.hra || 0) +
    (data.salaryStructure?.medicalAllowance || 0) +
    (data.salaryStructure?.travelAllowance || 0) +
    (data.salaryStructure?.foodAllowance || 0) +
    (data.salaryStructure?.mobileAllowance || 0) +
    (data.salaryStructure?.otherAllowances || 0) +
    totalBonus;

  // Updated Total Deductions (Includes all interface fields)
  const totalDeductions =
    (data.salaryStructure?.incomeTax || 0) +
    (data.salaryStructure?.pfContribution || 0) +
    (data.salaryStructure?.esiContribution || 0) +
    (data.salaryStructure?.professionalTax || 0) +
    (data.salaryStructure?.lopDeduction || 0) +
    (data.salaryStructure?.otherDeductions || 0);

  const netSalary = grossSalary - totalDeductions;

  const d: TDocumentDefinitions = {
    info: {
      title: fileName,
      author: 'Unicodeze',
      subject: 'Payslip Document',
    },
    content: [
      // Company Header (Source 2, 3, 4)
      { text: 'PAYSLIP', style: 'mainHeader' },
      { text: 'UNICODEZ SOFTCORP PRIVATE LIMITED', style: 'companyName' },
      {
        text: '9/10, Floor 6th, Regal Treasure, Ayodhya Bypass RD\nBhopal MP 462041',
        style: 'address',
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }],
      },

      // Meta Info Sections (Source 5 & 6)
      {
        margin: [0, 15, 0, 15],
        columns: [
          {
            width: '50%',
            table: {
              widths: [80, 'auto'],
              body: [
                [
                  { text: 'Pay Period', bold: true },
                  `: ${monthNames[data.month - 1]} ${data.year}`,
                ],
                [
                  { text: 'Worked Days', bold: true },
                  `: ${data.workingDays || 0}`,
                ],
                [
                  { text: 'Date of Joining', bold: true },
                  `: ${data.dateOfJoining ? new Date(data.dateOfJoining).toLocaleDateString('en-GB') : 'N/A'}`,
                ],
              ],
            },
            layout: 'noBorders',
          },
          {
            width: '50%',
            table: {
              widths: [80, 'auto'],
              body: [
                [{ text: 'Employee Name', bold: true }, `: ${data.name}`],
                [{ text: 'Designation', bold: true }, `: ${data.designation}`],
                [{ text: 'Employee ID', bold: true }, `: ${data.employeeId}`],
              ],
            },
            layout: 'noBorders',
          },
        ],
      },

      // Main Earnings & Deductions Table
      {
        table: {
          widths: ['*', 80, '*', 80],
          body: [
            // Table Header
            [
              { text: 'Earnings', style: 'tableHeader' },
              { text: 'Amount', style: 'tableHeader' },
              { text: 'Deductions', style: 'tableHeader' },
              { text: 'Amount', style: 'tableHeader' },
            ],
            // Row 1: Basic & PF
            [
              'Basic',
              (data.salaryStructure?.basicSalary || 0).toFixed(2),
              'PF (Professional Tax)',
              (data.salaryStructure?.professionalTax || 0).toFixed(2),
            ],
            // Row 2: HRA & TDS
            [
              'House Rent Allowance',
              (data.salaryStructure?.hra || 0).toFixed(2),
              'TDS / Income Tax',
              (data.salaryStructure?.incomeTax || 0).toFixed(2),
            ],
            // Row 3: Medical & ESI
            [
              'Medical Allowance',
              (data.salaryStructure?.medicalAllowance || 0).toFixed(2),
              'ESI Contribution',
              (data.salaryStructure?.esiContribution || 0).toFixed(2),
            ],
            // Row 4: Travel & LOP
            [
              'Travel Allowance',
              (data.salaryStructure?.travelAllowance || 0).toFixed(2),
              'LOP Deduction',
              (data.salaryStructure?.lopDeduction || 0).toFixed(2),
            ],
            // Row 5: Food & Other Deductions
            [
              'Food Allowance',
              (data.salaryStructure?.foodAllowance || 0).toFixed(2),
              'Other Deductions',
              (data.salaryStructure?.otherDeductions || 0).toFixed(2),
            ],
            // Row 6: Mobile & Empty
            [
              'Mobile & Internet',
              (data.salaryStructure?.mobileAllowance || 0).toFixed(2),
              'PF Contribution',
              (data.salaryStructure?.pfContribution || 0).toFixed(2),
            ],
            // Row 7: Other Allowances
            [
              'Special Allowances',
              (data.salaryStructure?.otherAllowances || 0).toFixed(2),
              '',
              '',
            ],
            // Row 8: Bonuses (Dynamic)
            [
              { text: `Incentives/Bonus`, italics: true },
              totalBonus.toFixed(2),
              '',
              '',
            ],
            // Row 9: Totals
            [
              { text: 'Total Earnings', bold: true },
              { text: grossSalary.toFixed(2), bold: true },
              { text: 'Total Deductions', bold: true },
              { text: totalDeductions.toFixed(2), bold: true },
            ],
          ],
        },
        layout: {
          hLineWidth: (i) =>
            i === 0 || i === 1 || i === 9 || i === 10 ? 1 : 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#aaaaaa',
          vLineColor: () => '#aaaaaa',
        },
      },

      {
        text: `NET PAY: ₹ ${netSalary.toLocaleString('en-IN')}`,
        style: 'netPayLabel',
        margin: [0, 15, 0, 2],
      },
      {
        text: `In Words: ${toWords(netSalary)}`,
        italics: true,
        fontSize: 9,
      },

      {
        text: 'This is system generated payslip',
        style: 'footer',
        alignment: 'center',
        margin: [0, 40, 0, 0],
      },
    ],
    styles: {
      mainHeader: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 5],
        alignment: 'center',
      },
      companyName: {
        fontSize: 12,
        bold: true,
        alignment: 'center',
        marginBottom: 5,
      },
      address: {
        fontSize: 9,
        color: '#444444',
        alignment: 'center',
        marginBottom: 10,
      },
      tableHeader: { bold: true, fontSize: 10, fillColor: '#f2f2f2' },
      netPayLabel: { fontSize: 12, bold: true },
      footer: { fontSize: 8, color: '#888888', alignment: 'center' },
    },
    defaultStyle: { fontSize: 9 },
  };
  return d;
};

export const currentSalaryPeriod = () => {
  const previousMonth = moment().subtract(1, 'month');
  const month = previousMonth.month() + 1;
  const year = previousMonth.year();
  const monthName = getMonthName(month);
  return { month, year, monthName };
};

export function getMonthName(monthNumber: number) {
  const monthNames = monthNameList();
  return monthNames[monthNumber - 1] || 'N/A';
}

export function monthNameList() {
  return [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
}

export function paySlipName(payslipData: PayslipData) {
  const monthNames = monthNameList();
  return `Payslip_${payslipData.name}_${monthNames[payslipData.month - 1]}_${payslipData.year}.pdf`.replace(
    /\s+/g,
    '_'
  );
}

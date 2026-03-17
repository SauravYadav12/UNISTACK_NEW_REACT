import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  IconButton,
  Stack
} from '@mui/material';
import { Download, PictureAsPdf } from '@mui/icons-material';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Payslip } from '../../Interfaces/payslip';

// Set up pdfMake fonts
// (pdfMake).vfs = (pdfFonts as any).pdfMake?.vfs;

interface PayslipPDFViewerProps {
  payslipData: Payslip;
}

const PayslipPDFViewer: React.FC<PayslipPDFViewerProps> = ({ payslipData }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const generatePDFDefinition = (data: Payslip): TDocumentDefinitions => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const grossSalary = (data.salaryStructure?.basicSalary || 0) +
                       (data.salaryStructure?.hra || 0) +
                       (data.salaryStructure?.medicalAllowance || 0) +
                       (data.salaryStructure?.travelAllowance || 0) +
                       (data.salaryStructure?.foodAllowance || 0) +
                       (data.salaryStructure?.mobileAllowance || 0) +
                       (data.salaryStructure?.otherAllowances || 0);

    const totalDeductions = (data.salaryStructure?.incomeTax || 0) +
                           (data.salaryStructure?.pfContribution || 0) +
                           (data.salaryStructure?.esiContribution || 0) +
                           (data.salaryStructure?.professionalTax || 0) +
                           (data.salaryStructure?.lopDeduction || 0) +
                           (data.salaryStructure?.otherDeductions || 0);

    const netSalary = grossSalary - totalDeductions;

    return {
      content: [
        // Header
        {
          text: 'SALARY SLIP',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        
        // Employee Details
        {
          columns: [
            {
              width: '50%',
              text: [
                { text: 'Employee Name: ', bold: true },
                data.name || 'N/A',
                '\n',
                { text: 'Employee ID: ', bold: true },
                data.employeeId || 'N/A',
                '\n',
                { text: 'Designation: ', bold: true },
                data.designation || 'N/A',
              ]
            },
            {
              width: '50%',
              text: [
                { text: 'Month/Year: ', bold: true },
                `${monthNames[data.month - 1]} ${data.year}`,
                '\n',
                { text: 'Date of Joining: ', bold: true },
                data.dateOfJoining ? new Date(data.dateOfJoining).toLocaleDateString() : 'N/A',
                '\n',
                { text: 'Working Days: ', bold: true },
                data.workingDays?.toString() || 'N/A',
              ]
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // Salary Breakdown Table
        {
          style: 'tableStyle',
          table: {
            headerRows: 1,
            widths: ['*', 100, '*', 100],
            body: [
              [
                { text: 'EARNINGS', style: 'tableHeader', colSpan: 2, alignment: 'center' },
                {},
                { text: 'DEDUCTIONS', style: 'tableHeader', colSpan: 2, alignment: 'center' },
                {}
              ],
              [
                { text: 'Component', style: 'tableHeader' },
                { text: 'Amount (₹)', style: 'tableHeader' },
                { text: 'Component', style: 'tableHeader' },
                { text: 'Amount (₹)', style: 'tableHeader' }
              ],
              [
                'Basic Salary',
                (data.salaryStructure?.basicSalary || 0).toLocaleString(),
                'Income Tax',
                (data.salaryStructure?.incomeTax || 0).toLocaleString()
              ],
              [
                'HRA',
                (data.salaryStructure?.hra || 0).toLocaleString(),
                'PF Contribution',
                (data.salaryStructure?.pfContribution || 0).toLocaleString()
              ],
              [
                'Medical Allowance',
                (data.salaryStructure?.medicalAllowance || 0).toLocaleString(),
                'ESI Contribution',
                (data.salaryStructure?.esiContribution || 0).toLocaleString()
              ],
              [
                'Travel Allowance',
                (data.salaryStructure?.travelAllowance || 0).toLocaleString(),
                'Professional Tax',
                (data.salaryStructure?.professionalTax || 0).toLocaleString()
              ],
              [
                'Food Allowance',
                (data.salaryStructure?.foodAllowance || 0).toLocaleString(),
                'LOP Deduction',
                (data.salaryStructure?.lopDeduction || 0).toLocaleString()
              ],
              [
                'Mobile Allowance',
                (data.salaryStructure?.mobileAllowance || 0).toLocaleString(),
                'Other Deductions',
                (data.salaryStructure?.otherDeductions || 0).toLocaleString()
              ],
              [
                'Other Allowances',
                (data.salaryStructure?.otherAllowances || 0).toLocaleString(),
                '',
                ''
              ],
              [
                { text: 'GROSS SALARY', style: 'tableBold' },
                { text: `₹${grossSalary.toLocaleString()}`, style: 'tableBold' },
                { text: 'TOTAL DEDUCTIONS', style: 'tableBold' },
                { text: `₹${totalDeductions.toLocaleString()}`, style: 'tableBold' }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: '#000',
            vLineColor: '#000'
          }
        },

        // Net Salary
        {
          text: [
            { text: 'NET SALARY: ', bold: true, fontSize: 14 },
            { text: `₹${netSalary.toLocaleString()}`, bold: true, fontSize: 14, color: '#2e7d32' }
          ],
          alignment: 'center',
          margin: [0, 20, 0, 20]
        },

        // Footer
        {
          text: 'This is a computer-generated payslip and does not require a signature.',
          style: 'footer',
          alignment: 'center',
          margin: [0, 30, 0, 0]
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: '#1976d2'
        },
        tableStyle: {
          margin: [0, 5, 0, 15]
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black',
          fillColor: '#f5f5f5'
        },
        tableBold: {
          bold: true,
          fontSize: 10,
          fillColor: '#e3f2fd'
        },
        footer: {
          fontSize: 8,
          italics: true,
          color: '#666'
        }
      },
      defaultStyle: {
        fontSize: 10
      }
    };
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      const docDefinition = generatePDFDefinition(payslipData);
      
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      
      (pdfDocGenerator as any).getBlob((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setLoading(false);
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (payslipData) {
      const docDefinition = generatePDFDefinition(payslipData);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const fileName = `Payslip_${payslipData.name}_${monthNames[payslipData.month - 1]}_${payslipData.year}.pdf`;
      
      pdfMake.createPdf(docDefinition).download(fileName);
    }
  };

  useEffect(() => {
    if (payslipData) {
      generatePDF();
    }
  }, [payslipData]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PictureAsPdf color="error" />
          Payslip PDF
        </Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={downloadPDF}
          disabled={loading}
          color="primary"
        >
          Download PDF
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Generating PDF...</Typography>
        </Box>
      ) : pdfUrl ? (
        <Box sx={{ width: '100%', height: '600px', border: '1px solid #ddd', borderRadius: 1 }}>
          <iframe
            src={`${pdfUrl}#toolbar=1`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Payslip PDF"
          />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Typography color="error">Failed to generate PDF</Typography>
        </Box>
      )}
    </Box>
  );
};

export default PayslipPDFViewer;
import React, { useState } from 'react';
import { Button } from '../common/Button';
import { PreviewModal } from './PreviewModal';
import { Download, Edit, RotateCcw, ZoomIn, FolderGit } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PreviewPanelProps {
  resumeHtml: string | null;
  coverLetterHtml: string | null;
  onEditForm: () => void;
  onEditRepos: () => void;
  onNewGeneration: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  resumeHtml,
  coverLetterHtml,
  onEditForm,
  onEditRepos,
  onNewGeneration,
}) => {
  const [selectedPreview, setSelectedPreview] = useState<'resume' | 'coverLetter' | null>(null);

  const handleDownloadPDF = async (type: 'resume' | 'coverLetter') => {
    const htmlContent = type === 'resume' ? resumeHtml : coverLetterHtml;
    if (!htmlContent) return;

    try {
      // Create an iframe to completely isolate from parent document layout
      const iframe = document.createElement('iframe');
      Object.assign(iframe.style, {
        position: 'fixed',
        left: '-9999px',
        top: '0',
        width: '8.5in',
        height: '1200px',
        border: 'none',
        visibility: 'hidden',
        pointerEvents: 'none',
      });
      document.body.appendChild(iframe);

      // Wait for iframe to load
      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.srcdoc = htmlContent;
      });

      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDocument) {
        throw new Error('Failed to access iframe document');
      }

      const container = iframeDocument.body;
      container.style.margin = '0';
      container.style.padding = '0';
      container.style.backgroundColor = '#ffffff';

      // Wait for images and fonts to load
      const images = container.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails
          setTimeout(resolve, 3000); // Timeout after 3 seconds
        });
      });
      await Promise.all(imagePromises);
      await new Promise((resolve) => setTimeout(resolve, 200)); // Additional wait for rendering

      // Convert HTML to canvas using html2canvas
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true, // Allow cross-origin images
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate PDF dimensions (A4: 210mm x 297mm)
      const pdfWidth = 210; // mm
      const pdfHeight = 297; // mm
      
      // 1 inch = 25.4mm margins on all sides
      const margin = 25.4; // mm
      const contentWidth = pdfWidth - (2 * margin); // Account for left and right margins
      const contentHeight = pdfHeight - (2 * margin); // Account for top and bottom margins
      
      // Scale image to fit within the content area (with margins)
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF in portrait orientation
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Handle multi-page content
      if (imgHeight > contentHeight) {
        // Content spans multiple pages - use negative y positions to show different portions
        const totalPages = Math.ceil(imgHeight / contentHeight);
        const imageData = canvas.toDataURL('image/png');

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          // Calculate y offset: negative value to show the appropriate portion of the image
          // Add margin to account for top margin on each page
          const yOffset = margin - (i * contentHeight);
          pdf.addImage(imageData, 'PNG', margin, yOffset, imgWidth, imgHeight);
        }
      } else {
        // Content fits on one page - position with 1 inch margin from top and left
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, imgWidth, imgHeight);
      }

      // Download the PDF
      const filename = type === 'resume' ? 'resume.pdf' : 'cover-letter.pdf';
      pdf.save(filename);

      // Clean up
      document.body.removeChild(iframe);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (!resumeHtml || !coverLetterHtml) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Preview</h2>
        <div className="flex space-x-2">
          <Button onClick={onEditRepos} variant="secondary" className="flex items-center space-x-2">
            <FolderGit className="w-4 h-4" />
            <span>Edit Repos</span>
          </Button>
          <Button onClick={onEditForm} variant="secondary" className="flex items-center space-x-2">
            <Edit className="w-4 h-4" />
            <span>Edit Form</span>
          </Button>
          <Button onClick={onNewGeneration} variant="secondary" className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4" />
            <span>New Generation</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resume Preview */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resume</h3>
            <div className="flex space-x-2">
              <Button
                onClick={() => setSelectedPreview('resume')}
                variant="secondary"
                className="p-2"
                title="View Full"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleDownloadPDF('resume')}
                variant="primary"
                className="p-2"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-md overflow-hidden max-h-[600px] overflow-y-auto">
            <iframe
              srcDoc={resumeHtml}
              className="w-full min-h-[400px] border-0"
              title="Resume Preview"
            />
          </div>
        </div>

        {/* Cover Letter Preview */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cover Letter</h3>
            <div className="flex space-x-2">
              <Button
                onClick={() => setSelectedPreview('coverLetter')}
                variant="secondary"
                className="p-2"
                title="View Full"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleDownloadPDF('coverLetter')}
                variant="primary"
                className="p-2"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-md overflow-hidden max-h-[600px] overflow-y-auto">
            <iframe
              srcDoc={coverLetterHtml}
              className="w-full min-h-[400px] border-0"
              title="Cover Letter Preview"
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <PreviewModal
        isOpen={selectedPreview === 'resume'}
        onClose={() => setSelectedPreview(null)}
        title="Resume"
        htmlContent={resumeHtml}
      />
      <PreviewModal
        isOpen={selectedPreview === 'coverLetter'}
        onClose={() => setSelectedPreview(null)}
        title="Cover Letter"
        htmlContent={coverLetterHtml}
      />
    </div>
  );
};


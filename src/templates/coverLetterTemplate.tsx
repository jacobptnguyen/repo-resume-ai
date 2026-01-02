import type { UserProfile } from '../lib/types';

interface CoverLetterTemplateProps {
  profile: UserProfile;
  jobDescription: string;
  coverLetterContent: string; // AI-generated content
  signatureUrl?: string | null;
  fontSize: number;
}

export const coverLetterTemplate = ({
  profile,
  jobDescription,
  coverLetterContent,
  signatureUrl,
  fontSize,
}: CoverLetterTemplateProps): string => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: ${fontSize}pt;
      line-height: 1.6;
      color: #000;
      padding: 20px;
      max-width: 8.5in;
      margin: 0 auto;
    }
    .header {
      margin-bottom: 30px;
    }
    .header-name {
      font-weight: bold;
      font-size: ${fontSize * 1.1}pt;
      margin-bottom: 5px;
    }
    .header-contact {
      font-size: ${fontSize * 0.9}pt;
      margin-top: 5px;
    }
    .header-contact span {
      margin: 0 10px;
    }
    .date {
      margin-bottom: 30px;
      font-size: ${fontSize}pt;
    }
    .greeting {
      margin-bottom: 15px;
      font-size: ${fontSize}pt;
    }
    .content {
      margin-bottom: 20px;
      text-align: justify;
      font-size: ${fontSize}pt;
    }
    .paragraph {
      margin-bottom: 15px;
    }
    .closing {
      margin-top: 30px;
      margin-bottom: 10px;
    }
    .signature {
      margin-top: 50px;
    }
    .signature-name {
      font-weight: bold;
      margin-top: 10px;
    }
    .signature-image {
      max-width: 200px;
      max-height: 100px;
      margin-top: 20px;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-name">${profile.name}</div>
    <div class="header-contact">
      ${profile.location ? `<span>${profile.location}</span>` : ''}
      ${profile.email ? `<span>${profile.email}</span>` : ''}
      ${profile.phone ? `<span>${profile.phone}</span>` : ''}
      ${profile.linkedin_url ? `<span><a href="${profile.linkedin_url}">LinkedIn</a></span>` : ''}
    </div>
  </div>

  <div class="date">${currentDate}</div>

  <div class="greeting">Dear Hiring Manager,</div>

  <div class="content">
    ${coverLetterContent.split('\n\n').map(paragraph => 
      `<div class="paragraph">${paragraph.trim().replace(/\n/g, '<br>')}</div>`
    ).join('')}
  </div>

  <div class="closing">
    <div>Sincerely,</div>
    ${signatureUrl ? `<img src="${signatureUrl}" alt="Signature" class="signature-image" />` : ''}
    <div class="signature-name">${profile.name}</div>
  </div>
</body>
</html>
  `;

  return html.trim();
};


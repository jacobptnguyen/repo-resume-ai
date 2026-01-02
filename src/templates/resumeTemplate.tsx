import type { UserProfile, EducationEntry, WorkExperienceEntry, SelectedProject, ExtractedSkills } from '../lib/types';

interface ResumeTemplateProps {
  profile: UserProfile;
  educationEntries: EducationEntry[];
  workExperienceEntries: WorkExperienceEntry[];
  selectedProjects: SelectedProject[];
  extractedSkills: ExtractedSkills;
  fontSize: number;
}

export const resumeTemplate = ({
  profile,
  educationEntries,
  workExperienceEntries,
  selectedProjects,
  extractedSkills,
  fontSize,
}: ResumeTemplateProps): string => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

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
      line-height: 1.5;
      color: #000;
      padding: 20px;
      max-width: 8.5in;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .name {
      font-size: ${fontSize * 1.8}pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .contact-info {
      font-size: ${fontSize * 0.9}pt;
      margin-top: 5px;
    }
    .contact-info span {
      margin: 0 10px;
    }
    .section {
      margin-top: 20px;
      margin-bottom: 15px;
    }
    .section-title {
      font-size: ${fontSize * 1.2}pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      margin-bottom: 10px;
      padding-bottom: 3px;
    }
    .entry {
      margin-bottom: 15px;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 5px;
    }
    .entry-title {
      font-weight: bold;
      font-size: ${fontSize * 1.1}pt;
    }
    .entry-date {
      font-style: italic;
      font-size: ${fontSize * 0.9}pt;
    }
    .entry-subtitle {
      font-size: ${fontSize * 0.95}pt;
      margin-bottom: 5px;
    }
    .entry-list {
      margin-left: 20px;
      margin-top: 5px;
    }
    .entry-list li {
      margin-bottom: 3px;
    }
    .skills-section {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 10px;
    }
    .skill-category {
      flex: 1;
      min-width: 150px;
    }
    .skill-category-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .skill-list {
      font-size: ${fontSize * 0.9}pt;
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
    <div class="name">${profile.name}</div>
    <div class="contact-info">
      ${profile.location ? `<span>${profile.location}</span>` : ''}
      ${profile.email ? `<span>${profile.email}</span>` : ''}
      ${profile.phone ? `<span>${profile.phone}</span>` : ''}
      ${profile.linkedin_url ? `<span><a href="${profile.linkedin_url}">LinkedIn</a></span>` : ''}
      ${profile.github_url ? `<span><a href="${profile.github_url}">GitHub</a></span>` : ''}
      ${profile.portfolio_url ? `<span><a href="${profile.portfolio_url}">Portfolio</a></span>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Education</div>
    ${educationEntries.map((edu) => `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">${edu.university}${edu.location ? `, ${edu.location}` : ''}</div>
          <div class="entry-date">${formatDate(edu.graduation_date)}</div>
        </div>
        <div class="entry-subtitle">
          ${edu.degree}${edu.major ? ` ${edu.major}` : ''}${edu.minor ? `, Minor: ${edu.minor}` : ''}${edu.gpa ? `, GPA: ${edu.gpa.toFixed(2)}` : ''}${edu.honors ? `, ${edu.honors}` : ''}
        </div>
        ${edu.coursework && edu.coursework.trim()
          ? `<div style="margin-top: 5px;">
               <div class="entry-subtitle" style="font-size: ${fontSize * 0.9}pt; font-weight: bold;">Relevant Coursework:</div>
               <ul class="entry-list">
                 ${edu.coursework.split('\n').filter(line => line.trim()).map(course => `<li>${course.trim()}</li>`).join('')}
               </ul>
             </div>`
          : ''}
      </div>
    `).join('')}
  </div>

  ${workExperienceEntries.length > 0 ? `
    <div class="section">
      <div class="section-title">Work Experience</div>
      ${workExperienceEntries.map((work) => `
        <div class="entry">
          <div class="entry-header">
            <div class="entry-title">${work.company} | ${work.job_title}</div>
            <div class="entry-date">
              ${formatDate(work.start_date)} - ${work.end_date ? formatDate(work.end_date) : 'Present'}
            </div>
          </div>
          <ul class="entry-list">
            ${work.description.split('\n').filter(line => line.trim()).map(line => `<li>${line.trim()}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Projects</div>
    ${selectedProjects.map((project) => `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">${project.name} ${project.technologies ? `| ${project.technologies.join(', ')}` : ''}</div>
          ${project.url ? `<div><a href="${project.url}">${project.url}</a></div>` : ''}
        </div>
        <ul class="entry-list">
          ${project.description.split('\n').filter(line => line.trim()).map(line => `<li>${line.trim()}</li>`).join('')}
        </ul>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-section">
      ${extractedSkills.languages && extractedSkills.languages.length > 0 ? `
        <div class="skill-category">
          <div class="skill-category-title">Languages:</div>
          <div class="skill-list">${extractedSkills.languages.join(', ')}</div>
        </div>
      ` : ''}
      ${extractedSkills.frameworks && extractedSkills.frameworks.length > 0 ? `
        <div class="skill-category">
          <div class="skill-category-title">Frameworks:</div>
          <div class="skill-list">${extractedSkills.frameworks.join(', ')}</div>
        </div>
      ` : ''}
      ${extractedSkills.tools && extractedSkills.tools.length > 0 ? `
        <div class="skill-category">
          <div class="skill-category-title">Tools:</div>
          <div class="skill-list">${extractedSkills.tools.join(', ')}</div>
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;

  return html.trim();
};


import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GenerationRequest {
  user_id: string;
  job_description: string;
  num_projects: number;
  font_size: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${year}`;
}

function formatGraduationDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${year}`;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function generateResumeHTML(profile: any, education: any[], work: any[], projects: any[], skills: any, fontSize: number): string {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
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
    .contact-info span { margin: 0 10px; }
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
    .entry { margin-bottom: 15px; }
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
      margin-top: 2px;
    }
    .entry-list {
      margin-left: 20px;
      margin-top: 5px;
    }
    .entry-list li { margin-bottom: 3px; }
    .skills-section {
      margin-top: 10px;
    }
    .skill-list {
      font-size: ${fontSize * 0.9}pt;
      line-height: 1.6;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${escapeHtml(profile.name)}</div>
    <div class="contact-info">
      ${profile.location ? `<span>${escapeHtml(profile.location)}</span>` : ''}
      ${(profile.location && profile.phone) ? '|' : ''}
      ${profile.phone ? `<span>${escapeHtml(profile.phone)}</span>` : ''}
      ${((profile.location || profile.phone) && profile.email) ? '|' : ''}
      ${profile.email ? `<span>${escapeHtml(profile.email)}</span>` : ''}
      ${((profile.location || profile.phone || profile.email) && profile.linkedin_url) ? '|' : ''}
      ${profile.linkedin_url ? `<span><a href="${escapeHtml(profile.linkedin_url)}">LinkedIn</a></span>` : ''}
      ${((profile.location || profile.phone || profile.email || profile.linkedin_url) && profile.github_url) ? '|' : ''}
      ${profile.github_url ? `<span><a href="${escapeHtml(profile.github_url)}">GitHub</a></span>` : ''}
      ${((profile.location || profile.phone || profile.email || profile.linkedin_url || profile.github_url) && profile.portfolio_url) ? '|' : ''}
      ${profile.portfolio_url ? `<span><a href="${escapeHtml(profile.portfolio_url)}">Portfolio</a></span>` : ''}
    </div>
  </div>

  <div class="section">
    ${education.map((edu: any) => {
      const universityLine = `${escapeHtml(edu.university)}`;
      const degreeParts: string[] = [];
      if (edu.degree) degreeParts.push(escapeHtml(edu.degree));
      if (edu.major) degreeParts.push(`in ${escapeHtml(edu.major)}`);
      if (edu.minor) degreeParts.push(`, ${escapeHtml(edu.minor)}`);
      const degreeLine = degreeParts.join(' ') + (edu.graduation_date ? ` ${formatGraduationDate(edu.graduation_date)}` : '');
      
      const gpaLine = edu.gpa ? `GPA: ${edu.gpa.toFixed(2)}` : '';
      const honorsLine = edu.honors ? ` | ${escapeHtml(edu.honors)}` : '';
      
      const courseworkText = edu.coursework && edu.coursework.trim() 
        ? edu.coursework.split('\n').filter((line: string) => line.trim()).map((course: string) => escapeHtml(course.trim())).join(', ')
        : '';
      
      return `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">${universityLine}</div>
          ${edu.location ? `<div class="entry-date" style="font-weight: bold; font-style: normal;">${escapeHtml(edu.location)}</div>` : ''}
        </div>
        <div class="entry-subtitle">${degreeLine}</div>
        ${(gpaLine || honorsLine || courseworkText) ? `<ul class="entry-list">
          ${gpaLine || honorsLine ? `<li>${gpaLine}${honorsLine}</li>` : ''}
          ${courseworkText ? `<li>Relevant Coursework: ${courseworkText}</li>` : ''}
        </ul>` : ''}
      </div>
    `;
    }).join('')}
  </div>

  ${work.length > 0 ? `
    <div class="section">
      <div class="section-title">Work Experience</div>
      ${work.map((w: any) => {
        // Clean up line: remove leading bullet points/dashes since <li> creates bullets automatically
        const cleanLine = (text: string): string => {
          return text.replace(/^[\s]*[•●\-\*\d]+[\.\)]*[\s]*/, '').trim();
        };
        
        // Split into sentences: handle both newlines and sentence boundaries
        const splitIntoSentences = (text: string): string[] => {
          // First, normalize newlines and split by them
          const normalized = text.replace(/\\n/g, '\n');
          const lines = normalized.split(/\n/).filter((line: string) => line.trim());
          
          const sentences: string[] = [];
          
          lines.forEach((line: string) => {
            // Split by sentence boundaries: . ! ? followed by space
            // Match pattern: sentence punctuation followed by whitespace
            const parts = line.split(/([.!?]\s+)/);
            
            // Reconstruct sentences (split includes delimiters in separate elements)
            let currentSentence = '';
            for (let i = 0; i < parts.length; i++) {
              if (parts[i].match(/^[.!?]\s+$/)) {
                // This is a sentence delimiter, add it to current sentence and push
                currentSentence += parts[i].trim();
                if (currentSentence.trim()) {
                  sentences.push(currentSentence.trim());
                }
                currentSentence = '';
              } else {
                currentSentence += parts[i];
              }
            }
            // Add any remaining text as a sentence
            if (currentSentence.trim()) {
              sentences.push(currentSentence.trim());
            }
          });
          
          return sentences.filter((s: string) => s.length > 0);
        };
        
        const sentences = splitIntoSentences(w.description);
        
        return `
        <div class="entry">
          <div class="entry-title">${escapeHtml(w.company)}</div>
          <div class="entry-header">
            <div class="entry-subtitle">${escapeHtml(w.job_title)}</div>
            <div class="entry-date">
              ${formatDate(w.start_date)} - ${w.end_date ? formatDate(w.end_date) : 'Present'}
            </div>
          </div>
          <ul class="entry-list">
            ${sentences.map((sentence: string) => `<li>${escapeHtml(cleanLine(sentence))}</li>`).join('')}
          </ul>
        </div>
      `;
      }).join('')}
    </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Projects</div>
    ${projects.map((project: any) => {
      const timeframe = project.timeframe || 'Personal Project';
      const projectLocation = project.location || '';
      
      // Clean up line: remove leading bullet points/dashes since <li> creates bullets automatically
      const cleanLine = (text: string): string => {
        // Remove common bullet points: ●, •, -, *, and numbers with dots/parens
        return text.replace(/^[\s]*[•●\-\*\d]+[\.\)]*[\s]*/, '').trim();
      };
      
      // Split into sentences: handle both newlines and sentence boundaries
      const splitIntoSentences = (text: string): string[] => {
        // First, normalize newlines and split by them
        const normalized = text.replace(/\\n/g, '\n');
        const lines = normalized.split(/\n/).filter((line: string) => line.trim());
        
        const sentences: string[] = [];
        
        lines.forEach((line: string) => {
          // Split by sentence boundaries: . ! ? followed by space
          // Match pattern: sentence punctuation followed by whitespace
          const parts = line.split(/([.!?]\s+)/);
          
          // Reconstruct sentences (split includes delimiters in separate elements)
          let currentSentence = '';
          for (let i = 0; i < parts.length; i++) {
            if (parts[i].match(/^[.!?]\s+$/)) {
              // This is a sentence delimiter, add it to current sentence and push
              currentSentence += parts[i].trim();
              if (currentSentence.trim()) {
                sentences.push(currentSentence.trim());
              }
              currentSentence = '';
            } else {
              currentSentence += parts[i];
            }
          }
          // Add any remaining text as a sentence
          if (currentSentence.trim()) {
            sentences.push(currentSentence.trim());
          }
        });
        
        return sentences.filter((s: string) => s.length > 0);
      };
      
      const sentences = splitIntoSentences(project.description);
      // Limit to first 3 sentences for projects
      const limitedSentences = sentences.slice(0, 3);
      
      return `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">${escapeHtml(project.name)}</div>
          ${projectLocation ? `<div class="entry-date" style="font-weight: bold; font-style: normal;">${escapeHtml(projectLocation)}</div>` : ''}
        </div>
        <div class="entry-subtitle">${escapeHtml(timeframe)}</div>
        <ul class="entry-list">
          ${limitedSentences.map((sentence: string) => {
            const cleaned = cleanLine(sentence);
            return `<li>${escapeHtml(cleaned)}</li>`;
          }).join('')}
        </ul>
      </div>
    `;
    }).join('')}
  </div>

  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-section">
      ${(skills.languages && skills.languages.length > 0) || (skills.frontend && skills.frontend.length > 0) || (skills.backend && skills.backend.length > 0) || (skills.databases && skills.databases.length > 0) || (skills.ml_data_science && skills.ml_data_science.length > 0) || (skills.devops && skills.devops.length > 0) || (skills.tools && skills.tools.length > 0) ? `
        <div class="skill-list">
          ${skills.languages && skills.languages.length > 0 ? `Languages: ${skills.languages.map((s: string) => escapeHtml(s)).join(', ')}<br>` : ''}
          ${skills.frontend && skills.frontend.length > 0 ? `Frontend: ${skills.frontend.map((s: string) => escapeHtml(s)).join(', ')}` : ''}
          ${skills.frontend && skills.frontend.length > 0 && skills.backend && skills.backend.length > 0 ? ' | ' : ''}
          ${skills.backend && skills.backend.length > 0 ? `Backend: ${skills.backend.map((s: string) => escapeHtml(s)).join(', ')}` : ''}
          ${((skills.frontend && skills.frontend.length > 0) || (skills.backend && skills.backend.length > 0)) && (skills.databases && skills.databases.length > 0) ? '<br>' : ''}
          ${skills.databases && skills.databases.length > 0 ? `Databases: ${skills.databases.map((s: string) => escapeHtml(s)).join(', ')}` : ''}
          ${skills.databases && skills.databases.length > 0 && skills.ml_data_science && skills.ml_data_science.length > 0 ? ' | ' : ''}
          ${skills.ml_data_science && skills.ml_data_science.length > 0 ? `ML/Data Science: ${skills.ml_data_science.map((s: string) => escapeHtml(s)).join(', ')}` : ''}
          ${((skills.databases && skills.databases.length > 0) || (skills.ml_data_science && skills.ml_data_science.length > 0)) && (skills.devops && skills.devops.length > 0) ? '<br>' : ''}
          ${skills.devops && skills.devops.length > 0 ? `DevOps: ${skills.devops.map((s: string) => escapeHtml(s)).join(', ')}` : ''}
          ${(skills.devops && skills.devops.length > 0) && (skills.tools && skills.tools.length > 0) ? ' | ' : ''}
          ${skills.tools && skills.tools.length > 0 ? `Tools: ${skills.tools.map((s: string) => escapeHtml(s)).join(', ')}` : ''}
          ${(!skills.frontend && !skills.backend && !skills.databases && !skills.ml_data_science && !skills.devops) && skills.frameworks && skills.frameworks.length > 0 ? `<br>Frameworks: ${skills.frameworks.map((s: string) => escapeHtml(s)).join(', ')}` : ''}
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
  return html.trim();
}

function generateCoverLetterHTML(profile: any, content: string, signatureUrl: string | null, fontSize: number): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: ${fontSize}pt;
      line-height: 1.6;
      color: #000;
      padding: 20px;
      max-width: 8.5in;
      margin: 0 auto;
    }
    .header { margin-bottom: 10px; }
    .header-name {
      font-weight: bold;
      font-size: ${fontSize * 1.1}pt;
      margin-bottom: 3px;
    }
    .header-contact {
      font-size: ${fontSize * 0.9}pt;
      margin-top: 2px;
    }
    .header-contact span { margin: 0 5px; }
    .date {
      margin-bottom: 15px;
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
      margin-bottom: 20px;
      margin-top: 0;
    }
    .paragraph:first-of-type {
      margin-top: 0;
    }
    .paragraph:last-of-type {
      margin-bottom: 0;
    }
    .closing {
      margin-top: 30px;
      margin-bottom: 10px;
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
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-name">${escapeHtml(profile.name)}</div>
    ${profile.location ? `<div class="header-contact">${escapeHtml(profile.location)}</div>` : ''}
    ${profile.phone ? `<div class="header-contact">${escapeHtml(profile.phone)}</div>` : ''}
    ${profile.email ? `<div class="header-contact">${escapeHtml(profile.email)}</div>` : ''}
  </div>

  <div class="date">${currentDate}</div>

  <div class="greeting">Dear Hiring Manager,</div>

  <div class="content">
    ${content
      // Handle both escaped (\n\n) and actual newlines
      .split(/\n\n|\\n\\n/)
      .filter((paragraph: string) => {
        const trimmed = paragraph.trim().toLowerCase();
        // Filter out "Dear hiring manager," if AI includes it
        return trimmed && !trimmed.startsWith('dear hiring manager');
      })
      .map((paragraph: string) => {
        // Clean up the paragraph: replace single newlines with <br>, trim whitespace
        const cleaned = paragraph.trim().replace(/\n/g, '<br>');
        return `<div class="paragraph">${cleaned}</div>`;
      })
      .join('\n')}
  </div>

  <div class="closing">
    <div>Sincerely,</div>
    ${signatureUrl ? `<img src="${escapeHtml(signatureUrl)}" alt="Signature" class="signature-image" />` : ''}
    <div class="signature-name">${escapeHtml(profile.name)}</div>
  </div>
</body>
</html>`;
  return html.trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let requestId: string;
  try {
    requestId = crypto.randomUUID();
  } catch {
    requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  console.log(`[${requestId}] ========== VERCEL FUNCTION STARTED ==========`);
  console.log(`[${requestId}] Method: ${req.method}`);
  console.log(`[${requestId}] URL: ${req.url}`);

  // Set CORS headers FIRST
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] CORS preflight request`);
    return res.status(200).end();
  }

  // Helper function to ensure all JSON responses include CORS headers
  const sendJsonResponse = (statusCode: number, data: any) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(statusCode).json(data);
  };

  try {
    console.log(`[${requestId}] Request received, parsing body...`);
    const { user_id, job_description, num_projects }: GenerationRequest = req.body;

    // Font size is always 11pt
    const font_size = 11;

    if (!user_id || !job_description || !num_projects) {
      console.error(`[${requestId}] Missing required fields:`, { user_id: !!user_id, job_description: !!job_description, num_projects });
      return sendJsonResponse(400, {
        error: 'Missing required fields',
        details: { user_id: !!user_id, job_description: !!job_description, num_projects },
      });
    }

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      console.error(`[${requestId}] Missing Authorization header`);
      return sendJsonResponse(401, { error: 'Unauthorized: Missing Authorization header' });
    }

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      console.error(`[${requestId}] Invalid Authorization header format`);
      return sendJsonResponse(401, { error: 'Unauthorized: Invalid Authorization header format' });
    }

    const token = authHeader.substring(7);
    console.log(`[${requestId}] Token extracted, length: ${token.length}`);

    console.log(`[${requestId}] Initializing Supabase clients`);
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log(`[${requestId}] Environment variables check:`, {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
      serviceKeyValue: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'MISSING',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Missing Supabase environment variables!`);
      console.error(`[${requestId}] Available env keys:`, Object.keys(process.env).filter(k => k.includes('SUPABASE')));
      return sendJsonResponse(500, { error: 'Server configuration error: Supabase environment variables not configured' });
    }

    // Use service role client (can verify tokens and bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and get user (service role can verify any user's token)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      console.error(`[${requestId}] Invalid or expired token:`, authError);
      return sendJsonResponse(401, { error: 'Unauthorized: Invalid or expired token' });
    }

    // Use the authenticated user's ID (same as frontend does)
    const authenticatedUserId = authUser.id;
    console.log(`[${requestId}] Authenticated user_id from token:`, authenticatedUserId);
    
    // Verify the user_id from request body matches the authenticated user (security check)
    if (user_id !== authenticatedUserId) {
      console.error(`[${requestId}] user_id mismatch: request body has ${user_id}, but token has ${authenticatedUserId}`);
      return sendJsonResponse(403, { error: 'Forbidden: user_id does not match authenticated user' });
    }

    // Query profile - use authenticatedUserId (from token, not request body)
    console.log(`[${requestId}] ========== PROFILE QUERY START ==========`);
    console.log(`[${requestId}] User IDs comparison:`, {
      fromToken: authenticatedUserId,
      fromRequestBody: user_id,
      match: user_id === authenticatedUserId,
      tokenType: typeof authenticatedUserId,
      bodyType: typeof user_id
    });
    
    // CRITICAL: Use authenticatedUserId (from token) - this is the source of truth
    const userIdToQuery = authenticatedUserId;
    console.log(`[${requestId}] Querying user_profiles with user_id:`, userIdToQuery);
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userIdToQuery)
      .maybeSingle();

    console.log(`[${requestId}] ========== PROFILE QUERY RESULT ==========`);
    if (profile) {
      console.log(`[${requestId}] ✓ Profile found:`, {
        profileId: profile.id,
        profileUserId: profile.user_id,
        name: profile.name,
        email: profile.email
      });
    } else {
      console.error(`[${requestId}] ✗ Profile NOT found`);
      console.error(`[${requestId}] Query details:`, {
        queriedUserId: userIdToQuery,
        error: profileError?.message || 'No error, just no data',
        errorCode: profileError?.code
      });
    }

    if (profileError) {
      console.error(`[${requestId}] Error fetching profile:`, profileError);
      return sendJsonResponse(500, { error: `Failed to fetch user profile: ${profileError.message}` });
    }

    if (!profile) {
      console.error(`[${requestId}] User profile not found for user_id:`, authenticatedUserId);
      // Debug: Try a direct query to see what's in the DB
      const { data: allProfiles } = await supabase
        .from('user_profiles')
        .select('id, user_id, name')
        .limit(10);
      console.error(`[${requestId}] Debug - Sample profiles in DB (first 10):`, JSON.stringify(allProfiles, null, 2));
      console.error(`[${requestId}] Debug - Looking for user_id:`, authenticatedUserId, `(type: ${typeof authenticatedUserId})`);
      console.error(`[${requestId}] Debug - Request body user_id:`, user_id, `(type: ${typeof user_id})`);
      
      // Try querying with the request body user_id as a fallback
      if (user_id !== authenticatedUserId) {
        console.error(`[${requestId}] Debug - IDs don't match, trying request body user_id...`);
        const { data: fallbackProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();
        console.error(`[${requestId}] Debug - Fallback query result:`, !!fallbackProfile);
      }
      
      return sendJsonResponse(404, { error: 'User profile not found. Please fill out your profile form first before generating a resume.' });
    }

    console.log(`[${requestId}] Profile fetched successfully`);

    const now = new Date();
    const resetDate = profile.generation_reset_date ? new Date(profile.generation_reset_date) : null;

    if (resetDate && now > resetDate) {
      await supabase
        .from('user_profiles')
        .update({
          generations_used: 0,
          generation_reset_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('user_id', user_id);

      profile.generations_used = 0;
    }

    if (profile.generations_used >= profile.generation_limit) {
      const resetDateStr = resetDate ? resetDate.toLocaleDateString() : 'unknown';
      return sendJsonResponse(429, {
        error: `You've used all ${profile.generation_limit} generations this month. Resets on ${resetDateStr}.`,
      });
    }

    console.log(`[${requestId}] Fetching education entries`);
    const { data: educationEntries, error: educationError } = await supabase
      .from('education_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('display_order', { ascending: true });

    if (educationError) {
      console.error(`[${requestId}] Error fetching education entries:`, educationError);
      return sendJsonResponse(500, { error: `Failed to fetch education entries: ${educationError.message}` });
    }
    console.log(`[${requestId}] Education entries fetched:`, educationEntries?.length || 0);

    console.log(`[${requestId}] Fetching work experience entries`);
    const { data: workEntries, error: workError } = await supabase
      .from('work_experience_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('display_order', { ascending: true });

    if (workError) {
      console.error(`[${requestId}] Error fetching work experience entries:`, workError);
      return sendJsonResponse(500, { error: `Failed to fetch work experience entries: ${workError.message}` });
    }
    console.log(`[${requestId}] Work experience entries fetched:`, workEntries?.length || 0);

    console.log(`[${requestId}] Fetching GitHub installation`);
    const { data: installations, error: installationError } = await supabase
      .from('github_installations')
      .select('*')
      .eq('user_id', user_id);

    if (installationError || !installations || installations.length === 0) {
      console.error(`[${requestId}] Error fetching GitHub installation or installation not found:`, installationError);
      return sendJsonResponse(404, { error: 'GitHub installation not found' });
    }

    const installation = installations[0];
    if (!installation.access_token) {
      console.error(`[${requestId}] GitHub access token not found in installation`);
      return sendJsonResponse(500, { error: 'GitHub access token not found' });
    }
    console.log(`[${requestId}] GitHub installation fetched, access_type:`, installation.access_type);

    console.log(`[${requestId}] Fetching GitHub repositories, access_type:`, installation.access_type);
    let githubRepos: any[] = [];

    if (installation.access_type === 'all') {
      console.log(`[${requestId}] Fetching all repositories`);
      const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `Bearer ${installation.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!reposResponse.ok) {
        const errorText = await reposResponse.text().catch(() => 'Unable to read error response');
        console.error(`[${requestId}] GitHub API error:`, {
          status: reposResponse.status,
          statusText: reposResponse.statusText,
          errorText: errorText.substring(0, 500),
        });
        return sendJsonResponse(500, { error: `Failed to fetch GitHub repositories: ${reposResponse.status} - ${reposResponse.statusText}` });
      }

      const repos = await reposResponse.json();
      console.log(`[${requestId}] Fetched ${repos.length} repositories from GitHub`);

      for (const repo of repos) {
        try {
          const [languagesResponse, readmeResponse] = await Promise.all([
            fetch(`https://api.github.com/repos/${repo.full_name}/languages`, {
              headers: {
                'Authorization': `Bearer ${installation.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }),
            fetch(`https://api.github.com/repos/${repo.full_name}/readme`, {
              headers: {
                'Authorization': `Bearer ${installation.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }).catch(() => null),
          ]);

          const languages = languagesResponse.ok ? await languagesResponse.json() : {};
          let readme = '';

          if (readmeResponse && readmeResponse.ok) {
            const readmeData = await readmeResponse.json();
            readme = Buffer.from(readmeData.content.replace(/\n/g, ''), 'base64').toString('utf-8');
          }

          githubRepos.push({
            id: repo.id.toString(),
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || '',
            url: repo.html_url,
            languages,
            readme,
          });
        } catch (error) {
          console.error(`[${requestId}] Error fetching details for repo ${repo.full_name}:`, error);
        }
      }
    } else if (installation.access_type === 'selected' && installation.selected_repo_ids) {
      console.log(`[${requestId}] Fetching selected repositories, count:`, installation.selected_repo_ids?.length || 0);
      for (const repoId of installation.selected_repo_ids) {
        try {
          const repoResponse = await fetch(`https://api.github.com/repositories/${repoId}`, {
            headers: {
              'Authorization': `Bearer ${installation.access_token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });

          if (!repoResponse.ok) {
            const errorText = await repoResponse.text().catch(() => 'Unable to read error response');
            console.error(`[${requestId}] Failed to fetch repo ${repoId}:`, {
              status: repoResponse.status,
              statusText: repoResponse.statusText,
              errorText: errorText.substring(0, 500),
            });
            continue;
          }

          const repo = await repoResponse.json();

          const [languagesResponse, readmeResponse] = await Promise.all([
            fetch(`https://api.github.com/repos/${repo.full_name}/languages`, {
              headers: {
                'Authorization': `Bearer ${installation.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }),
            fetch(`https://api.github.com/repos/${repo.full_name}/readme`, {
              headers: {
                'Authorization': `Bearer ${installation.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }).catch(() => null),
          ]);

          const languages = languagesResponse.ok ? await languagesResponse.json() : {};
          let readme = '';

          if (readmeResponse && readmeResponse.ok) {
            const readmeData = await readmeResponse.json();
            readme = Buffer.from(readmeData.content.replace(/\n/g, ''), 'base64').toString('utf-8');
          }

          githubRepos.push({
            id: repo.id.toString(),
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || '',
            url: repo.html_url,
            languages,
            readme,
          });
        } catch (error) {
          console.error(`[${requestId}] Error fetching repo ${repoId}:`, error);
        }
      }
    }

    console.log(`[${requestId}] GitHub repos fetched:`, githubRepos.length);
    if (githubRepos.length === 0) {
      console.error(`[${requestId}] No GitHub repositories found`);
      return sendJsonResponse(500, { error: 'No GitHub repositories found' });
    }

    console.log(`[${requestId}] Constructing OpenAI prompt`);
    const openaiPrompt = `
You are a professional resume writer for CS new graduates. Generate resumes and cover letters in ATS-friendly format optimized for junior developer roles.

Job Description:
${job_description}

User Profile:
- Name: ${profile.name}
- Location: ${profile.location || 'Not provided'}
- Email: ${profile.email}
- Education: ${JSON.stringify(educationEntries)}
- Work Experience: ${JSON.stringify(workEntries)}

GitHub Repositories:
${JSON.stringify(githubRepos)}

## RESUME FORMATTING REQUIREMENTS:

**Header Format:**
[Full Name]
[City, State] | [Phone] | [Email] | LinkedIn | GitHub | Portfolio

**EDUCATION Section:**
[University Name] [City, State]
[Degree] in [Major], [Minor if applicable] [Expected Graduation Date]
● GPA: [X.XX] | Dean's Honors List (if applicable)
● Relevant Coursework: [List 6-8 courses relevant to job]

**PROJECTS Section (List 2-3 strongest projects):**
[Project Name] [Project Type/Context]
[Timeframe or "Personal Project"]
● [Opening sentence: what problem does this solve? What tech?]
● [Technical implementation: backend, architecture, libraries used]
● [Results: metrics, deployment, impact if applicable]

**Key rules for PROJECTS:**
- Use the XYZ Method for every bullet: [Action verb] [X: what you built/did] [Y: how it worked] [Z: quantifiable metric/impact]
- Start each bullet with strong action verb (Engineered, Built, Developed, Implemented, Architected, Deployed, Optimized, Automated)
- **CRITICAL: ONLY include metrics that are explicitly mentioned in the project description, README, or can be directly inferred from the code. DO NOT invent or hallucinate metrics like user counts, traffic numbers, or performance improvements unless they are actually documented. If no metrics are available, focus on technical implementation details instead.**
- Include specific technologies (FastAPI, React, PostgreSQL, etc.)
- Mention deployment if relevant (Docker, Vercel, Render, AWS)
- 3 bullets per project maximum

**SKILLS Section:**
Organize by category:
Languages: [Python, JavaScript, Java, etc.]
Frontend: [React, TypeScript, Vue, etc.] | Backend: [FastAPI, Node.js, Django, etc.]
Databases: [PostgreSQL, MongoDB, etc.] | ML/Data Science: [scikit-learn, TensorFlow, etc.]
DevOps: [Docker, Git, Vercel, AWS, etc.]

**General Resume Rules:**
- ATS-friendly — Plain text, no colors, graphics, or fancy formatting
- **CRITICAL: Resume MUST be exactly ONE PAGE maximum — no exceptions. If content is too long, prioritize most relevant information and be concise.**
- Scannable — Use bullet points, clear sections, organized layout
- No objective statement — Skip "Seeking a role..."
- No soft skills — Focus on technical skills and what you built
- Specific > Vague — "Trained ML models with 80% accuracy" not "Strong ML skills"
- No location repetition (only in header)
- **IMPORTANT: Keep descriptions concise. Limit to 2-3 bullet points per work experience entry and 3 bullet points per project to ensure one-page limit.**

## COVER LETTER FORMATTING REQUIREMENTS:

**IMPORTANT: DO NOT include header (name, location, phone, email, date) in your output. The template will add these automatically.**

**Opening Paragraph:**
Dear hiring manager,

I am writing to apply for the [Job Title] position on the [Team Name]. [1-2 sentences: Show you understand the company's mission/problem + connect it to your passion]. As a [Degree] student at [University] graduating in [Month Year], I am eager to contribute [your relevant expertise] to [what you'll help the company achieve].

**Body Paragraph 1 - Relevant Experience:**
I have demonstrated the ability to [core skill relevant to job]. I [action verb] [X: what you built], [Y: how it worked], achieving [Z: quantifiable metric]. I also [action verb] [X: second project], [Y: implementation details], resulting in [Z: measurable impact]. My experience with [list relevant technologies/skills] demonstrates my ability to [contribute to their team/solve their problems].

**Key elements:**
- Use the XYZ Method: [Action] [X: what you did] [Y: how it worked] [Z: metric/impact]
- Use strong action verbs (Engineered, Built, Developed, Architected, Implemented, Deployed)
- **CRITICAL: ONLY include metrics that are explicitly mentioned in the project description, README, or can be directly inferred from the code. DO NOT invent or hallucinate metrics like user counts, traffic numbers, or performance improvements unless they are actually documented. If no metrics are available, focus on technical implementation details instead.**
- Use 2-3 concrete project examples
- Include specific tech stack
- End by connecting back to the job

**Body Paragraph 2 - Culture Fit & Growth (MUST end with closing sentences):**
I thrive in [type of environment you want]. My proficiency in [key technologies], combined with my demonstrated ability to [learning ability/initiative], positions me to [master what you'll learn on the job + contribute]. I am eager to [growth aspirations specific to the role] and help [how you'll contribute to company goals]. Please email me at [email] for any inquiries you may have about my qualifications. Thank you for reading my application.

**IMPORTANT: DO NOT include "Sincerely," or the name at the end. The template will add these automatically.**

**Cover Letter Writing Rules:**
- **CRITICAL: Must be at least 3-4 body paragraphs (opening + 3-4 body paragraphs = minimum 4-5 total paragraphs)**
- **CRITICAL: Length must be approximately 500-600 words to fill ONE FULL PAGE (not half a page). The cover letter must be comprehensive and detailed.**
- Each paragraph should be 4-6 sentences to ensure adequate length
- Expand on technical details, project impact, and how your skills relate to the job
- Tone: Professional but personable, not robotic
- Specificity: Tailor to job posting (mention company name, specific team, specific technologies)
- Show, don't tell: Use project examples instead of "I'm a hard worker"
- Connection: Show you understand what the company does and why you care
- No clichés: Avoid "I'm passionate about coding" — show it through examples
- No em dashes — Use commas or restructure sentences instead
- **CRITICAL: The final paragraph MUST end with these exact closing sentences (no separate paragraph): "Please email me at [email] for any inquiries you may have about my qualifications. Thank you for reading my application."**
- Do NOT include header info (name, contact, date) or closing signature - template adds these
- **CRITICAL: Keep total length approximately 500-600 words to ensure it fills ONE FULL PAGE (not half a page). Be comprehensive and detailed.**
- **CRITICAL FORMATTING: Separate each paragraph with exactly TWO newline characters (\\n\\n). Each paragraph must be on its own line with a blank line between paragraphs for proper rendering.**

## YOUR TASKS:

1. Select the top ${num_projects} most relevant projects from the repos based on the job description
2. Extract all programming languages, frameworks, and tools from the repos and organize into: languages, frontend, backend, databases, ML/Data Science, DevOps
3. For each selected project, generate 3 bullet points using the XYZ Method with metrics
4. **CRITICAL: Ensure the entire resume fits on exactly ONE PAGE. Be selective and concise with all content.**
5. Generate a professional cover letter with EXACTLY 3-4 body paragraphs (minimum 3, maximum 4), ~500-600 words total, ensuring it fills ONE FULL PAGE (not half a page). Be comprehensive and detailed in each paragraph.

Return JSON in this exact format:
{
  "selected_projects": [
    {
      "id": "string",
      "name": "string",
      "type": "string (e.g., Personal Project, Academic Project)",
      "timeframe": "string (e.g., Personal Project, or date range)",
      "description": "string (3 bullet points, newline separated, each using XYZ Method with metrics)",
      "technologies": ["string"],
      "url": "string (optional)"
    }
  ],
  "extracted_skills": {
    "languages": ["string"],
    "frameworks": ["string"],
    "frontend": ["string"],
    "backend": ["string"],
    "databases": ["string"],
    "ml_data_science": ["string"],
    "devops": ["string"],
    "tools": ["string"]
  },
  "cover_letter": "string (MUST be 3-4 body paragraphs, 300-400 words MAX to fit on one page. Do NOT include header with name/contact/date, do NOT include 'Sincerely' or signature. Start with 'Dear hiring manager,' and the FINAL paragraph MUST end with 'Please email me at [email] for any inquiries you may have about my qualifications. Thank you for reading my application.' - these closing sentences should be part of the last paragraph, NOT a separate paragraph. CRITICAL: Use exactly TWO newline characters (\\n\\n) between each paragraph to ensure proper paragraph separation. Each paragraph should be on its own line with a blank line between them.)"
}
`;

    console.log(`[${requestId}] Calling OpenAI API`);
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error(`[${requestId}] OPENAI_API_KEY not configured`);
      return sendJsonResponse(500, { error: 'Server configuration error: OPENAI_API_KEY not configured' });
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: openaiPrompt }],
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      console.error(`[${requestId}] OpenAI API error, status:`, openaiResponse.status);
      const errorText = await openaiResponse.text().catch(() => 'Unable to read error response');
      console.error(`[${requestId}] OpenAI API error response:`, errorText.substring(0, 1000));
      try {
        const errorData = JSON.parse(errorText);
        return sendJsonResponse(500, { error: `OpenAI API error: ${errorData.error?.message || errorData.message || 'Unknown error'}` });
      } catch (parseErr) {
        return sendJsonResponse(500, { error: `OpenAI API error: ${openaiResponse.status} - ${errorText.substring(0, 200)}` });
      }
    }

    console.log(`[${requestId}] OpenAI API response received`);
    const openaiData = await openaiResponse.json();
    const aiContent = openaiData.choices[0]?.message?.content;

    if (!aiContent) {
      console.error(`[${requestId}] No content in OpenAI response`);
      return sendJsonResponse(500, { error: 'No content from OpenAI' });
    }
    console.log(`[${requestId}] OpenAI content received, length:`, aiContent.length);

    console.log(`[${requestId}] Parsing AI response JSON`);
    let aiResponse;
    try {
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || aiContent.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      aiResponse = JSON.parse(jsonString);
      console.log(`[${requestId}] AI response parsed successfully`);
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse AI response:`, parseError);
      console.error(`[${requestId}] AI content (first 1000 chars):`, aiContent.substring(0, 1000));
      return sendJsonResponse(500, { error: `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}` });
    }

    console.log(`[${requestId}] Generating HTML templates`);
    try {
      const resumeHtml = generateResumeHTML(profile, educationEntries || [], workEntries || [], aiResponse.selected_projects, aiResponse.extracted_skills, font_size);
      const coverLetterHtml = generateCoverLetterHTML(profile, aiResponse.cover_letter, profile.signature_url, font_size);

      console.log(`[${requestId}] Incrementing generation counter`);
      await supabase
        .from('user_profiles')
        .update({
          generations_used: profile.generations_used + 1,
        })
        .eq('user_id', user_id);

      console.log(`[${requestId}] Returning successful response`);
      console.log(`[${requestId}] ========== VERCEL FUNCTION SUCCESS ==========`);

      return sendJsonResponse(200, {
        resume_html: resumeHtml,
        cover_letter_html: coverLetterHtml,
        selected_projects: aiResponse.selected_projects,
        extracted_skills: aiResponse.extracted_skills,
      });
    } catch (htmlError) {
      console.error(`[${requestId}] Error generating HTML:`, htmlError);
      return sendJsonResponse(500, { error: `Failed to generate HTML: ${htmlError instanceof Error ? htmlError.message : String(htmlError)}` });
    }
  } catch (error) {
    console.error(`[${requestId}] ========== ERROR CAUGHT ==========`);
    console.error(`[${requestId}] Error type:`, error?.constructor?.name || typeof error);
    console.error(`[${requestId}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId}] ========== END ERROR ==========`);

    return sendJsonResponse(500, {
      error: errorMessage || 'Internal server error',
      requestId: requestId,
    });
  }
}
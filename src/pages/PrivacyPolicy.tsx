import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to="/">
            <Button variant="secondary" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to RepoResume.ai ("we," "our," or "us"). We are committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
                you use our web application that generates resumes and cover letters from your GitHub repositories.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                When you use RepoResume.ai, we collect the following personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>LinkedIn profile URL (optional)</li>
                <li>Portfolio URL (optional)</li>
                <li>Location (optional)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Education and Work Experience</h3>
              <p className="text-gray-700 leading-relaxed">
                We collect information about your education history, including university names, degrees, majors, 
                graduation dates, GPA, and relevant coursework. We also collect information about your work experience, 
                including job titles, companies, dates of employment, and job descriptions.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.3 GitHub Data</h3>
              <p className="text-gray-700 leading-relaxed">
                Through GitHub OAuth authentication, we access your GitHub repositories, including repository names, 
                descriptions, and code content. We use this information to analyze your projects and generate 
                relevant resume content.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.4 Signature Images</h3>
              <p className="text-gray-700 leading-relaxed">
                If you choose to upload a signature image, we store it securely in our storage system.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.5 Usage Data</h3>
              <p className="text-gray-700 leading-relaxed">
                We track the number of resume and cover letter generations you have used, with a limit of 10 free 
                generations per month that automatically resets.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We use the collected information to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Generate personalized resumes and cover letters tailored to job descriptions</li>
                <li>Analyze your GitHub repositories to select relevant projects</li>
                <li>Store your profile information for future resume generations</li>
                <li>Track your generation usage and enforce monthly limits</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Improve our services and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Storage and Security</h2>
              <p className="text-gray-700 leading-relaxed">
                Your data is stored securely in Supabase, a cloud database platform. We implement appropriate 
                technical and organizational measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. However, no method of transmission over the Internet or 
                electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use the following third-party services that may have access to your information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Supabase:</strong> Database and authentication services. Their privacy policy applies to data stored in their systems.</li>
                <li><strong>OpenAI:</strong> We use OpenAI's GPT-4o API to generate resume and cover letter content. Your profile information and job descriptions are sent to OpenAI for processing.</li>
                <li><strong>GitHub:</strong> We access your GitHub repositories through GitHub's OAuth API to analyze your projects.</li>
                <li><strong>Vercel:</strong> Our hosting provider. They may have access to server logs and deployment information.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-3">You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Access:</strong> You can access your personal information through your account settings</li>
                <li><strong>Update:</strong> You can update your personal information at any time through the form page</li>
                <li><strong>Delete:</strong> You can delete your account and all associated data at any time through the settings page</li>
                <li><strong>Export:</strong> You can download your generated resumes and cover letters in PDF format</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide you 
                services. If you delete your account, we will delete all your personal information, including profile 
                data, education entries, work experience, and signature images, in accordance with our data deletion 
                procedures.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for users under the age of 13. We do not knowingly collect personal 
                information from children under 13. If you are a parent or guardian and believe your child has 
                provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review 
                this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Email: jacobptnguyen@gmail.com</li>
                <li>GitHub: <a href="https://github.com/jacobptnguyen" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">jacobptnguyen</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};


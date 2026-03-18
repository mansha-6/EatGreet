import { Link } from 'react-router-dom';
import LegalLayout from '../../components/legal/LegalLayout';

const sections = [
    {
        title: '1. Acceptance of Terms',
        content: `By accessing and using EatGreet ("the Platform"), you confirm that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, you may not use the Platform. These terms apply to all users including restaurant administrators, kitchen staff, and customers.`
    },
    {
        title: '2. Description of Service',
        content: `EatGreet provides a SaaS-based restaurant management ecosystem that includes digital menu management, kitchen synchronization, order tracking, table management, analytics, and more. Access is provided on a subscription basis selected during registration.`
    },
    {
        title: '3. Account Registration',
        content: `You must provide accurate, current, and complete information during the registration process. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Passwords must be 8–15 characters and include uppercase, lowercase, numbers, and symbols.`
    },
    {
        title: '4. Subscription and Billing',
        content: `EatGreet offers Monthly, Annual, and Custom plans. All subscriptions are billed in advance. Failure to pay may result in suspension or termination of your account. Pricing is subject to change with 30 days' written notice.`
    },
    {
        title: '5. Acceptable Use',
        content: `You agree not to misuse the Platform, including but not limited to: uploading malicious content, attempting unauthorized access, using the service to violate any law or regulation, or reselling access without prior written consent from EatGreet.`
    },
    {
        title: '6. Intellectual Property',
        content: `All content, features, and functionality of EatGreet — including but not limited to software, text, graphics, logos, and icons — are owned by EatGreet Technologies and are protected by applicable intellectual property laws.`
    },
    {
        title: '7. Data and Privacy',
        content: `Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. We process your data in accordance with applicable data protection laws.`
    },
    {
        title: '8. Limitation of Liability',
        content: `EatGreet shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your use of or inability to use the Platform.`
    },
    {
        title: '9. Termination',
        content: `We may terminate or suspend your account and access to the Platform at our sole discretion, without notice, for conduct that violates these Terms or is harmful to other users, us, or third parties.`
    },
    {
        title: '10. Governing Law',
        content: `These Terms shall be governed and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in [Your City], India.`
    },
    {
        title: '11. Changes to Terms',
        content: `EatGreet reserves the right to modify these Terms at any time. We will notify users of material changes via email or a prominent notice on the Platform. Continued use after changes constitutes acceptance of the updated Terms.`
    },
    {
        title: '12. Contact',
        content: `If you have any questions about these Terms, please contact us at legal@eatgreet.com or via our Contact Us page.`
    }
];

export default function TermsAndConditions() {
    return (
        <LegalLayout
            title="Terms & Conditions"
            subtitle="Please read these terms carefully before using EatGreet."
            lastUpdated="March 2026"
        >
            {sections.map((s, i) => (
                <div key={i} className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">{s.title}</h2>
                    <p className="text-gray-500 leading-relaxed text-[15px]">{s.content}</p>
                </div>
            ))}
        </LegalLayout>
    );
}

import LegalLayout from '../../components/legal/LegalLayout';

const sections = [
    {
        title: '1. Information We Collect',
        content: `We collect information you provide directly to us when you create an account, use the Platform, or contact support. This includes: name, email, phone number, restaurant details, billing information, and usage data such as orders, menu configurations, and login activity.`
    },
    {
        title: '2. How We Use Your Information',
        content: `We use the information collected to: provide and improve the Platform, process payments, send transactional emails and notifications, ensure security of accounts, comply with legal obligations, and respond to support requests.`
    },
    {
        title: '3. Data Sharing',
        content: `We do not sell, trade, or rent your personal information to third parties. We may share data with trusted vendors who assist in operating the Platform (e.g., payment gateways, email services), subject to strict confidentiality agreements.`
    },
    {
        title: '4. Cookies and Tracking',
        content: `EatGreet uses cookies and similar tracking technologies to enhance user experience, analyze usage patterns, and deliver relevant content. You can control cookie preferences through your browser settings.`
    },
    {
        title: '5. Data Security',
        content: `We implement industry-standard security measures including SSL encryption, hashed passwords (bcrypt), and access control to protect your data. However, no method of transmission over the internet is 100% secure.`
    },
    {
        title: '6. Data Retention',
        content: `We retain your personal data as long as your account is active or as needed to provide services. You may request deletion of your data by contacting us; however, some information may be retained to comply with legal obligations.`
    },
    {
        title: '7. Your Rights',
        content: `Depending on your location, you may have rights to access, correct, delete, or restrict use of your personal data. To exercise these rights, contact us at privacy@eatgreet.com.`
    },
    {
        title: '8. Third-Party Links',
        content: `The Platform may contain links to third-party websites. EatGreet is not responsible for the privacy practices or content of those sites. We encourage you to review the privacy policies of any third-party sites you visit.`
    },
    {
        title: '9. Children\'s Privacy',
        content: `EatGreet is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.`
    },
    {
        title: '10. Changes to This Policy',
        content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last Updated" date. Continued use of the Platform constitutes your acceptance.`
    },
    {
        title: '11. Contact Us',
        content: `For privacy-related inquiries, please contact: privacy@eatgreet.com or write to EatGreet Technologies, [Address].`
    }
];

export default function PrivacyPolicy() {
    return (
        <LegalLayout
            title="Privacy Policy"
            subtitle="Your privacy matters to us. Here's how we handle your data."
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

import LegalLayout from '../../components/legal/LegalLayout';

const sections = [
    {
        title: '1. Nature of Delivery',
        content: `EatGreet is a Software-as-a-Service (SaaS) platform. All products and services are delivered digitally. There are no physical goods shipped. Upon successful payment, access to the Platform is granted immediately or within 24 hours.`
    },
    {
        title: '2. Account Activation',
        content: `Once your subscription payment is confirmed, you will receive an onboarding email with setup instructions. If you do not receive this email within 1 hour of payment, please check your spam folder or contact support@eatgreet.com.`
    },
    {
        title: '3. Subscription Delivery Timeline',
        content: `Monthly and Annual plans are activated instantly upon payment verification. Custom enterprise plans may require additional configuration time, which will be communicated to you in advance by our team.`
    },
    {
        title: '4. Setup and Onboarding',
        content: `After activation, you will be guided through an onboarding wizard to set up your restaurant profile, menu, tables, and kitchen sync. Premium plan subscribers also receive priority onboarding assistance.`
    },
    {
        title: '5. Technical Issues',
        content: `If you experience issues accessing the Platform after payment, contact our support team immediately at support@eatgreet.com. We commit to resolving access issues within 24–48 business hours.`
    },
    {
        title: '6. Contact',
        content: `For questions about service delivery, contact us at: support@eatgreet.com`
    }
];

export default function ShippingPolicy() {
    return (
        <LegalLayout
            title="Shipping Policy"
            subtitle="EatGreet is a digital platform — here's how delivery works."
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

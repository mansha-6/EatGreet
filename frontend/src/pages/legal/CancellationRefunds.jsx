import LegalLayout from '../../components/legal/LegalLayout';

const sections = [
    {
        title: '1. Cancellation Policy',
        content: `You may cancel your EatGreet subscription at any time from your account settings. Cancellations take effect at the end of the current billing period. You will continue to have full access to the Platform until your subscription expires.`
    },
    {
        title: '2. Monthly Subscriptions',
        content: `For monthly plans, you must cancel at least 3 days before your next billing date to avoid being charged for the following month. No partial refunds are provided for unused days within a billing period.`
    },
    {
        title: '3. Annual Subscriptions',
        content: `Annual subscriptions may be cancelled within 7 days of payment for a full refund (minus a 5% processing fee). After 7 days, no refunds are issued for annual plans. However, you will retain access until the end of the subscription year.`
    },
    {
        title: '4. Refund Eligibility',
        content: `Refunds are considered under the following conditions: (a) duplicate payment by mistake, (b) technical issue preventing access to the Platform for more than 48 hours, (c) billing error by EatGreet. Refunds are not issued for change of mind after the refund window.`
    },
    {
        title: '5. How to Request a Refund',
        content: `To request a refund, email billing@eatgreet.com with your registered email, transaction ID, and reason for refund. Requests are processed within 7–10 business days. Approved refunds are credited to the original payment method.`
    },
    {
        title: '6. Custom / Enterprise Plans',
        content: `Cancellation and refund terms for custom and enterprise plans are governed by the individual agreement signed at the time of onboarding. Please refer to your signed agreement or contact your account manager.`
    },
    {
        title: '7. Free Trial (if applicable)',
        content: `If your subscription began with a free trial, you may cancel at any time before the trial ends without being charged. After the trial period, standard subscription billing begins.`
    },
    {
        title: '8. Contact',
        content: `For cancellation and refund queries, contact: billing@eatgreet.com or use our live support chat available on the dashboard.`
    }
];

export default function CancellationRefunds() {
    return (
        <LegalLayout
            title="Cancellation & Refunds"
            subtitle="Understand how cancellations and refunds work on EatGreet."
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

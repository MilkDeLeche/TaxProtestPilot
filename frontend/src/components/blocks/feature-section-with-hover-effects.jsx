import { cn } from '@/lib/utils';
import {
  ShieldCheckIcon,
  UserCircleIcon,
  DocumentMagnifyingGlassIcon,
  LockClosedIcon,
  NoSymbolIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const privacyFeatures = [
  {
    id: 'overview',
    title: 'Overview',
    description: 'Tax Protest Pilot ("we", "our") respects your privacy. This policy describes what information we collect, how we use it, and your choices. We do not sell your personal information to third parties.',
    icon: ShieldCheckIcon,
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    description: 'We collect information you provide directly: account details (email, name), data you upload (property and client information), settings, and support messages. We also collect usage data, device info, and log data.',
    icon: UserCircleIcon,
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    description: 'We use your information to provide and improve the Service, process your data, authenticate you, send service-related communications, and comply with legal obligations. We do not use your data for advertising profiling.',
    icon: DocumentMagnifyingGlassIcon,
  },
  {
    id: 'no-selling',
    title: 'We Do Not Sell Your Information',
    description: 'We do not sell, rent, or trade your personal information or uploaded data to third parties. Your data is used only as described in this policy.',
    icon: NoSymbolIcon,
  },
  {
    id: 'sharing',
    title: 'Sharing and Disclosure',
    description: 'We may share information only: (1) with service providers under confidentiality; (2) if required by law; (3) in connection with a merger or acquisition; (4) with your consent. We do not share for third-party marketing.',
    icon: LockClosedIcon,
  },
  {
    id: 'retention',
    title: 'Data Retention',
    description: 'We retain your account and data for as long as your account is active. You may request deletion; we will delete or anonymize in accordance with our retention schedule and legal obligations.',
    icon: DocumentMagnifyingGlassIcon,
  },
  {
    id: 'security',
    title: 'Security',
    description: 'We use industry-standard measures: encryption in transit and at rest, access controls, and secure infrastructure. We encourage strong passwords and careful handling of your account.',
    icon: LockClosedIcon,
  },
  {
    id: 'cookies',
    title: 'Cookies and Similar Technologies',
    description: 'We use cookies for session management, preferences, and analytics. You can control cookies through your browser; disabling some may affect functionality.',
    icon: DocumentMagnifyingGlassIcon,
  },
  {
    id: 'rights',
    title: 'Your Rights',
    description: 'You may have the right to access, correct, or delete your data; port your data; object to or restrict processing. Contact us via the Support page to exercise these rights.',
    icon: UserCircleIcon,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    description: 'For privacy-related questions or to exercise your rights, contact us via the Support page. We will respond in accordance with applicable law.',
    icon: EnvelopeIcon,
  },
];

export function PrivacyFeaturesSectionWithHoverEffects() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
      {privacyFeatures.map((feature, index) => (
        <PrivacyFeatureCard key={feature.id} {...feature} index={index} />
      ))}
    </div>
  );
}

function PrivacyFeatureCard({ title, description, icon: Icon, index }) {
  return (
    <div
      className={cn(
        'flex flex-col lg:border-r py-10 relative group/feature border-white/10',
        (index === 0 || index === 4 || index === 8) && 'lg:border-l border-white/10',
        'lg:border-b border-white/10'
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-blue-300/80">
        <Icon className="w-8 h-8" />
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-white/20 group-hover/feature:bg-blue-400 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-white">
          {title}
        </span>
      </div>
      <p className="text-sm text-gray-400 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
}

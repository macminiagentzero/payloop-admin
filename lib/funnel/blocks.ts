// Block definitions for the checkout editor
// These define what blocks are available and their default properties

export interface BlockDefinition {
  type: string;
  name: string;
  category: 'content' | 'payment' | 'trust' | 'custom';
  description: string;
  isRequired: boolean;
  icon: string;
  defaultProps: Record<string, unknown>;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // Content Blocks
  {
    type: 'logo',
    name: 'Logo',
    category: 'content',
    description: 'Your store logo',
    isRequired: false,
    icon: 'Image',
    defaultProps: {
      logoUrl: '',
      logoText: 'PayLoop',
      logoSize: 32,
    },
  },
  {
    type: 'hero',
    name: 'Hero Section',
    category: 'content',
    description: 'Title and subtitle at the top',
    isRequired: false,
    icon: 'Type',
    defaultProps: {
      title: 'Complete Your Order',
      subtitle: 'Secure checkout powered by PayLoop',
      alignment: 'center',
    },
  },
  {
    type: 'order-summary',
    name: 'Order Summary',
    category: 'content',
    description: 'Shows cart items and totals',
    isRequired: false,
    icon: 'ShoppingCart',
    defaultProps: {
      showDiscount: true,
      showSubtotal: true,
      showShipping: true,
    },
  },
  {
    type: 'coupon',
    name: 'Coupon Field',
    category: 'content',
    description: 'Discount code input',
    isRequired: false,
    icon: 'Tag',
    defaultProps: {
      placeholder: 'Discount code',
      buttonText: 'Apply',
    },
  },
  {
    type: 'custom-html',
    name: 'Custom HTML',
    category: 'custom',
    description: 'Add custom HTML content',
    isRequired: false,
    icon: 'Code',
    defaultProps: {
      html: '',
    },
  },

  // Payment Blocks (Protected)
  {
    type: 'payment-form',
    name: 'Payment Form',
    category: 'payment',
    description: 'Card input and payment button',
    isRequired: true, // Cannot be deleted
    icon: 'CreditCard',
    defaultProps: {
      buttonText: 'Pay {amount}',
      showCardIcons: true,
    },
  },
  {
    type: '3ds-challenge',
    name: '3DS Challenge',
    category: 'payment',
    description: '3D Secure verification modal',
    isRequired: true, // Auto-injected after payment
    icon: 'Shield',
    defaultProps: {
      // 3DS is automatic, no editable props
    },
  },

  // Trust Blocks
  {
    type: 'trust-badges',
    name: 'Trust Badges',
    category: 'trust',
    description: 'Security and payment icons',
    isRequired: false,
    icon: 'ShieldCheck',
    defaultProps: {
      badges: ['visa', 'mastercard', 'amex', 'ssl'],
      showSecureText: true,
    },
  },
  {
    type: 'footer',
    name: 'Footer',
    category: 'trust',
    description: 'Copyright and links',
    isRequired: false,
    icon: 'LayoutGrid',
    defaultProps: {
      text: '© 2026 Your Store. All rights reserved.',
      links: [
        { text: 'Privacy Policy', url: '/privacy' },
        { text: 'Terms', url: '/terms' },
        { text: 'Contact', url: '/contact' },
      ],
    },
  },

  // Subscription Block
  {
    type: 'subscription-products',
    name: 'Subscription Products',
    category: 'content',
    description: 'Shows available subscription add-ons',
    isRequired: false,
    icon: 'Repeat',
    defaultProps: {
      title: 'Add to your order',
      showDescription: true,
    },
  },
];

// Get blocks by category
export const getBlocksByCategory = (category: BlockDefinition['category']) =>
  BLOCK_DEFINITIONS.filter((b) => b.category === category);

// Get required blocks
export const REQUIRED_BLOCKS = BLOCK_DEFINITIONS.filter((b) => b.isRequired);

// Default block order for new funnels
export const DEFAULT_BLOCK_ORDER = [
  'logo',
  'hero',
  'order-summary',
  'coupon',
  'payment-form',
  'subscription-products',
  'trust-badges',
  'footer',
];

// Default styles for new funnels
export const DEFAULT_STYLES = {
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  backgroundColor: '#fafafa',
  cardBackgroundColor: '#ffffff',
  textColor: '#1f2937',
  textSecondaryColor: '#6b7280',
  borderColor: '#e5e7eb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  buttonRadius: '8px',
  cardRadius: '12px',
};

// Default content for new funnels
export const DEFAULT_CONTENT = {
  logoUrl: '',
  logoText: 'PayLoop',
  title: 'Complete Your Order',
  subtitle: 'Secure checkout powered by PayLoop',
  footerText: '© 2026 Your Store. All rights reserved.',
};
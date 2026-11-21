export interface LegalSection {
    heading: string;
    body: string;
  }
  
  export interface LegalPageData {
    slug: string;
    title: string;
    updatedAt: string;
    sections: LegalSection[];
  }
  
  export const LEGAL_PAGES: Record<string, LegalPageData> = {
    "about-us": {
      slug: "about-us",
      title: "About Us",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Who We Are",
          body: "Storefront is an Indian multi-vendor e-commerce marketplace connecting independent merchants directly with everyday shoppers. We focus on curated apparel, footwear, electronics, and lifestyle essentials.",
        },
        {
          heading: "Our Mission",
          body: "We aim to give independent sellers a fair, transparent platform to list their goods while giving customers fast checkout, verified sellers, and reliable doorstep delivery across India.",
        },
      ],
    },
    "privacy-policy": {
      slug: "privacy-policy",
      title: "Privacy Policy",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Information We Collect",
          body: "We collect your name, email address, shipping address, order history, and payment reference IDs strictly to process orders, prevent fraud, and provide customer support.",
        },
        {
          heading: "How We Use Your Data",
          body: "Your data is used to fulfill orders, share shipping updates, verify UPI/gateway payments, and comply with Indian tax and legal obligations. We never sell your personal information to third parties.",
        },
        {
          heading: "Data Security & Rights",
          body: "Passwords are encrypted using bcrypt and sessions use signed JWT tokens. You may request deletion or correction of your account data anytime by emailing our Grievance Officer.",
        },
      ],
    },
    "terms-and-conditions": {
      slug: "terms-and-conditions",
      title: "Terms & Conditions",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Marketplace Role",
          body: "Storefront operates as an online marketplace where registered merchants list and sell products. By placing an order, you agree to provide accurate delivery and payment details.",
        },
        {
          heading: "Pricing & Availability",
          body: "All prices are listed in Indian Rupees (INR) inclusive of applicable taxes unless stated otherwise. Stock is deducted atomically at checkout; in rare cases of stock discrepancies, orders will be cancelled and refunded in full.",
        },
        {
          heading: "Account Conduct",
          body: "Accounts found engaging in fraudulent transactions, fake UTR submissions, or policy violations may be restricted or suspended.",
        },
      ],
    },
    "shipping-policy": {
      slug: "shipping-policy",
      title: "Shipping & Delivery Policy",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Processing & Dispatch",
          body: "Orders are processed and dispatched by the respective merchant within 1–2 business days after payment verification or COD confirmation.",
        },
        {
          heading: "Delivery Timelines & Charges",
          body: "Standard delivery across India takes 3–7 business days depending on your pin code. Shipping is free on all orders above ₹999; orders below ₹999 carry a flat ₹79 shipping fee.",
        },
      ],
    },
    "return-policy": {
      slug: "return-policy",
      title: "Return Policy",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "7-Day Return Window",
          body: "You may request a return within 7 days of delivery if the item is unused, unwashed, and in its original packaging with all tags intact.",
        },
        {
          heading: "Non-Returnable Items",
          body: "Items damaged due to misuse, missing original packaging, or marked as Final Sale are not eligible for return unless received damaged or defective.",
        },
      ],
    },
    "refund-policy": {
      slug: "refund-policy",
      title: "Refund Policy",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Refund Timelines",
          body: "Once a returned item passes quality inspection, refunds are initiated within 2 business days. UPI and bank transfers reflect within 3–5 business days.",
        },
        {
          heading: "COD Order Refunds",
          body: "For Cash on Delivery orders, refunds are processed directly to your provided UPI ID or bank account after verification.",
        },
      ],
    },
    "cancellation-policy": {
      slug: "cancellation-policy",
      title: "Cancellation Policy",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Before Dispatch",
          body: "Orders can be cancelled for a 100% refund at any time before the merchant marks the order as 'Shipped'.",
        },
        {
          heading: "After Dispatch",
          body: "Once shipped, an order cannot be cancelled. You may refuse delivery or initiate a return under our Return Policy after receiving the package.",
        },
      ],
    },
    "exchange-policy": {
      slug: "exchange-policy",
      title: "Exchange Policy",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Size & Variant Exchanges",
          body: "Size or color exchanges are available within 7 days of delivery, subject to stock availability of the requested variant.",
        },
        {
          heading: "Defective Replacements",
          body: "If you receive a damaged or wrong item, we arrange a free reverse pickup and ship a replacement at no extra cost.",
        },
      ],
    },
    "cookie-policy": {
      slug: "cookie-policy",
      title: "Cookie Policy",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Essential Storage",
          body: "We use browser localStorage and essential cookies strictly to keep you logged in, remember items in your shopping cart, and display your recently viewed products.",
        },
        {
          heading: "Managing Preferences",
          body: "You can clear site data or disable cookies anytime from your browser settings, though disabling local storage may reset your cart and login session.",
        },
      ],
    },
    "warranty-policy": {
      slug: "warranty-policy",
      title: "Warranty Policy",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Electronics & Gear Warranty",
          body: "Eligible electronics and accessories carry a 6-month to 1-year manufacturer or merchant warranty against manufacturing defects, as specified on the product listing.",
        },
        {
          heading: "How to Claim",
          body: "To claim warranty service, contact our support team with your Order ID, invoice, and a brief description or photo of the issue.",
        },
      ],
    },
    "grievance-officer": {
      slug: "grievance-officer",
      title: "Grievance Officer",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Statutory Compliance",
          body: "In accordance with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000, the contact details of our Grievance Officer are provided below.",
        },
        {
          heading: "Officer Details",
          body: "Name: Grievance Redressal Officer, Storefront • Email: grievance@storefront.in • Phone: +91-98765-43210 • Working Hours: Monday to Friday, 10:00 AM – 6:00 PM IST • Address: Bengaluru, Karnataka, India.",
        },
        {
          heading: "Resolution Timeline",
          body: "All complaints are acknowledged within 48 hours and resolved within 30 days of receipt.",
        },
      ],
    },
    "seller-information": {
      slug: "seller-information",
      title: "Seller Information",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Verified Independent Merchants",
          body: "Products on Storefront are listed and fulfilled by registered merchants who onboard via our Merchant Portal. Each merchant is responsible for product authenticity, accurate descriptions, and timely dispatch.",
        },
        {
          heading: "Becoming a Seller",
          body: "Any business or individual can sign up as a Merchant from the Sign Up page to upload products, manage inventory, and reach customers across India.",
        },
      ],
    },
    "legal-and-gst": {
      slug: "legal-and-gst",
      title: "Legal Business Details & GST Information",
      updatedAt: "November 2026",
      sections: [
        {
          heading: "Legal Entity Details",
          body: "Trade Name: Storefront Marketplace • Registered Location: Bengaluru, Karnataka, India • Support Email: support@storefront.in.",
        },
        {
          heading: "GST Information & Compliant Invoices",
          body: "GSTIN: 29XXXXX0000X1Z5 (Update with your registered GSTIN once applicable). All orders include a GST-compliant tax invoice detailing HSN/SAC codes, taxable value, and CGST/SGST/IGST breakdown where applicable.",
        },
      ],
    },
  };
  
  export const LEGAL_NAV_LINKS = Object.values(LEGAL_PAGES).map((p) => ({
    slug: p.slug,
    title: p.title,
  }));
export const PAYMENT_CONFIG = {
  lemonsqueezy: {
    products: {
      // Legacy one-time products (kept for reference)
      doraAssessment: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/2945d26f-0614-4d67-ab4f-b762870a32f4',
        price: 49,
        name: 'DORA Täishindamine'
      },
      nis2Assessment: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/e6061cd2-dc18-41f6-9f8a-8a97aa9bc088',
        price: 49,
        name: 'NIS2 Täishindamine'
      },
      comboPackage: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/e8674874-f4bc-43cd-bb36-3f48591c8358',
        price: 79,
        name: 'DORA + NIS2 Kombo'
      },
      nis2Report: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/7eeae69d-95e3-4758-996a-ff558ada3bbf',
        price: 29,
        name: 'NIS2 Juhatuse Raport'
      },
      contractAnalysis: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/7288ed23-1448-4cbd-9fb8-818ecabf3cbc',
        price: 39,
        name: 'DORA Lepinguanalüüs'
      },
      contractTemplate: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/287600f5-680e-45f7-949b-47124b1cf026',
        price: 29,
        name: 'DORA Lepingu Template'
      },
      // New subscription products
      professional: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/c1cc62f1-9162-4f27-a57e-9e9cc24e87e5',
        price: 149,
        priceMonthly: '€149/kuu',
        name: 'Professional'
      },
      business: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/ad4319d2-27aa-4cb2-b551-5e92a698dfbf',
        price: 299,
        priceMonthly: '€299/kuu',
        name: 'Business'
      },
      enterprise: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/2a3d37f3-3571-4254-ac95-9aa6e1ee6b20',
        price: 499,
        priceMonthly: '€499/kuu',
        name: 'Enterprise'
      }
    },
    // Subscription plans for freemium model
    subscriptions: {
      professional: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/c1cc62f1-9162-4f27-a57e-9e9cc24e87e5',
        price: 149,
        priceMonthly: '€149/kuu',
        name: 'Professional',
        features: ['DORA või NIS2 täishindamine', 'Detailne tegevuskava', 'PDF raport juhatusele', 'Eesti-spetsiifiline (E-ITS, CERT-EE)']
      },
      business: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/ad4319d2-27aa-4cb2-b551-5e92a698dfbf',
        price: 299,
        priceMonthly: '€299/kuu',
        name: 'Business',
        features: ['Kõik Professional features', 'DORA + NIS2 hindamine', 'Supply Chain Nerve Center', 'ICT pakkujate register (kuni 20)', 'Cross-compliance kaart']
      },
      enterprise: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/2a3d37f3-3571-4254-ac95-9aa6e1ee6b20',
        price: 499,
        priceMonthly: '€499/kuu',
        name: 'Enterprise',
        features: ['Kõik Business features', 'Piiramatult ICT pakkujaid', 'Allhankijate ahela kaardistamine', 'Real-time monitoring', 'RoI generator', 'Ettevõtte brändinguga raportid']
      }
    }
  },
  // Free tier features description
  freeTier: {
    name: 'Tasuta',
    features: [
      'DORA hindamine (37 küsimust)',
      'NIS2 kohaldumise kontroll',
      'Tulemuste vaade',
      'Radar- ja riskikaart',
      'Registri andmete sisestus'
    ]
  }
};

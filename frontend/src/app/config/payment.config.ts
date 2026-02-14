export const PAYMENT_CONFIG = {
  lemonsqueezy: {
    products: {
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
      }
    },
    // Subscription plans for freemium model
    subscriptions: {
      standard: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/2945d26f-0614-4d67-ab4f-b762870a32f4',
        price: 29,
        priceMonthly: '€29/kuu',
        name: 'Standard',
        features: ['PDF raportid', 'Excel eksport', 'Vastavustunnistus', 'Lepingute teavitused']
      },
      enterprise: {
        checkoutUrl: 'https://compliancehub.lemonsqueezy.com/checkout/buy/e8674874-f4bc-43cd-bb36-3f48591c8358',
        price: 79,
        priceMonthly: '€79/kuu',
        name: 'Enterprise',
        features: ['xBRL-CSV regulaatorile', 'API ligipääs', 'Mitme ettevõtte tugi', 'Audit log', 'AI klauslite ümbersõnastaja']
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

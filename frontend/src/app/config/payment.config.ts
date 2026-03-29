export const PAYMENT_CONFIG = {
  stripe: {
    subscriptions: {
      professional: {
        priceId: 'price_1TGHGJ1VuVVH0A8GHBO2fcEs',
        price: 149,
        priceMonthly: '€149/kuu',
        name: 'Professional',
        features: ['DORA või NIS2 täishindamine', 'Detailne tegevuskava', 'PDF raport juhatusele', 'Eesti-spetsiifiline (E-ITS, CERT-EE)']
      },
      business: {
        priceId: 'price_1TGHGq1VuVVH0A8G6ZnBTT3i',
        price: 299,
        priceMonthly: '€299/kuu',
        name: 'Business',
        features: ['Kõik Professional features', 'DORA + NIS2 hindamine', 'Supply Chain Nerve Center', 'ICT pakkujate register (kuni 20)', 'Cross-compliance kaart']
      },
      enterprise: {
        priceId: 'price_1TGHHC1VuVVH0A8GNM5VAtDj',
        price: 499,
        priceMonthly: '€499/kuu',
        name: 'Enterprise',
        features: ['Kõik Business features', 'Piiramatult ICT pakkujaid', 'Allhankijate ahela kaardistamine', 'Real-time monitoring', 'RoI generator', 'Ettevõtte brändinguga raportid']
      }
    },
    products: {
      doraAssessment: {
        priceId: 'price_1TGHBU1VuVVH0A8GyTut91sx',
        price: 49,
        name: 'DORA Täishindamine'
      },
      nis2Assessment: {
        priceId: 'price_1TGHHZ1VuVVH0A8GWtYRRkWP',
        price: 49,
        name: 'NIS2 Täishindamine'
      },
      comboPackage: {
        priceId: 'price_1TGHHz1VuVVH0A8GLyAxixOy',
        price: 79,
        name: 'DORA + NIS2 Kombo'
      },
      nis2Report: {
        priceId: 'price_1TGHIl1VuVVH0A8GKm7iRKB6',
        price: 29,
        name: 'NIS2 Juhatuse Raport'
      },
      contractAnalysis: {
        priceId: 'price_1TGHJX1VuVVH0A8GUJaUMh1L',
        price: 39,
        name: 'DORA Lepinguanalüüs'
      },
      contractTemplate: {
        priceId: 'price_1TGHJ81VuVVH0A8GeAK4aOgP',
        price: 29,
        name: 'DORA Lepingu Template'
      }
    }
  },
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
